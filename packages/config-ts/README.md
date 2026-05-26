README for @aether/config-ts

# Shared TypeScript Configurations

Centralized TypeScript configs for all projects in Aether.

## Configs

### tsconfig.base.json

Base configuration with strict mode and shared path aliases.

### tsconfig.next.json

Extends base with Next.js-specific settings (DOM lib, JSX support).

### tsconfig.node.json

Extends base with Node.js-specific settings (commonjs, node moduleResolution).

## Usage

In each app/package tsconfig.json:

```json
{
  "extends": "@aether/config-ts/base",
  "compilerOptions": {
    "outDir": "dist"
  }
}
```

For Next.js projects:

```json
{
  "extends": "@aether/config-ts/next"
}
```

For Node.js projects:

```json
{
  "extends": "@aether/config-ts/node"
}
```

## Path Aliases

All aliases in tsconfig.base.json are automatically available:

```typescript
// Apps can import from packages with clean paths
import { User } from '@aether/types';
import { Button } from '@aether/ui';
import { formatAddress } from '@aether/utils';
```
