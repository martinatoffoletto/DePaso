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

COPY src ./src
COPY scripts ./scripts
# ml/ is intentionally excluded — the model is injected at runtime via VISION_MODEL_PATH env var

ENV PYTHONUNBUFFERED=1 \
    DEBUG=false \
    ENVIRONMENT=production

USER depaso

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/api/v1/health')"

# El esquema se crea al arrancar (create_all en el lifespan de main.py).
# --proxy-headers: la IP real del cliente llega en X-Forwarded-For; el rate
# limit por IP la necesita para no agrupar a todos detrás del proxy.
CMD ["uvicorn", "src.app.main:app", "--host", "0.0.0.0", "--port", "8000", "--proxy-headers", "--forwarded-allow-ips", "*"]
