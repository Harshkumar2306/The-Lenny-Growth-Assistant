#!/usr/bin/env bash
# ====================================================================
# The Lenny Growth Assistant - 1-Command Startup Script
# ====================================================================

set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"

echo "===================================================================="
echo "🚀 Starting The Lenny Growth Assistant (Forward Deployed Engineer)"
echo "===================================================================="

# 0. Ensure a local .env exists (safe defaults, no secrets committed)
if [ ! -f ".env" ]; then
    echo "📄 Creating .env from .env.example (safe defaults)..."
    cp .env.example .env
fi

# 1. Check Python virtual environment
if [ ! -d ".venv" ]; then
    echo "📦 Creating virtual environment (.venv)..."
    python3 -m venv .venv
    .venv/bin/pip install --upgrade pip
    .venv/bin/pip install -r backend/requirements.txt
fi

# 2. Check if search index exists
if [ ! -f "data/search_index.pkl" ]; then
    echo "📚 Ingesting and indexing Lenny's Podcast transcripts (~10 seconds)..."
    PYTHONPATH=backend .venv/bin/python backend/scripts/ingest.py 150
fi

# 3. Check Ollama
if command -v ollama >/dev/null 2>&1; then
    echo "🦙 Checking Ollama local runtime..."
    if ! curl -s --max-time 2 http://localhost:11434/api/tags >/dev/null 2>&1; then
        echo "   Starting background ollama serve daemon..."
        ollama serve >/dev/null 2>&1 &
        sleep 2
    fi
    if ! ollama list 2>/dev/null | grep -q "llama3.2:1b"; then
        echo "⬇️  Pulling local demo model (llama3.2:1b)..."
        ollama pull llama3.2:1b || echo "   ⚠️  Model pull failed — cloud providers still work via .env"
    fi
else
    echo "⚠️  Ollama command not detected. You can run with Cloud Groq / Anthropic via .env"
fi

# 4. Check Frontend node_modules
if [ ! -d "frontend/node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    npm --prefix frontend ci || npm --prefix frontend install
fi

# Clean up previously orphaned *app* processes on 8000/5173 only. Never kill
# unrelated processes that happen to share a port.
for PORT in 8000 5173; do
    PIDS=$(lsof -ti:$PORT 2>/dev/null || true)
    for PID in $PIDS; do
        CMD=$(ps -p "$PID" -o comm= 2>/dev/null || echo "")
        case "$CMD" in
            python|python3|uvicorn|node|npm)
                echo "   Reclaiming port $PORT (stale $CMD process $PID)..."
                kill "$PID" 2>/dev/null || true
                sleep 1
                kill -9 "$PID" 2>/dev/null || true
                ;;
            *)
                echo "   ⚠️  Port $PORT is used by $CMD (PID $PID) — leaving it alone."
                ;;
        esac
    done
done

# 5. Start Backend
echo "⚡ Starting FastAPI Backend on http://localhost:8000..."
PYTHONPATH=backend .venv/bin/python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

# 6. Start Frontend
echo "💻 Starting React + Vite Frontend on http://localhost:5173..."
npm --prefix frontend run dev &
FRONTEND_PID=$!

cleanup() {
    echo ""
    echo "🛑 Shutting down Lenny Growth Assistant..."
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    exit 0
}

trap cleanup SIGINT SIGTERM

echo "===================================================================="
echo "✅ The Lenny Growth Assistant is LIVE!"
echo "   👉 Web Interface:  http://localhost:5173"
echo "   👉 API Docs:       http://localhost:8000/docs"
echo "   👉 System Health:  http://localhost:8000/api/health"
echo "===================================================================="
echo "Press Ctrl+C to stop all services."

# Open the browser for convenience (best effort, non-fatal).
(sleep 2; command -v open >/dev/null 2>&1 && open http://localhost:5173) || \
(sleep 2; command -v xdg-open >/dev/null 2>&1 && xdg-open http://localhost:5173) || true

wait
