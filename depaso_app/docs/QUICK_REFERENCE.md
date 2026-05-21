# DePaso Frontend - Quick Reference

## Getting Started

```bash
cd depaso_app
npm install
npm start
```

## Development

| Command              | Purpose                                  |
| -------------------- | ---------------------------------------- |
| `npm start`          | Start Expo development server            |
| `npm run android`    | Build and run on Android emulator/device |
| `npm run ios`        | Build and run on iOS simulator/device    |
| `npm run web`        | Preview on web (limited RN support)      |
| `npm run lint`       | Check code style and errors              |
| `npm run type-check` | TypeScript type validation               |

## Debugging

### Expo Debugger

In running app, press:

- `Cmd+D` (iOS) or `Ctrl+M` (Android) - Open debugger menu
- `i` - iOS simulator
- `a` - Android emulator
- `w` - Web preview
- `q` - Quit

### View Logs

```bash
# In terminal running npm start
# All console.log output appears here
```

### Network Inspection

1. Press `Cmd+D` in app
2. Select "Network inspector"
3. Make API requests to see headers, body, response

### TypeScript Errors

```bash
npx tsc --noEmit
```

## File Creation

### Add New Screen

```bash
# Create file: src/features/{feature}/screens/MyScreen.tsx

import React from "react";
import { View } from "react-native";
import { Text } from "react-native-paper";

export const MyScreen = () => {
  return (
    <View className="flex-1 bg-white p-4">
      <Text variant="headlineLarge">My Screen</Text>
    </View>
  );
};

export default MyScreen;
```

### Add New Service

```bash
# Create file: src/services/myService.ts

import { apiClient } from "./api";

export const myService = {
  async getData() {
    const response = await apiClient.get("/endpoint");
    return response.data;
  },
};
```

### Add New Hook

```bash
# Add to src/hooks/index.ts

export const useMyData = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["myData"],
    queryFn: () => myService.getData(),
  });

  return { data, isLoading, error };
};
```

### Add New Route

```bash
# Create file: app/my-route.tsx

import { View, Text } from "react-native";

export default function MyRoute() {
  return (
    <View>
      <Text>My Route</Text>
    </View>
  );
}
```

## Common Tasks

### Check Compilation

```bash
npx tsc --noEmit
```

### Clear Cache

```bash
npm start -- --clear
```

### Reinstall Dependencies

```bash
rm -rf node_modules package-lock.json
npm install
npm start -- --clear
```

### Check Lint Issues

```bash
npm run lint
npm run lint -- --fix
```

### View TypeScript Errors

```bash
npx tsc --listFiles
```

### Check Bundle Size

```bash
npm run build:web
```

## Folder Structure Reference

```
depaso_app/
├── app/                           # Expo Router screens
│   ├── _layout.tsx               # Root layout with auth routing
│   ├── index.tsx                 # Splash/auth detection
│   ├── _auth/                    # Auth screens (login/register)
│   ├── (tabs)/                   # Tab navigation
│   │   ├── _layout.tsx
│   │   ├── index.tsx             # Home screen
│   │   └── profile.tsx           # User profile
│   └── modal.tsx
├── src/
│   ├── app/                      # (if custom app logic needed)
│   ├── components/               # Reusable UI components
│   ├── features/                 # Feature modules
│   │   └── auth/screens/         # Auth screens
│   ├── hooks/                    # Custom React hooks
│   ├── services/                 # API clients
│   ├── stores/                   # Zustand state
│   ├── types/                    # TypeScript types
│   └── utils/                    # Utility functions
├── package.json
├── tsconfig.json
├── app.json
├── .env.local                    # Local environment
└── FRONTEND_ARCHITECTURE.md      # Architecture guide
```

## API Integration

### Make API Request

```typescript
import { apiClient } from "@/services/api";

const response = await apiClient.get("/endpoint");
const data = await apiClient.post("/endpoint", {
  /* ... */
});
```

### Use React Query

```typescript
import { useQuery } from "@tanstack/react-query";

const { data, isLoading, error } = useQuery({
  queryKey: ["shipments"],
  queryFn: () => shipmentsService.listMyShipments(),
});
```

### Use Zustand Store

```typescript
import { useAuthStore } from "@/stores";

const { user, login, logout } = useAuthStore();
```

## Styling

### NativeWind Classes

```tsx
<View className="flex-1 bg-white p-4 gap-2">
  <Text className="text-lg font-bold">Title</Text>
</View>
```

### React Native Paper

```tsx
import { Text, Button } from "react-native-paper";

<Button mode="contained" onPress={() => {}}>
  Click Me
</Button>;
```

## Environment Variables

Set in `.env.local`:

```env
EXPO_PUBLIC_API_URL=http://localhost:8000/api
EXPO_PUBLIC_MAP_TILE_URL=https://tile.openstreetmap.org/{z}/{x}/{y}.png
```

Access in code:

```typescript
const apiUrl = process.env.EXPO_PUBLIC_API_URL;
```

## Performance Tips

1. **Use React Query** - automatic caching & refetching
2. **Use FlashList** - 10x faster than FlatList
3. **Memoize components** - avoid unnecessary re-renders
4. **Lazy load screens** - dynamic imports for tab navigation
5. **Optimize images** - compress before upload

## Troubleshooting Commands

```bash
# Clear everything and start fresh
rm -rf node_modules .expo package-lock.json
npm install
npm start -- --clear

# Kill Metro if stuck
lsof -i :8081 | grep node | awk '{print $2}' | xargs kill -9

# Check Node version (need v20+)
node --version

# Reinstall native modules
npm install
expo prebuild --clean

# Reset simulator/emulator
# iOS: Device menu > Erase All Content and Settings
# Android: Virtual Device Manager > Wipe Data
```

## Useful Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Docs](https://reactnative.dev/)
- [expo-router Guide](https://expo.github.io/router/)
- [Zustand GitHub](https://github.com/pmndrs/zustand)
- [React Query Docs](https://tanstack.com/query/)
- [React Hook Form](https://react-hook-form.com/)
- [Zod Validation](https://zod.dev/)

## Common Errors

| Error                      | Solution                                   |
| -------------------------- | ------------------------------------------ |
| "Cannot find module 'xyz'" | `npm install xyz && npm start -- --clear`  |
| "Types don't match"        | `npx tsc --noEmit` then check the errors   |
| "Port 8081 already in use" | Kill process: `lsof -i :8081`              |
| "Metro error"              | `npm start -- --clear`                     |
| "App won't start"          | Check `.env.local` and API_URL             |
| "JWT not sent"             | Check Network tab for Authorization header |

---

**Pro Tip**: Keep this file open while developing. Reference it before searching Stack Overflow!
