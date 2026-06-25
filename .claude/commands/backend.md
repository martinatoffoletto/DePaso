# backend — Start the DePaso API server

Starts FastAPI with hot reload on port 8000.

```bash
cd /Users/martutoffoletto/facultad/TESIS/DePaso/depaso_rest && ./start.sh
```

If `./start.sh` fails or doesn't exist, fall back to:
```bash
cd /Users/martutoffoletto/facultad/TESIS/DePaso/depaso_rest && \
  .venv/bin/uvicorn src.app.main:app --reload --port 8000
```

After starting, tell the user:
- API base URL: http://localhost:8000
- Interactive docs: http://localhost:8000/docs
- Health check: http://localhost:8000/api/v1/health
- Remind them that `.env` must point to a running Postgres instance; for local dev without Postgres set `DATABASE_URL="sqlite:///./depaso_dev.db"`
