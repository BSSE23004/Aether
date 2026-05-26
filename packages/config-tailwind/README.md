README for @aether/config-tailwind

# Shared Tailwind CSS Configuration

Centralized Tailwind CSS configuration for all projects in Aether.

## Usage

In your tailwind.config.js:

```js
const config = require('@aether/config-tailwind');

module.exports = {
  ...config,
  // Override specific settings if needed
  theme: {
    extend: {
      // Your custom extensions
    },
  },
};
```

Or extend directly:

```js
module.exports = {
  extends: '@aether/config-tailwind',
  // overrides
};
```

## Included

- **Aether Color Palette**:
  - Primary: Indigo (#6366f1)
  - Secondary: Violet (#8b5cf6)
  - Accent: Pink (#ec4899)

- **Custom Animations**:
  - fade-in
  - slide-up

- **Plugins**:
  - tailwindcss-animate (for smooth transitions)

## Content Paths

Configured to scan:

- App/pages/components directories
- UI package components

Adjust `content` array in your config for additional paths.
