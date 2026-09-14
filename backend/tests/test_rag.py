import pytest
from app.services.rag_engine import rag_engine

def test_rag_index_loaded():
    assert rag_engine.index_loaded is True
    # The hermetic fixture builds a 25-episode mini index (~1000 chunks).
    assert len(rag_engine.chunks) > 400

def test_grounded_retrieval_shreyas_doshi():
    query = "What does Shreyas Doshi teach about pre-mortems and tigers?"
    chunks, citations, score = rag_engine.search(query, top_k=3)
    
    assert len(chunks) > 0
    assert len(citations) == len(chunks)
    assert score > 0.4
    
    # Check top citation guest attribution
    top_citation = citations[0]
    assert "Shreyas Doshi" in top_citation.guest or any("Shreyas" in c.guest for c in citations)
    assert top_citation.timestamp != ""
    assert top_citation.quote != ""
    assert top_citation.relevance_score > 0

def test_grounded_retrieval_elena_verna():
    query = "Elena Verna product-led growth loops B2B"
    chunks, citations, score = rag_engine.search(query, top_k=3)
    
    assert len(chunks) > 0
    assert score > 0.35
    guests = [c.guest.lower() for c in citations]
    assert any("elena" in g for g in guests)

def test_negative_rejection_out_of_domain():
    # Out of domain questions should produce very low relevance score
    irrelevant_query = "What is the traditional Italian recipe for baking sourdough bread with olives?"
    chunks, citations, score = rag_engine.search(irrelevant_query, top_k=3)
    
    # Score should be low, triggering rejection boundary in agent
    assert score < 0.20

def test_chunk_dedup_by_video_id():
    """The index must never contain the same episode twice (duplicate archive dirs)."""
    import collections
    from urllib.parse import urlparse

    def base_url(u):
        if not u:
            return ""
        parts = urlparse(u)
        return f"{parts.scheme}://{parts.netloc}{parts.path}"

    # Map base YouTube URL -> set of episode_ids that reference it.
    by_url = collections.defaultdict(set)
    for c in rag_engine.chunks:
        u = c.get("youtube_url", "")
        base = u.split("&t=")[0] if u else ""
        by_url[base].add(c.get("episode_id", ""))
    dupes = {u: eps for u, eps in by_url.items() if u and len(eps) > 1}
    assert dupes == {}, f"Duplicate episodes in index: {dupes}"

def test_citations_carry_verifiable_sources():
    query = "Shreyas Doshi pre-mortem"
    chunks, citations, score = rag_engine.search(query, top_k=3)
    assert len(chunks) > 0
    for c in citations[:2]:
        assert c.guest, "citation missing guest"
        assert c.title, "citation missing title"
        assert c.timestamp, "citation missing timestamp"
        assert c.quote, "citation missing quote"

def test_instruction_word_query_not_force_rejected():
    """Manual plan UI-07 wording: generic instruction words (create,
    interactive, widget) must not become content tokens and force-reject a
    well-grounded artifact request. Requires the full 150-episode index; the
    25-episode mini index is too small for the PMF topic to clear the gate
    (validated in the live E2E suite instead)."""
    if len(rag_engine.chunks) < 2000:
        pytest.skip("requires the full 150-episode index")
    chunks, citations, score = rag_engine.search("Create an interactive PMF calculator widget", top_k=5)
    assert score >= 0.12
    assert len(citations) > 0

@pytest.mark.asyncio
async def test_follow_up_not_poisoned_by_rejected_previous_turn():
    """Query expansion must not mix a rejected (out-of-domain) previous turn
    into a legitimate short follow-up; the agent retries on the raw message."""
    if len(rag_engine.chunks) < 2000:
        pytest.skip("requires the full 150-episode index")
    from app.services.agent import agent_service
    events = []
    async for ev in agent_service.process_chat(
        message="Pre-mortems for product teams",
        history=[
            {"role": "user", "content": "Create an interactive PMF calculator widget"},
            {"role": "assistant", "content": "Based on the transcripts, this topic is not covered."},
        ],
        session_id="sess-followup",
    ):
        events.append(ev)
    done = next(e for e in events if e["type"] == "done")["data"]
    assert done.get("rejection") is not True
    cites = next(e for e in events if e["type"] == "citations")["data"]
    assert len(cites) > 0

def test_long_deliverable_prompt_not_force_rejected():
    """Rich multi-sentence deliverable prompts referencing genuine domain guests
    and frameworks (e.g. Elena Verna PLG simulator) must never be rejected by the
    lexical coverage gate."""
    if len(rag_engine.chunks) < 2000:
        pytest.skip("requires the full 150-episode index")
    query = (
        "Build an interactive B2B Product-Led Growth (PLG) Loop Simulator based on "
        "Elena Verna's Lenny's Podcast frameworks. Include interactive sliders for "
        "Monthly Active Signups, Free-to-Paid Conversion Rate (0–10%), Net Dollar "
        "Retention (70–140%), and Viral Coefficient / K-factor (0–1.5). Dynamically "
        "calculate 12-month ARR projections with real-time feedback, flag the "
        "'leakiest bucket' in the funnel, and provide Elena Verna's specific tactical "
        "experiments to fix that bottleneck."
    )
    chunks, citations, score = rag_engine.search(query, top_k=5)
    assert score >= 0.12
    assert len(chunks) > 0
    assert any("elena" in c.guest.lower() for c in citations)

