# test — Run the backend test suite

Run pytest with SQLite override so tests don't need a local Postgres instance.

```bash
cd /Users/martutoffoletto/facultad/TESIS/DePaso/depaso_rest && \
  DATABASE_URL="sqlite:///./depaso_test.db" RATE_LIMIT_ENABLED=false \
  .venv/bin/python -m pytest tests/ -q -p no:warnings $ARGUMENTS
```

If `$ARGUMENTS` includes a path (e.g. `tests/test_auth.py`) run only that file.
If `$ARGUMENTS` includes `--cov`, add `--cov=src --cov-report=term-missing`.

After running, report:
- Total tests passed / failed / error
- Any traceback for failures (full, not truncated)
- Current coverage % if `--cov` was passed
