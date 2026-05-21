# Frontend Architecture

## Folder Structure

```
src/
├── app/                    ← expo-router screens
├── components/             ← reusable UI components
├── features/               ← feature-based modules
│   ├── auth/
│   ├── shipments/
│   ├── carriers/
│   └── tracking/
├── services/               ← API clients & external services
│   ├── api.ts             ← axios instance with JWT interceptor
│   ├── auth.ts            ← auth service
│   ├── shipments.ts       ← shipments service
│   └── vision.ts          ← vision/classification service
├── stores/                 ← zustand state management
│   ├── authStore.ts       ← auth state
│   └── shipmentStore.ts   ← shipment form/list state
├── hooks/                  ← custom React hooks
├── types/                  ← TypeScript interfaces
└── utils/                  ← utility functions
```

## Stack

- **Routing**: expo-router (file-based)
- **State**: zustand (global) + React hooks (local)
- **Data Fetching**: @tanstack/react-query
- **Forms**: react-hook-form + zod
- **HTTP**: axios with JWT interceptor
- **UI**: react-native-paper + nativewind
- **Components**: @gorhom/bottom-sheet, @shopify/flash-list
- **Maps**: react-native-maps + react-native-maps-directions
- **Camera**: expo-camera + expo-image-picker + expo-image-manipulator
- **Security**: expo-secure-store (JWT storage)
- **Location**: expo-location

## Key Patterns

### 1. JWT Authentication Flow

```typescript
// Stored securely in expo-secure-store
apiClient.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync("auth_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### 2. Data Fetching with React Query

```typescript
import { useQuery } from "@tanstack/react-query";
import { shipmentsService } from "@/services/shipments";

export const useMyShipments = () => {
  return useQuery({
    queryKey: ["shipments", "my"],
    queryFn: () => shipmentsService.listMyShipments(),
  });
};
```

### 3. Global State with Zustand

```typescript
import { useAuthStore } from "@/stores";

export const MyComponent = () => {
  const { user, login } = useAuthStore();
  // ...
};
```

### 4. Form Validation with React Hook Form + Zod

```typescript
import { useForm } from "react-hook-form";
import { z } from "zod";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const LoginScreen = () => {
  const { control, handleSubmit } = useForm({
    resolver: zodResolver(schema),
  });

  return (
    // ...
  );
};
```

## Component Patterns

### Bottom Sheet for Details

Used for displaying shipment details, driver info, etc.

```typescript
import BottomSheet from "@gorhom/bottom-sheet";

<BottomSheet snapPoints={[200, 400, 600]}>
  {/* content */}
</BottomSheet>
```

### Flash List for Performance

Replace FlatList with @shopify/flash-list

```typescript
import { FlashList } from "@shopify/flash-list";

<FlashList
  data={shipments}
  renderItem={({ item }) => <ShipmentCard shipment={item} />}
  estimatedItemSize={200}
/>
```

### Map with Overlay Cards

Standard pattern for logistics apps (Uber-style)

```typescript
<MapView>
  {/* markers */}
</MapView>
<BottomSheet>
  <ShipmentDetails />
</BottomSheet>
```

## Environment Variables

Create `.env.local`:

```
EXPO_PUBLIC_API_URL=http://localhost:8000/api
EXPO_PUBLIC_MAP_TILE_URL=https://tile.openstreetmap.org
```

## Tips

1. **Always use React Query** for data fetching - caching, error handling, loading states
2. **Use Zustand for global state** (auth, user preferences)
3. **Keep components small** and composable
4. **Use TypeScript** everywhere - no `any` types
5. **Test on Android first**, iOS is secondary for prototypes
6. **Upload images to backend** for AI classification, don't use on-device TFLite
7. **Use @gorhom/bottom-sheet** for all detail panels (professional UX)
8. **Secure JWT in expo-secure-store**, never in AsyncStorage

## Recommended Order

1. Implement authentication screens (Login + Register)
2. Set up React Query + Zustand
3. Create shipment creation flow
4. Add maps + bottom sheets
5. Implement photo upload + AI classification
6. Build shipment tracking view
7. Add push notifications
8. Polish animations
