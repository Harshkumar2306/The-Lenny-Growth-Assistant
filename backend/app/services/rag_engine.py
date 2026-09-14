import os
import re
import pickle
import numpy as np
from pathlib import Path
from typing import List, Dict, Any, Tuple
from app.core.config import settings
from app.core.logging import logger
from app.schemas.chat_schemas import CitationItem

class RAGEngine:
    def __init__(self):
        self.index_loaded = False
        self.chunks: List[Dict[str, Any]] = []
        self.bm25 = None
        self.tfidf = None
        self.tfidf_matrix = None
        self._load_index()

    def _load_index(self):
        index_path = Path(settings.SEARCH_INDEX_PATH)
        if not index_path.exists():
            logger.warning(f"Search index not found at {index_path}. Run ingest.py first.")
            return

        try:
            with open(index_path, "rb") as f:
                data = pickle.load(f)
                self.bm25 = data["bm25"]
                self.tfidf = data["tfidf"]
                self.tfidf_matrix = data["tfidf_matrix"]
                self.chunks = data["chunks"]
                self.index_loaded = True
            logger.info(f"Loaded search index with {len(self.chunks)} chunks.")
        except Exception as e:
            logger.error(f"Failed to load search index: {e}")

    DOMAIN_SPECIFIC = {
        "retention", "acquisition", "funnel", "funnels", "growth", "product",
        "market", "customer", "customers", "user", "users", "loop", "loops",
        "churn", "pricing", "pmf", "metric", "metrics", "ltv", "cac", "sales",
        "activation", "onboarding", "engagement", "flywheel", "flywheels",
        "monetization", "compounds", "compounding", "decay"
    }

    FILLER_WORDS = {
        "say", "says", "said", "think", "thinks", "thought", "good", "much",
        "many", "well", "like", "know", "knows", "knew", "really", "very",
        "just", "also", "even", "more", "most", "some", "any", "lenny",
        "podcast", "episode", "episodes", "interview", "guest", "guests"
    }

    def _content_tokens(self, query_tokens: List[str]) -> List[str]:
        """Keep only 'content' tokens: domain-specific growth/product terms or words with IDF >= 2.0.
        Conversational filler (say, think, good, much) and podcast metadata words are excluded.
        Skip digits and single-character noise tokens."""
        vocab = self.tfidf.vocabulary_
        idf_arr = self.tfidf.idf_
        content = []
        for t in query_tokens:
            if len(t) < 2 or t.isdigit():
                continue
            if t in self.DOMAIN_SPECIFIC:
                content.append(t)
            elif t in self.FILLER_WORDS:
                continue
            elif t in vocab:
                if idf_arr[vocab[t]] >= 2.0:
                    content.append(t)
            else:
                content.append(t)
        return content or [t for t in query_tokens if len(t) >= 2 and not t.isdigit()] or query_tokens

    def search(self, query: str, top_k: int = 5, guest_filter: str = None) -> Tuple[List[Dict[str, Any]], List[CitationItem], float]:
        """
        Hybrid BM25 + TF-IDF retrieval with citations.
        Returns: (ranked_chunks, citation_items, max_score)
        """
        if not self.index_loaded or not self.chunks:
            return [], [], 0.0

        STOP_WORDS = {
            "a", "an", "and", "are", "as", "at", "be", "by", "for", "from", "has", "he",
            "in", "is", "it", "its", "of", "on", "that", "the", "to", "was", "were",
            "will", "with", "what", "how", "who", "when", "where", "which", "why",
            "me", "my", "we", "you", "i", "can", "do", "does", "should", "about", "tell",
            # Meta instructional and deliverable words
            "write", "writing", "executive", "ship", "draft", "article", "post",
            # Generic instruction/artifact words. They are rare in the transcript
            # corpus (hence high IDF) but carry no domain meaning; without this
            # they become 'content tokens' and the coverage gate force-rejects
            # perfectly grounded requests like
            # "Create an interactive PMF calculator widget" (manual plan UI-07).
            "create", "creating", "made", "make", "making", "build", "building",
            "interactive", "widget", "widgets", "generate", "generating",
            "please", "want", "need",
            # Conversion-request boilerplate from the "Turn into Ship 30" button
            # ("Convert this strategic insight into a Ship 30 for 30 essay...").
            "convert", "converting", "turn", "turning", "into",
            "essay", "essays", "retrieve", "retrieved", "retrieving",
            # Deliverable and prompt instruction words
            "simulator", "simulators", "slider", "sliders", "dashboard", "dashboards",
            "calculate", "calculating", "calculator", "calculators", "projection",
            "projections", "template", "templates", "matrix", "matrices",
            "include", "including", "based", "provide", "providing", "dynamically",
            "guide", "step", "steps",
        }
        query_clean = query.strip()
        all_tokens = re.findall(r'\w+', query_clean.lower())
        query_tokens = [t for t in all_tokens if t not in STOP_WORDS and len(t) >= 2 and not t.isdigit()]
        if not query_tokens:
            query_tokens = [t for t in all_tokens if len(t) >= 2 and not t.isdigit()]
        if not query_tokens:
            query_tokens = all_tokens
        if not query_tokens:
            return [], [], 0.0

        content_tokens = self._content_tokens(query_tokens)

        # 1. BM25 Scores (absolute saturation scale)
        bm25_raw_scores = self.bm25.get_scores(query_tokens)
        bm25_norm = np.clip(bm25_raw_scores / 15.0, 0.0, 1.0)

        # 2. TF-IDF Cosine Similarity (strip stopwords to focus on content semantics)
        q_str = " ".join(query_tokens) if query_tokens else query_clean
        query_vec = self.tfidf.transform([q_str])
        tfidf_sim = (self.tfidf_matrix * query_vec.T).toarray().flatten()

        # 3. Hybrid Score with Semantic Gating (prevents incidental single-keyword hits)
        semantic_gate = np.clip(tfidf_sim / 0.12, 0.0, 1.0)
        hybrid_scores = (0.5 * bm25_norm + 0.5 * tfidf_sim) * semantic_gate

        # 4. Lexical Coverage Gate (corpus-independent rejection): a candidate
        #    chunk must actually contain a meaningful share of the query's
        #    content words. Without this, incidental product-language overlap
        #    (e.g. "cake" in a Lyft launch anecdote) pushes out-of-domain
        #    queries above the rejection threshold on smaller corpora.
        #
        #    Two-phase ranking keeps the gate consistent: the coverage factor
        #    is computed for a generous candidate window, and everything
        #    outside the window is zeroed (an ungated low-rank chunk must not
        #    outrank a gated candidate).
        candidate_window = min(len(self.chunks), max(top_k * 4, 200))
        cand_indices = np.argsort(hybrid_scores)[::-1][:candidate_window]
        gated_scores = np.zeros_like(hybrid_scores)
        for idx in cand_indices:
            text_lower = self.chunks[idx]["text"].lower()
            coverage = sum(1 for t in content_tokens if t in text_lower) / len(content_tokens)
            gated_scores[idx] = hybrid_scores[idx] * (0.25 + 0.75 * coverage)

        # 5. Optional Guest filter bonus
        if guest_filter:
            guest_lower = guest_filter.lower()
            for idx, chunk in enumerate(self.chunks):
                if guest_lower in chunk.get("guest", "").lower():
                    gated_scores[idx] += 0.35

        # Rank indices
        top_indices = np.argsort(gated_scores)[::-1][:top_k * 2]

        results = []
        citations = []
        max_score = float(gated_scores[top_indices[0]]) if len(top_indices) > 0 else 0.0

        # 6. Coverage rejection: multi-content-word queries must find ONE
        #    chunk that actually covers them (coverage spread across unrelated
        #    chunks is not grounding — it is how "recipe + cake" anecdotes
        #    sneak past the gate). Single-token queries ("pricing") rely on
        #    the score threshold alone.
        if len(content_tokens) >= 2 and top_indices.size:
            best_idx = top_indices[0]
            best_text = self.chunks[best_idx]["text"].lower()
            matched = [t for t in content_tokens if t in best_text]
            best_coverage = len(matched) / len(content_tokens)
            if len(content_tokens) == 2:
                if len(matched) < 2:
                    max_score = 0.0
            elif len(content_tokens) <= 7:
                if best_coverage < 0.35 and len(matched) < 2:
                    max_score = 0.0
            else:
                # Long queries (> 7 content tokens): rich deliverable prompts
                # cannot be expected to match >50% of 20+ words in a single 250-word chunk.
                # Must match at least 4 distinct content terms, or at least 3 with >= 25% coverage.
                if len(matched) < 4 and (len(matched) < 3 or best_coverage < 0.25):
                    max_score = 0.0

        for idx in top_indices:
            score = float(gated_scores[idx])
            # Minimum relevance threshold
            if score < 0.08 and len(results) >= 2:
                break

            chunk = self.chunks[idx]
            
            # Extract most relevant short quote from chunk
            quote = self._extract_relevant_quote(chunk["text"], query_tokens)

            citation = CitationItem(
                guest=chunk.get("guest", "Unknown"),
                title=chunk.get("title", "Lenny's Podcast Episode"),
                youtube_url=chunk.get("youtube_url", ""),
                timestamp=chunk.get("timestamp", "00:00:00"),
                quote=quote,
                relevance_score=round(score, 3)
            )

            results.append(chunk)
            citations.append(citation)

            if len(results) >= top_k:
                break

        return results, citations, max_score

    def _extract_relevant_quote(self, text: str, query_tokens: List[str]) -> str:
        sentences = re.split(r'(?<=[.!?])\s+', text)
        best_sentence = ""
        best_matches = -1

        for sentence in sentences:
            s_lower = sentence.lower()
            matches = sum(1 for tok in query_tokens if tok in s_lower)
            if matches > best_matches:
                best_matches = matches
                best_sentence = sentence

        if best_sentence:
            return best_sentence.strip()[:240] + "..." if len(best_sentence) > 240 else best_sentence.strip()
        return text[:200].strip() + "..."

rag_engine = RAGEngine()
