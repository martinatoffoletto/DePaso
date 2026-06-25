# demo-check — Pre-defense checklist

Runs a full readiness check before the thesis defense demo. Checks every layer.

## What to verify

### 1. Backend tests
```bash
cd /Users/martutoffoletto/facultad/TESIS/DePaso/depaso_rest && \
  DATABASE_URL="sqlite:///./depaso_test.db" RATE_LIMIT_ENABLED=false \
  .venv/bin/python -m pytest tests/ -q -p no:warnings 2>&1 | tail -5
```

### 2. TypeScript clean
```bash
cd /Users/martutoffoletto/facultad/TESIS/DePaso/depaso_app && npx tsc --noEmit 2>&1 | tail -10
```

### 3. Backend health (local)
```bash
curl -s http://localhost:8000/api/v1/health | python3 -m json.tool
```

### 4. Backend health (Render)
```bash
curl -s https://depaso-api.onrender.com/api/v1/health | python3 -m json.tool
```

### 5. Vision endpoint
```bash
curl -s -X POST http://localhost:8000/api/v1/vision/classify \
  -H "Content-Type: application/json" \
  -d '{"image_base64": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", "has_reference_object": false}' \
  | python3 -m json.tool
```

After running all checks, produce a clear ✓/✗ table:

| Check | Status | Notes |
|-------|--------|-------|
| Backend tests | ✓/✗ | N passed, M failed |
| TypeScript | ✓/✗ | N errors |
| API local | ✓/✗ | |
| API Render | ✓/✗ | |
| Vision endpoint | ✓/✗ | model/stub |

Then list any ✗ items with the exact fix needed.
