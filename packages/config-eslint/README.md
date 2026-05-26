README for @aether/config-eslint

# Shared ESLint Configuration

Centralized ESLint rules for all projects in Aether.

## Usage

In root .eslintrc.json or in each app:

```json
{
  "root": true,
  "extends": ["@aether/config-eslint"]
}
```

## Rules

- Strict TypeScript checking
- No unused variables (unless prefixed with \_)
- Explicit function return types (warn)
- No explicit any (warn)
- Console.log restrictions (only warn/error allowed)

## Overrides

Can be overridden per app for specific needs.

Example for Next.js:

```json
{
  "extends": ["@aether/config-eslint"],
  "overrides": [
    {
      "files": ["**/*.ts?(x)"],
      "parserOptions": {
        "project": ["./tsconfig.json"]
      }
    }
  ]
}
```
