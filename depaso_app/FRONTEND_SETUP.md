# DePaso Frontend - Setup Instructions

## Prerequisites

- Node.js 20+ (use nvm: `nvm use 20`)
- Expo CLI: `npm install -g expo-cli`
- Android SDK / iOS SDK (if developing for those platforms)
- For Android testing: Android emulator or physical device
- For iOS testing: Xcode (macOS only)

## Installation

```bash
cd depaso_app
npm install
```

## Environment Setup

1. Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

2. Update API endpoint in `.env.local`:

```env
EXPO_PUBLIC_API_URL=http://localhost:8000/api
```

(If developing against a production backend, update the URL accordingly)

## Running the App

### Android (Recommended for initial development)

```bash
npm run android
```

### iOS (macOS only)

```bash
npm run ios
```

### Web (For quick testing, limited RN support)

```bash
npm run web
```

### Development Server

```bash
npm start
```

Then press:

- `a` - Open Android emulator
- `i` - Open iOS simulator
- `w` - Open web browser
- `q` - Quit

## Project Structure

```
src/
├── app/               ← expo-router screens (file-based routing)
├── components/        ← reusable UI components
├── features/          ← feature-based modules
├── services/          ← API clients
├── stores/            ← zustand global state
├── hooks/             ← custom React hooks
├── types/             ← TypeScript interfaces
└── utils/             ← utility functions
```

See `FRONTEND_ARCHITECTURE.md` for detailed architecture documentation.

## Key Patterns

### State Management

- **Global State**: Zustand (`useAuthStore`, `useShipmentStore`)
- **Local State**: React hooks
- **Server State**: React Query

### API Communication

- **HTTP Client**: axios with JWT interceptor
- **Services**: `services/auth.ts`, `services/shipments.ts`, `services/vision.ts`
- **Token Storage**: expo-secure-store (encrypted)

### Forms

- **Library**: react-hook-form + zod
- **Validation**: Type-safe with Zod schemas

### Data Fetching

- **Library**: @tanstack/react-query
- **Caching**: 5-minute stale time by default
- **Error Handling**: Built-in with retry logic

## Development Tips

1. **Hot Reload**: Changes auto-reload when you save
2. **Debugging**: Shake device or press `Ctrl+M` (Android) / `Cmd+D` (iOS)
3. **Logs**: Check console output in terminal running `npm start`
4. **Network**: Use React Query DevTools for debugging queries
5. **Android**: Prefer physical device for faster iteration

## Common Issues

### "Metro bundler error"

Solution: Clear cache and restart:

```bash
npm start -- --clear
```

### "Module not found" after installing packages

Solution: Clear node_modules and reinstall:

```bash
rm -rf node_modules package-lock.json
npm install
npm start -- --clear
```

### "EADDRINUSE: address already in use :::8081"

Solution: Kill existing process:

```bash
lsof -i :8081 | grep node | awk '{print $2}' | xargs kill -9
```

### JWT token not being sent

Check:

1. Token is stored in expo-secure-store after login
2. API_URL in `.env.local` is correct
3. Check network tab in debugger to see Authorization header

## Testing

```bash
# Run linting
npm run lint

# Type checking
npx tsc --noEmit
```

## Building for Production

```bash
# Build APK (Android)
expo build:android

# Build IPA (iOS)
expo build:ios
```

See Expo documentation for detailed build instructions.

## Connecting Backend

Make sure the backend is running:

```bash
cd ../depaso_rest
python -m uvicorn src.app.main:app --reload
```

Then connect from the app:

1. Update `EXPO_PUBLIC_API_URL` to match your backend
2. Create a test account via registration flow
3. Check network requests in debugger

## Support

- Expo Docs: https://docs.expo.dev/
- React Native: https://reactnative.dev/
- React Query: https://tanstack.com/query/
- Zustand: https://github.com/pmndrs/zustand
