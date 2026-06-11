# DePaso REST API — multi-stage build
# Stage 1: install dependencies into an isolated prefix
FROM python:3.12-slim AS builder

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

# Stage 2: slim runtime image
FROM python:3.12-slim

# Run as non-root (RNF-SEC)
RUN useradd --create-home --shell /usr/sbin/nologin depaso

WORKDIR /app

COPY --from=builder /install /usr/local

COPY alembic.ini .
COPY alembic ./alembic
COPY src ./src
COPY scripts ./scripts
COPY ml ./ml

ENV PYTHONUNBUFFERED=1 \
    DEBUG=false \
    ENVIRONMENT=production

USER depaso

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/api/v1/health')"

CMD ["uvicorn", "src.app.main:app", "--host", "0.0.0.0", "--port", "8000"]
