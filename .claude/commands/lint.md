# lint — ESLint check for the Expo app

Runs ESLint across the entire `depaso_app`. Must give 0 warnings before thesis defense.

```bash
cd /Users/martutoffoletto/facultad/TESIS/DePaso/depaso_app && npx eslint . --max-warnings 0 2>&1
```

If `$ARGUMENTS` contains a path, lint only that file/dir instead.

After running:
- If clean: "ESLint clean"
- If warnings/errors: list them grouped by rule, with file:line. Offer to fix auto-fixable ones with `--fix`.
- This project uses the Expo ESLint config. Common issues: unused imports, missing deps in useEffect/useCallback, direct `router.replace` instead of `Stack.Protected`.
