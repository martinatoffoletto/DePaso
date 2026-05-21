# DePaso REST API

Collaborative urban logistics platform backend - REST API built with FastAPI, SQLAlchemy 2.0, and PostgreSQL+PostGIS.

## Overview

DePaso is a platform that connects clients needing shipments with carriers providing transportation. The system intelligently matches shipments with the best available carriers using a deterministic scoring algorithm, while tracking CO2 savings and providing real-time tracking capabilities.

**Key Features:**

- ✅ JWT-based authentication (register, login, token refresh)
- ✅ User management (clients and carriers)
- ✅ Carrier management with reputation system
- ✅ Shipment creation and tracking
- ✅ Intelligent carrier matching algorithm (deterministic, no ML)
- ✅ CO2 savings calculation
- ✅ Package size catalog
- ✅ Vision module for image classification (TODO: MobileNetV2)
- ✅ Geographic queries with PostGIS
- ✅ Comprehensive error handling
- ✅ Structured logging

## Tech Stack

| Component       | Version | Purpose             |
| --------------- | ------- | ------------------- |
| **Python**      | 3.11+   | Language            |
| **FastAPI**     | 0.104.1 | Web framework       |
| **SQLAlchemy**  | 2.0.23  | ORM                 |
| **PostgreSQL**  | Latest  | Database            |
| **PostGIS**     | -       | Geospatial queries  |
| **Pydantic**    | 2.5.0   | Data validation     |
| **Alembic**     | 1.13.1  | Database migrations |
| **TensorFlow**  | 2.14.0  | ML/vision module    |
| **python-jose** | 3.3.0   | JWT tokens          |
| **passlib**     | 1.7.4   | Password hashing    |
| **pytest**      | 7.4.3   | Testing             |

## Project Structure

```
depaso_rest/
├── src/app/
│   ├── main.py                 # FastAPI app entry point
│   ├── core/                   # Core infrastructure
│   │   ├── config.py          # Environment configuration (Pydantic Settings v2)
│   │   ├── database.py        # SQLAlchemy setup + PostGIS
│   │   ├── security.py        # Password & JWT handling
│   │   ├── dependencies.py    # FastAPI dependency injection
│   │   └── logging.py         # Structured logging setup
│   ├── common/                 # Shared utilities
│   │   ├── exceptions.py      # Domain exception hierarchy
│   │   ├── responses.py       # Generic response models
│   │   ├── pagination.py      # Pagination parameters
│   │   └── utils.py           # Utility functions
│   ├── api/
│   │   └── router.py          # API router aggregation (/api/v1)
│   └── modules/               # Feature modules (10 total)
│       ├── auth/              # Authentication
│       ├── users/             # User management
│       ├── carriers/          # Carrier management
│       ├── packages/          # Package catalog
│       ├── shipments/         # Shipment management
│       ├── matching/          # Carrier matching algorithm
│       ├── vision/            # Image classification
│       ├── co2/               # CO2 calculation
│       ├── tracking/          # Shipment tracking
│       └── freight/           # Mudanza-specific logic
├── alembic/                    # Database migrations
│   ├── env.py                 # Migration environment
│   ├── script.py.mako         # Migration template
│   ├── versions/              # Migration scripts
│   └── alembic.ini            # Alembic config
├── tests/
│   ├── conftest.py            # Pytest fixtures
│   ├── test_auth.py           # Auth tests
│   └── test_shipments.py      # (TODO)
├── scripts/
│   ├── seed_db.py             # Database seeding
│   └── run_dev.sh             # Development server startup
├── requirements.txt           # Pip dependencies (pinned)
├── pyproject.toml             # Build config + tool settings
├── .env.example               # Environment variables template
├── .gitignore                 # Git ignore rules
├── .python-version            # Python version specification
└── README.md                  # This file
```

## Architecture

### 4-Layer Module Pattern

Each feature module follows a strict 4-layer architecture:

```
┌─────────────────┐
│  HTTP Router    │ (FastAPI endpoints)
└────────┬────────┘
         │ (DTOs: Pydantic)
┌────────▼────────┐
│  Service Layer  │ (Business logic - pure Python)
└────────┬────────┘
         │ (Domain objects)
┌────────▼────────┐
│ Repository Layer│ (Data access - SQLAlchemy)
└────────┬────────┘
         │ (ORM models)
┌────────▼────────┐
│  Database       │ (PostgreSQL + PostGIS)
└─────────────────┘
```

**Benefits:**

- ✅ Unidirectional dependency flow
- ✅ No circular imports
- ✅ Easy to test (mock repository)
- ✅ Clean separation of concerns
- ✅ Never leak SQLAlchemy models to API

### Key Design Decisions

1. **No Circular Imports:** Services depend on repositories, routers depend on services
2. **Pydantic for DTOs:** Request/response schemas - SQLAlchemy models never leave the repository layer
3. **Deterministic Matching:** No ML in matching algorithm - pure scoring function with weighted factors
4. **PostGIS Integration:** Geographic queries for distance calculations and carrier availability
5. **Lifespan Context Manager:** Load TensorFlow model at startup, clean up on shutdown
6. **Structured Logging:** JSON output for production readiness

## Setup & Installation

### Prerequisites

- Python 3.11+
- PostgreSQL 13+ with PostGIS extension
- pip + virtualenv

### 1. Clone & Enter Directory

```bash
cd depaso_rest
```

### 2. Create Virtual Environment

```bash
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

**Note:** TensorFlow is optional (for the vision module). If you need it, install separately:

```bash
pip install tensorflow>=2.17.0
```

### 4. Configure Environment

```bash
cp .env.example .env
# Edit .env with your configuration
nano .env
```

**Required Environment Variables:**

```
DATABASE_URL=postgresql+psycopg://user:password@localhost/depaso
JWT_SECRET_KEY=your-super-secret-key-change-this
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
DEBUG=true
ENVIRONMENT=development
API_PREFIX=/api/v1
CORS_ORIGINS=["http://localhost:3000", "http://localhost:8000"]
MODEL_PATH=./models/vision_model.h5
OSRM_URL=http://router.project-osrm.org
IPCC_EMISSION_FACTOR_DEFAULT=250.0
```

### 5. Database Setup

```bash
# Run migrations
alembic upgrade head

# Seed with sample data (optional)
python scripts/seed_db.py
```

### 6. Start Development Server

```bash
# Option 1: Use the startup script
./scripts/run_dev.sh

# Option 2: Manual start
uvicorn src.app.main:app --host 0.0.0.0 --port 8000 --reload
```

Server will be available at: **http://localhost:8000**

API Documentation: **http://localhost:8000/api/v1/docs** (Swagger UI)

## API Endpoints

### Health Check

- `GET /api/v1/health` - Service health status

### Authentication

- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login and get JWT token
- `GET /api/v1/auth/me` - Get current user info

### Users

- `POST /api/v1/users` - Create user (admin)
- `GET /api/v1/users` - List users
- `GET /api/v1/users/{id}` - Get user
- `PATCH /api/v1/users/{id}` - Update user
- `DELETE /api/v1/users/{id}` - Delete user (soft delete)

### Carriers

- `POST /api/v1/carriers` - Register new carrier
- `GET /api/v1/carriers` - List carriers
- `GET /api/v1/carriers/{id}` - Get carrier details
- `PATCH /api/v1/carriers/{id}` - Update carrier
- `DELETE /api/v1/carriers/{id}` - Remove carrier

### Packages

- `GET /api/v1/packages` - List package sizes
- `GET /api/v1/packages/{id}` - Get package details

### Shipments

- `POST /api/v1/shipments` - Create shipment
- `GET /api/v1/shipments` - List shipments
- `GET /api/v1/shipments/{id}` - Get shipment details
- `PATCH /api/v1/shipments/{id}/status` - Update shipment status
- `DELETE /api/v1/shipments/{id}` - Cancel shipment

### Matching

- `POST /api/v1/matching/{shipment_id}/score` - Score all carriers
- `POST /api/v1/matching/{shipment_id}/match` - Find best match
- `GET /api/v1/matching/{shipment_id}/ranked` - Get ranked carriers

## Testing

### Run Tests

```bash
# Activate virtual environment first
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# All tests
pytest

# Specific test file
pytest tests/test_auth.py

# With coverage
pytest --cov=src tests/

# Verbose output
pytest -v
```

### Test Structure

- `tests/conftest.py` - Pytest fixtures and database setup
- `tests/test_auth.py` - Authentication tests (register, login, token)
- `tests/test_shipments.py` - (TODO) Shipment creation and matching

### Test Database

Tests use an in-memory SQLite database for speed and isolation. Each test gets a fresh database.

## Code Quality

### Type Checking

```bash
mypy src/
```

Configuration in `pyproject.toml`:

- Strict mode enabled
- TensorFlow/GeoAlchemy2 overrides for external dependencies

### Linting

```bash
ruff check src/
ruff format src/  # Auto-format
```

Configuration in `pyproject.toml`:

- Line length: 100
- Enabled: E, F, W, I (errors, warnings, imports)

### Pre-commit

```bash
# Install hooks
pre-commit install

# Run manually
pre-commit run --all-files
```

## Modules in Detail

### 1. Auth Module

- Register new users
- Login with email/password
- JWT token generation and validation
- Get current user profile

**Files:** `router.py`, `service.py`, `schemas.py`, `exceptions.py`

### 2. Users Module

- Complete CRUD for users
- User types: client, carrier
- Rating and activity tracking
- Soft deletion support

**Files:** `router.py`, `service.py`, `repository.py`, `models.py`, `schemas.py`, `exceptions.py`

### 3. Carriers Module (TODO)

- Carrier registration and profiles
- Vehicle type management (bike, car, van, truck)
- Capacity and reputation tracking
- Service areas and availability

### 4. Packages Module (TODO)

- Package size catalog (XS, S, M, L, XL, FREIGHT)
- Dimension and weight limits per size
- Base pricing per size

### 5. Shipments Module (TODO)

- Shipment creation from clients
- Geographic origin/destination
- Package category selection
- Status tracking (pending → matched → in-transit → delivered)

### 6. Matching Module (TODO)

- Deterministic carrier scoring algorithm
- Factors: distance, detour, capacity, reputation, time window
- Ranked results for manual or automatic selection

### 7. Vision Module (TODO)

- MobileNetV2 image classifier
- Package size prediction from photos
- Confidence scoring
- Model loaded at startup via lifespan

### 8. CO2 Module (TODO)

- Calculate carbon footprint per shipment
- Compare real vs counterfactual scenarios
- IPCC emission factors per vehicle
- CO2 savings quantification

### 9. Tracking Module (TODO)

- Shipment status history
- GPS location tracking
- Real-time status updates
- WebSocket support (future)

### 10. Freight Module (TODO)

- Mudanza-specific logic
- Large shipment handling
- Dedicated carrier requirements
- Specialized pricing

## Database Migrations

### Create New Migration

```bash
alembic revision --autogenerate -m "Add shipments table"
```

### Apply Migrations

```bash
# Apply all pending
alembic upgrade head

# Apply specific revision
alembic upgrade 1234567abcde

# Rollback last migration
alembic downgrade -1
```

### View Migration History

```bash
alembic current
alembic history
```

## Deployment

### Production Checklist

- [ ] Set `DEBUG=false` in .env
- [ ] Generate strong `JWT_SECRET_KEY`
- [ ] Configure PostgreSQL for production
- [ ] Set up HTTPS/TLS
- [ ] Configure CORS for frontend domain
- [ ] Set up logging aggregation
- [ ] Configure monitoring/alerting
- [ ] Use environment-specific settings
- [ ] Test all endpoints in staging
- [ ] Document API rate limits
- [ ] Set up automated backups

### Gunicorn + Uvicorn

```bash
gunicorn -w 4 -k uvicorn.workers.UvicornWorker src.app.main:app \
    --bind 0.0.0.0:8000 \
    --access-logfile - \
    --error-logfile -
```

## Contributing

1. Create feature branch: `git checkout -b feature/my-feature`
2. Code with type hints and docstrings
3. Run tests: `pytest`
4. Check code quality: `ruff check src/`, `mypy src/`
5. Commit with clear messages
6. Push and create pull request

## License

MIT

## Support

- 📧 Email: dev@depaso.com
- 🐛 Issues: GitHub Issues
- 💬 Discussions: GitHub Discussions

---

**Last Updated:** 2024
**API Version:** 0.1.0
**Status:** Development
