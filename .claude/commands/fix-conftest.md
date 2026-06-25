# fix-conftest — Fix the DATABASE_URL env bug in conftest.py

The test suite fails with `OperationalError: psycopg connection refused` when Postgres isn't running locally, because `conftest.py` doesn't set `DATABASE_URL` before pydantic-settings loads the `.env` file.

## The fix

In `/Users/martutoffoletto/facultad/TESIS/DePaso/depaso_rest/tests/conftest.py`, add this line immediately after the `import os` line and before any app imports:

```python
os.environ.setdefault("DATABASE_URL", "sqlite:///:memory:")
```

It must be BEFORE `from src.app.main import create_app` — otherwise pydantic-settings has already read `.env`.

## Steps
1. Read `depaso_rest/tests/conftest.py`
2. Find the `import os` line
3. Add `os.environ.setdefault("DATABASE_URL", "sqlite:///:memory:")` right after `os.environ.setdefault("RATE_LIMIT_ENABLED", "false")`
4. Run `cd depaso_rest && .venv/bin/python -m pytest tests/ -q -p no:warnings 2>&1 | tail -5` to confirm all tests pass without any env override
