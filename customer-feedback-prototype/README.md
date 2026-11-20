# InsightIQ — Customer Feedback Prototype

Academic mini-prototype for LLM/RAG-based customer feedback analysis.

## Stack

- React 19, TypeScript, Vite, Recharts, Lucide, Axios
- FastAPI, Pydantic, Pandas, scikit-learn TF-IDF
- Optional Gemini or OpenAI API integration

## Active Dataset

The application loaded a 3,000-record stream from `silva-fox/amazon-reviews-2023-sample`, `100k` configuration. Preprocessing removed empty text and duplicates, leaving 2,954 normalized records locally at `backend/data/sample_reviews.csv`.

The official `McAuley-Lab/Amazon-Reviews-2023` `raw_review_All_Beauty` loader was inspected but could not run under the current `datasets` library because it uses a dataset script disabled by this environment. The community-hosted sample is a reduced subset of Amazon Reviews 2023 and is clearly labelled real.

Sentiment is derived only from rating: 1–2 Negative, 3 Neutral, 4–5 Positive.

## Run

Backend:

```powershell
cd "C:\Users\bmb96\OneDrive\Desktop\MPJ\customer-feedback-prototype\backend"
.\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Frontend:

```powershell
cd "C:\Users\bmb96\OneDrive\Desktop\MPJ\customer-feedback-prototype\frontend"
npm.cmd run dev -- --host 0.0.0.0
```

- Frontend: http://localhost:5173
- Backend: http://localhost:8000
- API docs: http://localhost:8000/docs

## Environment

Copy `backend/.env.example` to `backend/.env` and optionally configure:

```env
LLM_PROVIDER=gemini
LLM_MODEL=gemini-2.0-flash
GEMINI_API_KEY=your_key
```

Without a key, summaries and chat use clearly labelled demo/extractive responses based on actual dataset records.

## Demo Flow

1. Dashboard: dynamic KPIs and charts.
2. Reviews: search, filter, paginate, and open a detail drawer.
3. AI Summary: select sentiment and generate a report.
4. Ask Questions: ask a suggested question and expand supporting reviews.
5. Dataset: inspect source/status or upload a CSV and re-index.

## Limitations

- Retrieval uses TF-IDF, not downloadable embeddings or ChromaDB.
- No API key is configured, so live LLM mode is demo mode.
- Uploaded CSV support is limited to normalized `rating`, `title`, `text`, `asin`, `parent_asin`, `timestamp`, `verified_purchase`, and `helpful_vote` fields.
