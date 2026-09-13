# Agent Transcript 04: RAG Grounding & Negative Rejection Debugging

**Phase:** RAG & Grounding  
**Date:** 2026-09-12  
**Status:** Completed  

---

## 1. Failed Attempt: The Normalization Bug & Out-of-Domain False Positives
During unit testing of `test_negative_rejection_out_of_domain`, the query:
*"What is the traditional Italian recipe for baking sourdough bread with olives?"*
unexpectedly returned a high relevance score of **0.617**, causing the test to fail.

### Root Cause Analysis:
1. **Unfiltered Stop Words:** The query tokenizer included stop words like `"what"`, `"is"`, `"the"`, `"for"`, and `"with"`.
2. **Relative Normalization Flaw:**
   ```python
   bm25_raw_scores = self.bm25.get_scores(query_tokens)
   max_bm25 = np.max(bm25_raw_scores)
   bm25_norm = bm25_raw_scores / max_bm25  # <-- CRITICAL BUG!
   ```
   Dividing by `max_bm25` forced the top scoring chunk to ALWAYS equal 1.0, even if the absolute match was just an incidental hit on the word "recipe" used metaphorically in an episode!
   `0.6 * 1.0 + 0.4 * 0.04 = 0.616`!

## 2. The Correction: Semantic Gating
To ensure accurate negative boundary rejection without false positives:
1. **Filtered English Stop Words:** Removed conversational noise words from BM25 token matching.
2. **Absolute Saturation Scale:** Scaled BM25 by an absolute saturation constant:
   `bm25_norm = np.clip(bm25_raw_scores / 15.0, 0.0, 1.0)`
3. **Semantic Gate via Cosine Similarity:**
   ```python
   semantic_gate = np.clip(tfidf_sim / 0.12, 0.0, 1.0)
   hybrid_scores = (0.5 * bm25_norm + 0.5 * tfidf_sim) * semantic_gate
   ```
   If a query has no semantic relevance to product/growth concepts in the corpus, `semantic_gate` drops to ~0.0, penalizing incidental keyword hits.

### Verification Results:
- *Irrelevant Sourdough Bread Recipe:* Score dropped from **0.617 &rarr; 0.195** (Clean Negative Rejection).
- *Shreyas Doshi Pre-Mortems:* Score retained at **0.763** (High Grounded Precision).
- *Elena Verna PLG Loops:* Score retained at **0.711** (High Grounded Precision).
