# seed — Run the demo seed script (safely)

⚠️ The seed script is NOT idempotent — running it twice creates duplicate data.
Always check current DB state before seeding.

```bash
cd /Users/martutoffoletto/facultad/TESIS/DePaso/depaso_rest && \
  .venv/bin/python scripts/seed_demo.py
```

Before running:
1. Ask the user to confirm they want to seed (this creates demo users, carriers, and shipments)
2. Warn: "If the DB already has data, this will create duplicates. Run only on a fresh DB or after dropping all tables."
3. Remind: seed creates users with known passwords — do NOT run against production

After running, report which demo accounts were created (email + password) so the user can log in immediately.
