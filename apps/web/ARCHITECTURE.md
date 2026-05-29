# Aether Frontend Architecture

## Overview

The Aether frontend uses a **feature-based modular architecture** that prioritizes:

- **Separation of Concerns**: Each feature is self-contained
- **Scalability**: Easy to add new features without affecting existing code
- **Type Safety**: Full TypeScript with strict mode
- **Developer Experience**: Clear patterns and conventions
- **Performance**: Optimized caching and state management

---

## Architecture Layers

### 1. **Config Layer** (`src/config/`)

Centralized configuration and constants.

```
env.ts           → Environment validation
constants.ts     → App constants & cache times
routes.ts        → Route definitions
```

**Usage:**

```typescript
import { env, CACHE_TIMES, ROUTES } from '@/config';

const apiUrl = env.API_URL;
const cacheTime = CACHE_TIMES.LONG;
const route = ROUTES.DASHBOARD.HOME;
```

---

### 2. **Type Layer** (`src/types/`)

Global TypeScript types and interfaces.

```
entities.ts      → Domain objects (User, Community, Message, etc.)
api.ts           → API request/response types
errors.ts        → Error classes
```

**Pattern:**

```typescript
import type { User, Community } from '@/types';

const user: User = {
  /* ... */
};
```

---

### 3. **Library Layer** (`src/lib/`)

Low-level utilities and clients.

**API Client** (`lib/api/`)

```typescript
import { apiClient, endpoints } from '@/lib/api';

// Make requests
const users = await apiClient.get(endpoints.users.list);
const user = await apiClient.post(endpoints.auth.me, { address });
```

**WebSocket Client** (`lib/websocket/`)

```typescript
import { webSocketClient, WebSocketEvents } from '@/lib/websocket';

webSocketClient.connect();
webSocketClient.on(WebSocketEvents.MESSAGE_RECEIVED, (msg) => {
  // Handle message
});
webSocketClient.send('ping', {});
```

---

### 4. **Hooks Layer** (`src/hooks/`)

Reusable custom React hooks.

```
useApi.ts        → HTTP request wrapper
useWebSocket.ts  → WebSocket connection
useAsync.ts      → Generic async state
usePagination.ts → Pagination logic
```

**Usage:**

```typescript
import { useApi, useWebSocket, useAsync } from '@/hooks';

const { data, error, isLoading, get } = useApi();
const { isConnected, subscribe, send } = useWebSocket();
```

---

### 5. **Store Layer** (`src/stores/`)

Global Zustand state.

```
useAppStore.ts             → App theme & UI state
useNotificationStore.ts    → Toast/notification state
```

**Usage:**

```typescript
import { useAppStore } from '@/stores';

const { theme, setTheme } = useAppStore();
```

---

### 6. **Provider Layer** (`src/components/providers/`)

Global context providers.

```
Providers.tsx       → Web3 providers (wagmi, RainbowKit, Query)
AuthProvider.tsx    → Auth context
```

**Usage:**

```typescript
import { AuthProvider, useAuth } from '@/components/providers';

export default function Layout({ children }) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
}

function MyComponent() {
  const { user, address } = useAuth();
}
```

---

### 7. **Component Layer** (`src/components/`)

Shared components and layout.

```
common/    → Generic UI blocks (Button, Card, Modal, etc.)
layout/    → Layout components (Sidebar, TopNav, Footer)
```

---

### 8. **Feature Layer** (`src/features/`)

Self-contained feature modules.

Each feature has:

```
feature/
├── components/     → Feature-specific components
├── hooks/          → Feature-specific hooks
├── stores/         → Feature-specific state (Zustand)
├── types/          → Feature-specific types
├── utils/          → Feature-specific utilities
└── index.ts        → Public exports
```

**Features:**

- `auth/` - Wallet authentication
- `chat/` - Real-time messaging
- `communities/` - Community discovery & management
- `governance/` - Proposals & voting
- `storage/` - File management
- `profile/` - User profiles

---

## Data Flow Patterns

### Pattern 1: Server State with TanStack Query

```typescript
import { useQuery } from '@tanstack/react-query';
import { apiClient, endpoints } from '@/lib/api';

// In a hook
export function useCommunities() {
  return useQuery({
    queryKey: ['communities'],
    queryFn: () => apiClient.get(endpoints.communities.list),
    staleTime: CACHE_TIMES.LONG,
  });
}

// In a component
function CommunitiesList() {
  const { data: communities, isLoading, error } = useCommunities();

  if (isLoading) return <Loading />;
  if (error) return <Error error={error} />;

  return communities?.items.map(c => <CommunityCard key={c.id} community={c} />);
}
```

### Pattern 2: Client State with Zustand

```typescript
// In a store
const useChatStore = create((set) => ({
  selectedCommunityId: null,
  messages: [],
  setSelectedCommunity: (id) => set({ selectedCommunityId: id }),
}));

// In a component
function Chat() {
  const { selectedCommunityId, setSelectedCommunity } = useChatStore();

  return (
    <select onChange={(e) => setSelectedCommunity(e.target.value)}>
      {/* options */}
    </select>
  );
}
```

### Pattern 3: Real-Time Updates with WebSocket

```typescript
import { useWebSocket } from '@/hooks';
import { WebSocketEvents } from '@/lib/websocket';

function ChatWindow() {
  const { subscribe, isConnected } = useWebSocket();
  const { addMessage } = useChatStore();

  useEffect(() => {
    if (!isConnected) return;

    const unsub = subscribe(WebSocketEvents.MESSAGE_RECEIVED, (msg) =>
      addMessage(msg.data.message)
    );

    return unsub;
  }, [isConnected]);
}
```

---

## State Management Strategy

| Type             | Tool                 | Use Case                          |
| ---------------- | -------------------- | --------------------------------- |
| **Server State** | TanStack Query       | API data, caching, syncing        |
| **Client State** | Zustand              | UI state, filters, selections     |
| **Auth State**   | AuthProvider + Store | User session, token               |
| **Real-Time**    | WebSocket            | Chat, notifications, live updates |

---

## Adding a New Feature

### Step 1: Create Feature Structure

```bash
mkdir -p src/features/my-feature/{components,hooks,stores,types,utils}
```

### Step 2: Define Types

```typescript
// src/features/my-feature/types/index.ts
export interface MyFeatureState {
  /* ... */
}
```

### Step 3: Create Store (if needed)

```typescript
// src/features/my-feature/stores/myStore.ts
import { create } from 'zustand';

export const useMyStore = create((set) => ({
  // state
}));
```

### Step 4: Create Hooks

```typescript
// src/features/my-feature/hooks/useMyFeature.ts
export function useMyFeature() {
  /* ... */
}
```

### Step 5: Create Components

```typescript
// src/features/my-feature/components/MyComponent.tsx
export function MyComponent() {
  /* ... */
}
```

### Step 6: Export Public API

```typescript
// src/features/my-feature/index.ts
export { useMyFeature } from './hooks';
export { MyComponent } from './components/MyComponent';
export * from './types';
```

### Step 7: Use in App

```typescript
import { useMyFeature, MyComponent } from '@/features/my-feature';
```

---

## Routing Strategy

### Route Groups by Access Level

```
app/
├── (auth)/                 # Public auth routes
│   ├── layout.tsx
│   └── connect/page.tsx
├── (dashboard)/            # Protected routes
│   ├── layout.tsx          # Requires wallet connection
│   ├── page.tsx
│   ├── communities/
│   ├── messages/
│   ├── governance/
│   └── settings/
```

### Route Protection

```typescript
// app/(dashboard)/layout.tsx
'use client';

import { useAuth } from '@/features/auth';

export default function DashboardLayout({ children }) {
  const { isConnected } = useAuth();

  if (!isConnected) {
    redirect('/auth/connect');
  }

  return children;
}
```

---

## Performance Optimization

### Query Caching Strategy

```typescript
const CACHE_TIMES = {
  INSTANT: 0, // No cache
  SHORT: 1 * 60 * 1000, // 1 minute
  MEDIUM: 5 * 60 * 1000, // 5 minutes
  LONG: 30 * 60 * 1000, // 30 minutes
  VERY_LONG: 24 * 60 * 60 * 1000, // 24 hours
};

// Use appropriate cache time for each query
useQuery({
  queryKey: ['communities'],
  queryFn: fetchCommunities,
  staleTime: CACHE_TIMES.LONG, // Data fresh for 30min
  gcTime: CACHE_TIMES.VERY_LONG, // Keep in memory for 24h
});
```

### Code Splitting

- Features are naturally code-split via route groups
- Use dynamic imports for heavy components:
  ```typescript
  const ChatWindow = dynamic(() => import('@/features/chat'), {
    loading: () => <Skeleton />,
  });
  ```

---

## API Integration

### Endpoint Organization

```typescript
// lib/api/endpoints.ts
export const endpoints = {
  auth: {
    me: '/api/auth/me',
  },
  communities: {
    list: '/api/communities',
    detail: (id) => `/api/communities/${id}`,
  },
};
```

### Typed API Calls

```typescript
import { apiClient, endpoints } from '@/lib/api';
import type { GetCommunityResponse } from '@/lib/api';

const response = await apiClient.get<GetCommunityResponse>(endpoints.communities.detail(id));
```

---

## Error Handling

```typescript
import { AetherError, AuthError, ValidationError } from '@/types';

try {
  await apiClient.post(endpoint, data);
} catch (error) {
  if (error instanceof AuthError) {
    // Handle auth errors
  } else if (error instanceof ValidationError) {
    // Handle validation errors
  } else if (error instanceof AetherError) {
    // Handle API errors
  }
}
```

---

## Development Workflow

1. **Feature Development**
   - Create feature folder with all layers
   - Write types first
   - Implement hooks (API + state)
   - Build components
   - Export public API

2. **Testing**
   - Test hooks in isolation
   - Test components with mocked hooks
   - Integration tests for features

3. **Integration**
   - Import and use in pages/layouts
   - Verify data flow
   - Check caching behavior

---

## Summary

This architecture provides:

- ✅ **Modularity**: Features are self-contained and reusable
- ✅ **Type Safety**: Full TypeScript with strict types
- ✅ **Scalability**: Easy to add features without refactoring
- ✅ **Performance**: Optimized caching and code splitting
- ✅ **DX**: Clear patterns and conventions
- ✅ **Maintainability**: Organized layers with clear responsibilities
