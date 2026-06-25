# migrate — Alembic migration helpers

Runs Alembic commands against the local Postgres DB (uses `.env`).

## Usage
- `/migrate` → apply all pending migrations (`upgrade head`)
- `/migrate new <description>` → generate a new autogenerate migration
- `/migrate status` → show current revision and pending migrations
- `/migrate downgrade` → roll back one revision

```bash
cd /Users/martutoffoletto/facultad/TESIS/DePaso/depaso_rest

# upgrade head
if [[ "$ARGUMENTS" == "" || "$ARGUMENTS" == "head" ]]; then
  .venv/bin/alembic upgrade head

# new migration
elif [[ "$ARGUMENTS" == new* ]]; then
  DESC="${ARGUMENTS#new }"
  .venv/bin/alembic revision --autogenerate -m "$DESC"

# status
elif [[ "$ARGUMENTS" == "status" ]]; then
  .venv/bin/alembic current
  .venv/bin/alembic history --verbose

# downgrade
elif [[ "$ARGUMENTS" == "downgrade" ]]; then
  .venv/bin/alembic downgrade -1
fi
```

After running, report the output and warn if any `op.drop_*` appears in a new migration (destructive).
