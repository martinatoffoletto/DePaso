#!/bin/bash
# start.sh — Levanta todo el stack de DePaso en local
# Uso: ./start.sh
# Abre la DB en Docker, seedea, y lanza backend + frontend en tabs separados.

set -e

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$ROOT_DIR/depaso_rest"
FRONTEND_DIR="$ROOT_DIR/depaso_app"

# ── Colores ────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log()  { echo -e "${GREEN}[depaso]${NC} $1"; }
warn() { echo -e "${YELLOW}[depaso]${NC} $1"; }
err()  { echo -e "${RED}[depaso]${NC} $1"; exit 1; }

# ── 1. Docker Desktop ──────────────────────────────────────────────────────
log "Verificando Docker Desktop..."
if ! docker info &>/dev/null; then
  warn "Docker no está corriendo. Abriendo Docker Desktop..."
  open -a Docker
  echo -n "  Esperando que Docker inicie"
  until docker info &>/dev/null; do
    echo -n "."
    sleep 2
  done
  echo ""
  log "Docker listo."
fi

# ── 2. Contenedor PostgreSQL + PostGIS ────────────────────────────────────
log "Levantando contenedor depaso_db..."
cd "$ROOT_DIR"
docker compose up -d

echo -n "  Esperando que la DB esté healthy"
until docker compose exec -T db pg_isready -U depaso -d depaso_dev &>/dev/null; do
  echo -n "."
  sleep 2
done
echo ""
log "Base de datos lista en localhost:5432"

# ── 3. Seed (solo si el venv existe) ──────────────────────────────────────
VENV="$BACKEND_DIR/.venv"
if [ ! -d "$VENV" ]; then
  warn "Venv no encontrado en depaso_rest/.venv"
  warn "Ejecutá primero: cd depaso_rest && python -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt"
  err "Abortando."
fi

log "Ejecutando seed de base de datos..."
cd "$BACKEND_DIR"
"$VENV/bin/python" scripts/seed_db.py

# ── 4. Backend en nueva ventana de Terminal ───────────────────────────────
log "Abriendo backend en nueva ventana..."
osascript <<EOF
tell application "Terminal"
  activate
  do script "cd '$BACKEND_DIR' && source .venv/bin/activate && python -m uvicorn src.app.main:app --reload --host 0.0.0.0 --port 8000"
end tell
EOF

sleep 2  # Dale un segundo para que arranque

# ── 5. Frontend en nueva ventana de Terminal ──────────────────────────────
log "Abriendo frontend en nueva ventana..."
osascript <<EOF
tell application "Terminal"
  activate
  do script "cd '$FRONTEND_DIR' && npm run start"
end tell
EOF

# ── Listo ─────────────────────────────────────────────────────────────────
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  DePaso stack levantado${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "  DB:       postgresql://depaso:***@localhost:5432/depaso_dev"
echo "  Backend:  http://localhost:8000/api/v1/docs"
echo "  Frontend: Expo (presioná 'i' para iOS, 'a' para Android)"
echo ""
echo "  Credenciales de prueba:"
echo "    cliente@depaso.com / password123"
echo "    lucia@depaso.com   / password123"
echo ""
