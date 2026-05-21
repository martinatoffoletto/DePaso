# DePaso Frontend - Flow Diagrams

## App Startup Flow

```
┌─────────────────────────────────┐
│  App Starts                     │
│  (app/_layout.tsx)              │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│  useAppLifecycle()              │
│  restoreToken() from SecureStore│
└────────────┬────────────────────┘
             │
             ▼
        ┌────────────┐
        │ Is Token   │
        │ Valid?     │
        └─┬──────┬───┘
          │      │
       Yes│      │No
          │      │
          ▼      ▼
    ┌──────┐  ┌────────┐
    │Tabs  │  │Auth    │
    │Home  │  │Login/  │
    │      │  │Register│
    └──────┘  └────────┘
```

## Authentication Flow

```
Login Screen                 Zustand Store           Backend API
─────────────────           ─────────────           ────────────

User enters
email/password
        │
        ▼
Form validates           ── useAuthStore()
(Zod schema)                │
        │                   ▼
        │              login(email, pwd) ─────→ POST /auth/login
        │                   │                       │
        │                   │◀─────────────────────┤
        │                   │    {token, user}    │
        │                   │                       │
        ▼                   ▼
JWT stored in         Set isAuthenticated     Return 200
expo-secure-store     to true
        │             ▼
        │             Set user data
        │             in zustand
        │
        └──────────────────────────────────────────┐
                                                  │
                                                  ▼
                                          Navigate to /(tabs)
```

## API Request Flow

```
React Component
        │
        ▼
useQuery({                    [React Query]
  queryKey,
  queryFn: () => service.call()
})
        │
        ▼
Service Layer              [services/api.ts]
(e.g., shipmentsService)
        │
        ▼
apiClient.get/post/etc.
        │
        ▼
Request Interceptor        [axios]
Add Authorization header:
"Bearer <token>"
        │
        ▼
Backend API                [http://localhost:8000/api]
        │
        ▼
Response Handler           [axios]
Return data OR
Handle 401 error
        │
        ▼
React Query               [Cache, retry, etc.]
        │
        ▼
Component Re-renders      [State updated]
```

## State Management Architecture

```
Global State (Zustand)          Server State (React Query)    Local State (Hook)
──────────────────────          ──────────────────────        ──────────────────

┌──────────────────────┐        ┌──────────────────────┐    ┌──────────────────┐
│   useAuthStore       │        │   useQuery({         │    │  useState(...)   │
│   ├─ user           │        │     queryKey: [...]  │    │  Form inputs     │
│   ├─ token          │        │     queryFn: ...     │    │  UI toggles      │
│   ├─ isAuth         │        │   })                 │    │                  │
│   └─ actions        │        │   ├─ data           │    │                  │
│      ├─ login()     │        │   ├─ isLoading      │    │                  │
│      ├─ logout()    │        │   └─ error          │    │                  │
│      └─ register()  │        └──────────────────────┘    └──────────────────┘
│                      │
└──────────────────────┘        Shipments, Offers,            Form field values,
                                Drivers, Ratings              Modal open state,
Never changes unless         (fetched from backend)          Temporary UI state
user explicitly logs
in/out/register
```

## Component Hierarchy

```
app/_layout.tsx (Root)
│
├─ Providers (React Query + Theme)
│  │
│  ├─ index.tsx (Splash Screen)
│  │
│  └─ Conditional Routing
│     │
│     ├─ If authenticated:
│     │  └─ (tabs) ← Tab Navigator
│     │     ├─ index.tsx (Home)
│     │     │  └─ List Shipments
│     │     ├─ explore.tsx (Browse)
│     │     │  └─ List Offers
│     │     ├─ create.tsx (New Shipment)
│     │     │  └─ Multi-step Form
│     │     └─ profile.tsx (User Profile)
│     │        └─ Show User Data
│     │
│     └─ If not authenticated:
│        └─ _auth ← Auth Stack
│           ├─ login.tsx
│           └─ register.tsx
```

## Data Flow for Shipment Creation

```
User                          Component              Store              Backend
────────────────────────────  ──────────────────     ──────────────    ────────

1. User opens create
   shipment screen
                              CreateShipmentScreen
                              ├─ Renders map
                              └─ Renders form
                                          │
                              ▼──────────────────┐
                              Select origin  │ setOrigin()
                              location       │ (zustand)
                                            │
                              ▼──────────────────┐
                              Select            │ setDestination()
                              destination       │ (zustand)
                                            │
                              ▼──────────────────┐
                              Enter weight,     │ Form state
                              volume, etc        │ (useState)
                                            │
                              ▼──────────────────────────────────┐
                              Click "Create"                 │
                                                             │
                                                       ▼─────────────┐
                                         Validate with Zod          │
                                         ├─ Schema check            │
                                         └─ If valid, proceed       │
                                                             │
                                         ▼───────────────────────────────────┐
                                    POST /shipments              │
                                    {origin, destination,       │
                                     weight, volume, mode}      │
                                                          ────────────────→ Create in DB
                                                          ←──────────────── Return {id, status, ...}
                                                             │
                                                       ▼─────────────┐
                                                  setCurrentShipment │
                                                  (zustand)         │
                                                       │
                                                       ▼────────────┐
                                                  Show confirmation│
                                                  "Shipment created"
                                                       │
                                         Redirect to shipment
                                         tracking screen
```

## Form Validation Flow

```
User Input
    │
    ▼
React Hook Form
    │
    ├─ onChange → Store in form state
    │
    ├─ onBlur → Validate field
    │
    └─ on Submit → Validate entire form
         │
         ▼
    Zod Schema
         │
         ├─ Check email format
         ├─ Check password length
         ├─ Check required fields
         └─ Return errors
         │
         ▼
    Display Error Messages
         │
         ├─ Email: "Invalid format"
         ├─ Password: "Must be 8+ chars"
         └─ Phone: "Required field"
         │
         ▼
    If all valid → Enable Submit button
    If invalid → Disable Submit button
```

## Token Persistence Flow

```
App Startup
    │
    ▼
useAppLifecycle() hook
    │
    ├─ Call restoreToken()
    │
    ▼
Check expo-secure-store
    │
    ├─ Yes → token exists
    │   └─ Set in zustand
    │   └─ Make GET /auth/me request
    │   └─ Set user data
    │   └─ Set isAuthenticated = true
    │
    └─ No → token doesn't exist
        └─ isAuthenticated = false
        └─ Redirect to login

User closes app
    │
    ▼
Token stays in expo-secure-store
(encrypted on device)

User opens app again
    │
    ▼
Same flow repeats
    │
    ▼
User auto-logged in!
```

## Error Handling Flow

```
API Request
    │
    ▼
Response?
    │
    ├─ 200-299 (Success)
    │   └─ Return data
    │   └─ Update React Query cache
    │   └─ Component re-renders
    │
    ├─ 401 (Unauthorized)
    │   └─ Token expired/invalid
    │   └─ Delete token from SecureStore
    │   └─ Set isAuthenticated = false
    │   └─ Redirect to login
    │   └─ Show error: "Session expired"
    │
    ├─ 4xx (Client Error)
    │   └─ Show error message from backend
    │   └─ Example: "Email already exists"
    │   └─ User can retry with different data
    │
    └─ 5xx (Server Error)
        └─ Show generic error
        └─ "Server error, try again later"
        └─ React Query auto-retries (1x)
```

## Tab Navigation Flow

```
Home Tab
    │
    ├─ List user's shipments
    ├─ Show active/pending status
    └─ Tap to view details

Explore Tab
    │
    ├─ List available offers
    ├─ Filter by distance/price
    └─ Tap to accept offer

Create Tab
    │
    ├─ Multi-step form
    ├─ Select origin/destination
    ├─ Enter package details
    ├─ Select delivery mode
    └─ Confirm & create

Profile Tab
    │
    ├─ Show user info
    ├─ Show ratings
    ├─ Settings link
    └─ Logout button
```

## Network Request Example

```
Browser DevTools → Network Tab

Request:
POST http://localhost:8000/api/shipments
Headers:
  Authorization: Bearer eyJhbGc... (JWT token)
  Content-Type: application/json
Body:
  {
    "origin_lat": -34.603683,
    "origin_lng": -58.381559,
    "destination_lat": -34.798294,
    "destination_lng": -58.456747,
    "weight_kg": 5,
    "volume_liters": 20,
    "mode": "colaborativa"
  }

Response (200 OK):
  {
    "id": 123,
    "requester_id": 1,
    "status": "pending",
    "price_ars": 450.00,
    "eta_minutes": 25,
    "created_at": "2024-01-15T10:30:00Z"
  }
```

---

These diagrams illustrate the key architectural flows in the DePaso frontend application.
