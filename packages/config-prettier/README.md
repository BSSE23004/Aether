README for @aether/config-prettier

# Shared Prettier Configuration

Centralized code formatting for all projects in Aether.

## Usage

In root .prettierrc or in package directories:

```js
module.exports = require('@aether/config-prettier');
```

Or inline:

```json
{
  "semi": true,
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2
}
```

## Default Settings

- **Semicolons**: Enabled
- **Single Quotes**: Yes
- **Print Width**: 100 characters
- **Tab Width**: 2 spaces
- **Trailing Commas**: ES5 (objects/arrays, not function args)
- **Arrow Parens**: Always
- **End of Line**: LF (Unix)

## Ignored Files

- node_modules
- dist, build, .next
- \*.lock, pnpm-lock.yaml
