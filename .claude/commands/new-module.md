# new-module — Scaffold a new FastAPI module

Creates the standard DePaso module structure under `depaso_rest/src/app/modules/<name>/`.

Usage: `/new-module <module-name>`

The standard structure for this project is:
```
src/app/modules/<name>/
  __init__.py
  router.py      # FastAPI APIRouter, prefix=/api/v1/<name>
  service.py     # Business logic class, injected via Depends
  repository.py  # Extends BaseRepository from shared/base_repository.py
  schemas.py     # Pydantic v2 BaseModel request/response schemas
  models.py      # SQLAlchemy 2 ORM model, extends Base from shared/base_model.py
```

When creating the module:
1. Create all 6 files with correct imports and minimal boilerplate
2. Add `from src.app.modules.<name>.router import router as <name>_router` to `src/app/main.py`
3. Include the router: `app.include_router(<name>_router)`
4. Remind the user to create an Alembic migration with `/migrate new <name>-table`

Follow these conventions:
- SQLAlchemy 2 style: `mapped_column`, `Mapped[T]`, `relationship()` with `back_populates`
- Pydantic v2: `model_config = ConfigDict(from_attributes=True)` on response schemas
- Repository pattern: `class <Name>Repository(BaseRepository[<Model>])`
- Service receives repository via constructor, not `Depends` directly
- PackageSize enum: always import from `src.app.shared.enums`, never redefine
