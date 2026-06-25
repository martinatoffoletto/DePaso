# typecheck — TypeScript check for the Expo app

Runs `tsc --noEmit` against `depaso_app`. Must report 0 errors before any EAS build.

```bash
cd /Users/martutoffoletto/facultad/TESIS/DePaso/depaso_app && npx tsc --noEmit 2>&1
```

After running:
- If 0 errors: confirm "TypeScript clean — safe to build APK"
- If errors exist: list each error with file path + line number, group by file, and suggest a fix for each. Prioritize: type mismatches in API response shapes, missing keys in route params, and `any` in stores.
- Common causes in this project: missing fields in API response types (`src/types/index.ts`), typed routes (`href` must match `app/` file structure), NativeWind className on non-Text/View components.
