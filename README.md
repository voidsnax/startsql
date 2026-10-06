# StartSQL

An interactive SQL learning platform for absolute beginners, with an AI tutor.

## Prerequisites

- Python 3.12+
- Node.js 20+
- [uv](https://docs.astral.sh/uv/) (`curl -LsSf https://astral.sh/uv/install.sh | sh`)
- A free Gemini API key from https://aistudio.google.com/apikey

## Setup

### Backend

```bash
cd backend
uv sync
echo "GEMINI_API_KEY=your_key_here" > .env
```

### Frontend

```bash
cd frontend
npm install
```

### Running

Terminal 1 — backend:

```bash
cd backend
uv run uvicorn app.main:app --reload --port 8000
```

Terminal 2 — frontend:
```bash
cd frontend
npm run dev

