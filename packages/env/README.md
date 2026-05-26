README for @aether/env package

# Environment Helpers

Centralized environment variable management for Aether.

## Usage

### Client-side (Frontend)

```typescript
import { clientEnv } from '@aether/env/client';

console.log(clientEnv.API_URL);
console.log(clientEnv.CHAIN_ID);
```

### Server-side (Backend)

```typescript
import { serverEnv, validateProductionEnv } from '@aether/env/server';

// Validate in production
if (process.env.NODE_ENV === 'production') {
  validateProductionEnv();
}

// Use env
console.log(serverEnv.DATABASE_URL);
```

### Utilities

```typescript
import { isDev, isProd, getEnv, validateEnv } from '@aether/env';

if (isDev()) {
  console.log('In development');
}

const apiKey = getEnv('API_KEY', 'default-value');
```
