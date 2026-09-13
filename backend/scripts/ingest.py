#!/usr/bin/env python3
"""
Transcript Ingestion Pipeline for Lenny's Podcast
Extracts YAML frontmatter, parses speaker turns & timestamps,
chunks text semantically, and builds an optimized hybrid search index.
"""
import os
import re
import json
import pickle
import yaml
from pathlib import Path
from typing import List, Dict, Any

BASE_DIR = Path(__file__).resolve().parent.parent.parent
TRANSCRIPTS_DIR = BASE_DIR / "data" / "transcripts_raw" / "episodes"
# Output paths are overridable via environment (used by tests and CI to
# avoid writing build artifacts into the repository tree).
OUTPUT_INDEX_JSON = Path(os.environ.get("LENNY_INDEX_JSON", BASE_DIR / "data" / "transcripts_index.json"))
OUTPUT_SEARCH_PKL = Path(os.environ.get("LENNY_SEARCH_PKL", BASE_DIR / "data" / "search_index.pkl"))

def parse_transcript_file(file_path: Path) -> Dict[str, Any] | None:
    try:
        content = file_path.read_text(encoding="utf-8")
    except Exception as e:
        print(f"Error reading {file_path}: {e}")
        return None

    # Parse YAML frontmatter
    frontmatter = {}
    body = content
    if content.startswith("---"):
        parts = content.split("---", 2)
        if len(parts) >= 3:
            try:
                frontmatter = yaml.safe_load(parts[1]) or {}
            except Exception as e:
                print(f"YAML parse error in {file_path}: {e}")
            body = parts[2]

    guest = frontmatter.get("guest", file_path.parent.name.replace("-", " ").title())
    title = frontmatter.get("title", f"Interview with {guest}")
    youtube_url = frontmatter.get("youtube_url", "")
    video_id = frontmatter.get("video_id", "")
    publish_date = str(frontmatter.get("publish_date", ""))
    keywords = frontmatter.get("keywords", [])
    if isinstance(keywords, list):
        keywords_str = ", ".join([str(k) for k in keywords])
    else:
        keywords_str = str(keywords)

    # Clean body: find ## Transcript or start after title
    transcript_idx = body.find("## Transcript")
    if transcript_idx != -1:
        body = body[transcript_idx + len("## Transcript"):]

    # Match speaker turns: e.g. "Speaker Name (00:01:23):" or "Lenny (01:23):"
    speaker_pattern = re.compile(r'(?:^|\n)([A-Za-z0-9\s\.\,\-\'\"]+?)\s*\(([\d]{1,2}:[\d]{2}(?::[\d]{2})?)\):\s*')
    
    matches = list(speaker_pattern.finditer(body))
    turns = []
    if matches:
        for i, match in enumerate(matches):
            speaker = match.group(1).strip()
            timestamp = match.group(2).strip()
            start_pos = match.end()
            end_pos = matches[i + 1].start() if i + 1 < len(matches) else len(body)
            turn_text = body[start_pos:end_pos].strip()
            if turn_text:
                turns.append({
                    "speaker": speaker,
                    "timestamp": timestamp,
                    "text": turn_text
                })
    else:
        # Fallback to paragraph splitting if no speaker turns found
        paragraphs = [p.strip() for p in body.split("\n\n") if p.strip()]
        for p in paragraphs:
            turns.append({
                "speaker": guest,
                "timestamp": "00:00:00",
                "text": p
            })

    # Group turns into semantic chunks (~350 - 650 words per chunk)
    chunks = []
    current_chunk_turns = []
    current_word_count = 0
    chunk_index = 0

    for turn in turns:
        # Skip ad sponsor turns if obvious
        text_lower = turn["text"].lower()
        if ("this episode is brought to you by" in text_lower or 
            "thank you to our sponsor" in text_lower or
            "head over to coda.io" in text_lower or
            "visit productboard.com" in text_lower):
            continue

        turn_words = len(turn["text"].split())
        current_chunk_turns.append(turn)
        current_word_count += turn_words

        if current_word_count >= 400:
            first_turn = current_chunk_turns[0]
            chunk_text = "\n".join([f"{t['speaker']} ({t['timestamp']}): {t['text']}" for t in current_chunk_turns])
            
            # Form timestamp link if youtube URL available
            ts = first_turn['timestamp']
            ts_parts = ts.split(":")
            ts_seconds = 0
            if len(ts_parts) == 3:
                ts_seconds = int(ts_parts[0]) * 3600 + int(ts_parts[1]) * 60 + int(ts_parts[2])
            elif len(ts_parts) == 2:
                ts_seconds = int(ts_parts[0]) * 60 + int(ts_parts[1])
            
            if youtube_url:
                delimiter = "&" if "?" in youtube_url else "?"
                yt_link_with_time = f"{youtube_url}{delimiter}t={ts_seconds}s"
            else:
                yt_link_with_time = ""

            chunks.append({
                "chunk_id": f"{file_path.parent.name}_{chunk_index}",
                "episode_id": file_path.parent.name,
                "guest": guest,
                "title": title,
                "youtube_url": yt_link_with_time or youtube_url,
                "timestamp": first_turn["timestamp"],
                "speaker": first_turn["speaker"],
                "text": chunk_text,
                "keywords": keywords_str,
            })
            chunk_index += 1
            # Overlap: keep the last turn for smooth context transition
            current_chunk_turns = [turn]
            current_word_count = turn_words

    # Remaining turns
    if current_chunk_turns:
        first_turn = current_chunk_turns[0]
        chunk_text = "\n".join([f"{t['speaker']} ({t['timestamp']}): {t['text']}" for t in current_chunk_turns])
        ts = first_turn['timestamp']
        ts_parts = ts.split(":")
        ts_seconds = 0
        if len(ts_parts) == 3:
            ts_seconds = int(ts_parts[0]) * 3600 + int(ts_parts[1]) * 60 + int(ts_parts[2])
        elif len(ts_parts) == 2:
            ts_seconds = int(ts_parts[0]) * 60 + int(ts_parts[1])

        if youtube_url:
            delimiter = "&" if "?" in youtube_url else "?"
            yt_link_with_time = f"{youtube_url}{delimiter}t={ts_seconds}s"
        else:
            yt_link_with_time = ""

        chunks.append({
            "chunk_id": f"{file_path.parent.name}_{chunk_index}",
            "episode_id": file_path.parent.name,
            "guest": guest,
            "title": title,
            "youtube_url": yt_link_with_time or youtube_url,
            "timestamp": first_turn["timestamp"],
            "speaker": first_turn["speaker"],
            "text": chunk_text,
            "keywords": keywords_str,
        })

    return {
        "episode_id": file_path.parent.name,
        "guest": guest,
        "title": title,
        "youtube_url": youtube_url,
        "video_id": video_id,
        "publish_date": publish_date,
        "keywords": keywords,
        "chunks": chunks
    }

def main(max_episodes: int = 150):
    print("Starting Lenny Transcript Ingestion...")
    if not TRANSCRIPTS_DIR.exists():
        print(f"Directory {TRANSCRIPTS_DIR} does not exist. Please clone the repository first.")
        return

    episodes_dirs = sorted([d for d in TRANSCRIPTS_DIR.iterdir() if d.is_dir()])
    print(f"Found {len(episodes_dirs)} total episode directories.")

    all_episodes = []
    all_chunks = []

    # Prioritize top impactful guests + all others up to max_episodes
    priority_guests = [
        "shreyas-doshi", "brian-chesky", "elena-verna", "casey-winters",
        "gibson-biddle", "geoffrey-moore", "annie-duke", "marty-cagan",
        "gustaf-alstromer", "bob-moesta", "ken-norton", "fareed-mosavat",
        "dan-olsen", "eirini-schlosser", "ethan-smith", "rahul-vohra"
    ]
    
    # Sort with priority first
    sorted_dirs = []
    for pg in priority_guests:
        p = TRANSCRIPTS_DIR / pg
        if p.exists() and p not in sorted_dirs:
            sorted_dirs.append(p)
    for p in episodes_dirs:
        if p not in sorted_dirs:
            sorted_dirs.append(p)

    selected_dirs = sorted_dirs[:max_episodes]
    print(f"Processing {len(selected_dirs)} curated episodes for high-speed indexing...")

    seen_video_ids = set()
    for i, ep_dir in enumerate(selected_dirs):
        transcript_file = ep_dir / "transcript.md"
        if not transcript_file.exists():
            continue
        parsed = parse_transcript_file(transcript_file)
        if not parsed or not parsed["chunks"]:
            continue

        # De-duplicate by video id: the archive occasionally contains the same
        # episode under two slightly different directory names, which would
        # double-weight that episode in the search index.
        video_id = parsed.get("video_id") or ""
        if video_id and video_id in seen_video_ids:
            print(f"  Skipping duplicate episode {ep_dir.name} (video_id={video_id} already indexed)")
            continue
        seen_video_ids.add(video_id)

        chunks = parsed.pop("chunks")
        parsed["chunk_count"] = len(chunks)
        all_episodes.append(parsed)
        all_chunks.extend(chunks)
        if (i + 1) % 25 == 0 or i == len(selected_dirs) - 1:
            print(f"  Processed {i + 1}/{len(selected_dirs)} episodes ({len(all_chunks)} chunks so far)")

    print(f"\nTotal Processed: {len(all_episodes)} episodes, {len(all_chunks)} semantic dialogue chunks.")

    OUTPUT_INDEX_JSON.parent.mkdir(parents=True, exist_ok=True)
    # The JSON sidecar keeps episode metadata only (no chunk text) so the
    # repository stays small; full chunk data lives in the pickle index.
    with open(OUTPUT_INDEX_JSON, "w", encoding="utf-8") as f:
        json.dump({
            "total_episodes": len(all_episodes),
            "total_chunks": len(all_chunks),
            "episodes": all_episodes,
        }, f, indent=2)
    print(f"Saved transcript index JSON to: {OUTPUT_INDEX_JSON}")

    # Build BM25 + TF-IDF hybrid index for fast offline retrieval
    print("Building hybrid BM25 + TF-IDF index for instant retrieval...")
    from sklearn.feature_extraction.text import TfidfVectorizer
    from rank_bm25 import BM25Okapi

    corpus_texts = [
        f"{c['guest']} {c['title']} {c['keywords']} {c['text']}" for c in all_chunks
    ]
    
    # BM25 Tokenization
    tokenized_corpus = [re.findall(r'\w+', doc.lower()) for doc in corpus_texts]
    bm25 = BM25Okapi(tokenized_corpus)

    # TF-IDF Vectorizer
    tfidf = TfidfVectorizer(max_features=25000, stop_words="english", ngram_range=(1, 2))
    tfidf_matrix = tfidf.fit_transform(corpus_texts)

    with open(OUTPUT_SEARCH_PKL, "wb") as f:
        pickle.dump({
            "bm25": bm25,
            "tfidf": tfidf,
            "tfidf_matrix": tfidf_matrix,
            "chunks": all_chunks
        }, f)
    print(f"Saved precomputed search index to: {OUTPUT_SEARCH_PKL}")
    print("Ingestion & indexing complete!")

if __name__ == "__main__":
    import sys
    max_eps = int(sys.argv[1]) if len(sys.argv) > 1 else 150
    main(max_episodes=max_eps)
