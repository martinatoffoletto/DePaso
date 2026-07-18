#!/bin/bash
# Development server startup script

set -e

echo "🚀 Starting DePaso REST API development server..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating from .env.example..."
    cp .env.example .env
    echo "✅ Created .env file. Please update with your configuration."
fi

# Activate virtual environment if it exists
if [ -d ".venv" ]; then
    echo "📦 Activating virtual environment..."
    source .venv/bin/activate
fi

# Install dependencies if needed
if ! python -c "import fastapi" 2>/dev/null; then
    echo "📦 Installing dependencies..."
    pip install -r requirements.txt
fi

# Sin migraciones (MVP): el esquema lo crea create_all() en el seed y al arrancar la app.

# Seed database (optional)
echo "🌱 Seeding database with sample data..."
python scripts/seed_db.py || echo "⚠️  Seeding failed, continuing with empty database..."

# Start the server
echo "✅ Starting server..."
echo "📍 API will be available at http://localhost:8000"
echo "📚 API docs at http://localhost:8000/api/v1/docs"

uvicorn src.app.main:app \
    --host 0.0.0.0 \
    --port 8000 \
    --reload
