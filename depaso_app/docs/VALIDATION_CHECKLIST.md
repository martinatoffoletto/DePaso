# Frontend Validation Checklist

Run these checks to ensure everything is working correctly.

## 1. TypeScript Compilation ✅

```bash
cd depaso_app
npx tsc --noEmit
```

Expected: No errors, all types should resolve correctly

## 2. Lint Check ✅

```bash
npm run lint
```

Expected: No critical errors (warnings are acceptable)

## 3. File Structure ✅

Verify these folders exist:

- [ ] `src/components/` - 7 files
- [ ] `src/services/` - 6 files
- [ ] `src/stores/` - 3 files
- [ ] `src/hooks/` - 1 file
- [ ] `src/utils/` - 1 file
- [ ] `src/types/` - 1 file
- [ ] `src/features/auth/screens/` - 3 files
- [ ] `app/_auth/` - 3 files
- [ ] `.env.local` exists

## 4. Environment Setup ✅

Check `.env.local` contains:

```env
EXPO_PUBLIC_API_URL=http://localhost:8000/api
```

## 5. Dependency Check ✅

```bash
npm list zustand axios @tanstack/react-query react-hook-form zod
```

Expected: All packages listed with compatible versions

## 6. Import Validation ✅

Run this TypeScript check:

```bash
npx tsc src/services/api.ts --noEmit
npx tsc src/stores/authStore.ts --noEmit
npx tsc app/_layout.tsx --noEmit
```

Expected: No compilation errors

## 7. Code Quality Check ✅

Verify no unused imports:

```bash
npm run lint -- --fix
```

Expected: Auto-fixes apply without errors

## 8. Router Configuration ✅

Check `app.json` includes:

```json
{
  "plugins": ["expo-router"]
}
```

## 9. Package.json Scripts ✅

Verify these scripts exist:

- [ ] `npm start` - starts Expo dev server
- [ ] `npm run android` - builds Android APK
- [ ] `npm run ios` - builds iOS app
- [ ] `npm run lint` - runs ESLint
- [ ] `npm run type-check` - runs TypeScript

## 10. Manual Testing ✅

### Test Login Flow

```bash
npm start
# Press 'a' for Android or 'i' for iOS
# On login screen, verify:
- [ ] Email input validates format
- [ ] Password input shows masked text
- [ ] Submit button disables while loading
- [ ] Error message shows for invalid credentials
```

### Test Token Persistence

```bash
# After successful login:
- [ ] App navigates to /(tabs)
- [ ] Close and reopen app
- [ ] Should auto-login without seeing login screen
- [ ] User profile shows correct name/email
```

### Test Register Flow

```bash
- [ ] Can switch between Shipper/Carrier type
- [ ] All fields have validation messages
- [ ] Submit button disabled until form is valid
- [ ] After registration, auto-redirected to home
```

### Test Logout

```bash
- [ ] Click logout on profile screen
- [ ] Token removed from secure store
- [ ] Redirects to login screen
- [ ] Can't access tabs until logged in
```

## 11. Network Debug ✅

### Check JWT in Requests

```bash
# In Debugger Network tab:
- [ ] All API requests include Authorization header
- [ ] Header format: "Bearer <token>"
- [ ] Requests to correct API_URL
```

### Test API Integration

```bash
# Assuming backend is running on http://localhost:8000
- [ ] POST /auth/register returns user + token
- [ ] POST /auth/login returns user + token
- [ ] GET /auth/me returns current user
```

## 12. Warnings & Errors ✅

### Expected Warnings (OK)

- NativeWind warnings about styling
- Metro bundler peer dependency warnings
- Expo SDK warnings

### Not OK - These Are Errors

- "Module not found" errors
- "Cannot find type" errors
- Import/export mismatches
- Circular dependency warnings

## Troubleshooting

### "Types are not resolved"

```bash
rm -rf node_modules
npm install
npx tsc --noEmit
```

### "axios not found"

```bash
npm install axios
npm start -- --clear
```

### "Zustand not found"

```bash
npm install zustand
npm start -- --clear
```

### "React Query not found"

```bash
npm install @tanstack/react-query
npm start -- --clear
```

### "Cannot find expo-secure-store"

```bash
npm install expo-secure-store
expo prebuild
npm start -- --clear
```

## Success Criteria

✅ You're ready when:

1. TypeScript compiles with no errors
2. All imports resolve correctly
3. App starts without errors
4. Login/Register screens render
5. Can create an account
6. Can login with created account
7. Profile screen shows user data
8. Can logout
9. App redirects to login when not authenticated
10. All network requests include JWT token

## Next Steps After Validation

1. Create home screen with shipments list
2. Implement shipment creation flow
3. Add maps integration
4. Integrate vision service
5. Build tracking screen
6. Add notifications

---

**Last Updated:** 2024
**Status:** Ready for core feature implementation
