# Aether Shared Configuration Packages

Complete monorepo configuration suite for Aether. All packages are reusable across apps.

## Package Structure

```
packages/
├── config-ts/                    # TypeScript configurations
│   ├── package.json
│   ├── tsconfig.base.json        # Base with path aliases
│   ├── tsconfig.next.json        # Next.js specific
│   ├── tsconfig.node.json        # Node.js specific
│   └── README.md
├── config-eslint/                # ESLint rules
│   ├── package.json
│   ├── eslint.config.js
│   └── README.md
├── config-prettier/              # Prettier formatting
│   ├── package.json
│   ├── prettier.config.js
│   ├── .prettierignore
│   └── README.md
├── config-tailwind/              # Tailwind CSS config
│   ├── package.json
│   ├── tailwind.config.js
│   └── README.md
└── env/                          # Environment helpers
    ├── package.json
    ├── tsconfig.json
    ├── src/
    │   ├── index.ts              # Core utilities (isDev, isProd, etc)
    │   ├── client.ts             # Client-side env (NEXT_PUBLIC_*)
    │   └── server.ts             # Server-side env (SECRET)
    └── README.md
```

## Quick Reference

### @aether/config-ts

TypeScript configurations with strict mode and path aliases.

```json
// In any app tsconfig.json
{
  "extends": "@aether/config-ts/base"
}
```

**Exports**:

- `./base` → tsconfig.base.json (all projects)
- `./next` → tsconfig.next.json (Next.js apps)
- `./node` → tsconfig.node.json (Node/NestJS apps)

### @aether/config-eslint

Shared ESLint rules enforcing code quality.

**Features**:

- TypeScript strict mode rules
- Unused variable detection
- Explicit return types
- Console.log restrictions

### @aether/config-prettier

Consistent code formatting across the monorepo.

**Settings**:

- 100 char line width
- 2 space indentation
- Single quotes
- Semicolons enabled
- ES5 trailing commas

### @aether/config-tailwind

Tailwind CSS with Aether design tokens.

**Includes**:

- Custom color palette (Primary, Secondary, Accent)
- Animation utilities (fade-in, slide-up)
- Responsive design helpers

### @aether/env

Environment variable validation and access.

**Exports**:

- `@aether/env` → Core utilities
- `@aether/env/client` → Client-side env (frontend)
- `@aether/env/server` → Server-side env (backend)

## Usage Examples

### TypeScript Configuration

**Next.js App** (apps/web/tsconfig.json):

```json
{
  "extends": "@aether/config-ts/next",
  "compilerOptions": {
    "outDir": ".next"
  }
}
```

**NestJS App** (apps/api/tsconfig.json):

```json
{
  "extends": "@aether/config-ts/node",
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

### Path Aliases

All apps automatically have these aliases:

```typescript
import { User } from '@aether/types';
import { Button } from '@aether/ui';
import { formatAddress } from '@aether/utils';
import { verifySignature } from '@aether/auth';
import { COMMUNITY_REGISTRY_ABI } from '@aether/blockchain';
import { clientEnv } from '@aether/env/client';
```

### Environment Variables

**Frontend** (apps/web):

```typescript
import { clientEnv } from '@aether/env/client';

const api = clientEnv.API_URL; // http://localhost:3001
const chainId = clientEnv.CHAIN_ID; // 84532
```

**Backend** (apps/api):

```typescript
import { serverEnv, validateProductionEnv } from '@aether/env/server';

validateProductionEnv(); // Validates required vars in production
const dbUrl = serverEnv.DATABASE_URL;
const jwtSecret = serverEnv.JWT_SECRET;
```

### ESLint Usage

In root .eslintrc.json:

```json
{
  "extends": ["@aether/config-eslint"],
  "overrides": [
    {
      "files": ["**/*.{ts,tsx}"],
      "rules": {
        "@typescript-eslint/explicit-function-return-types": "error"
      }
    }
  ]
}
```

### Prettier Usage

In root .prettierrc.js:

```js
module.exports = require('@aether/config-prettier');
```

### Tailwind Usage

In Next.js app (apps/web/tailwind.config.js):

```js
const sharedConfig = require('@aether/config-tailwind');

module.exports = {
  ...sharedConfig,
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', '../../packages/**/*.{js,ts,jsx,tsx}'],
};
```

## Environment Variables Reference

### Client-Side (NEXT*PUBLIC*)

```
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=ws://localhost:3001
NEXT_PUBLIC_CHAIN_ID=84532
NEXT_PUBLIC_RPC_URL=https://sepolia.base.org
NEXT_PUBLIC_PINATA_GATEWAY=https://gateway.pinata.cloud
```

### Server-Side (Private)

```
NODE_ENV=development
DATABASE_URL=postgresql://user:pass@localhost:5432/aether_dev
REDIS_URL=redis://localhost:6379
API_PORT=3001
JWT_SECRET=dev-secret-key
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=mistral
```

## Implementation Checklist

- [x] TypeScript configuration package
- [x] ESLint configuration package
- [x] Prettier configuration package
- [x] Tailwind CSS configuration package
- [x] Environment validation package
- [x] Client-side env utilities
- [x] Server-side env utilities
- [x] Path alias documentation
- [x] Usage examples
- [x] README for each package

## Next Steps

1. Update existing app tsconfigs to extend from @aether/config-ts
2. Update root ESLint config to use @aether/config-eslint
3. Update root Prettier config to use @aether/config-prettier
4. Update web app Tailwind to use @aether/config-tailwind
5. Import env helpers in apps/web and apps/api
6. Run `pnpm install` to pick up the new packages
