# Linting Setup

This project uses [Biome](https://biomejs.dev/) for linting and code formatting.

## Quick Start

### Install Git Hooks

Run this after cloning the repository or running `npm install`:

```bash
npm run setup-hooks
```

This will install a pre-commit hook that automatically lints and fixes code before each commit.

### Available Commands

- `npm run lint` - Check code for lint issues
- `npm run lint:fix` - Auto-fix safe lint issues
- `npm run lint:unsafe` - Auto-fix all lint issues (including unsafe fixes)
- `npm run format` - Format code according to style rules

## Configuration

Linting configuration is in `biome.json`. Key settings:

- **Formatter**: 2-space indentation, single quotes for JS, double quotes for JSX
- **Linter**: Recommended rules enabled with some customizations
- **Hook Warnings**: The following React hook dependency warnings are currently allowed:
  - `noInvalidUseBeforeDeclaration`
  - `useExhaustiveDependencies`

## Pre-commit Hook

The pre-commit hook automatically:
1. Runs Biome linter on staged files
2. Auto-fixes issues when possible
3. Re-stages fixed files
4. Allows commits with warnings (not critical errors)

To bypass the hook (not recommended):
```bash
git commit --no-verify
```

## Current Lint Status

As of the latest update:
- **Errors**: ~1 (being addressed)
- **Warnings**: ~37 (mostly React hook dependencies - safe to commit)

### Common Warnings

Most warnings are related to React hook dependencies:
- Functions used in `useEffect` or `useCallback` should be wrapped in `useCallback`
- These warnings don't break functionality but may cause unnecessary re-renders

To fix these warnings, wrap async functions in `useCallback`:

```typescript
// Before
const loadData = async () => {
  // ...
};

useEffect(() => {
  loadData();
}, [loadData]); // Warning: loadData changes on every render

// After
const loadData = useCallback(async () => {
  // ...
}, [/* dependencies */]);

useEffect(() => {
  loadData();
}, [loadData]); // No warning
```

## Why Biome?

Biome was chosen for this project because:
- **Fast**: Written in Rust, significantly faster than ESLint
- **All-in-one**: Combines linting and formatting (replaces ESLint + Prettier)
- **React-aware**: Built-in understanding of React patterns
- **Modern**: Native support for TypeScript and JSX
- **Zero config**: Works great with minimal configuration

## IDE Integration

### VS Code

Install the [Biome extension](https://marketplace.visualstudio.com/items?itemName=biomejs.biome):

```bash
code --install-extension biomejs.biome
```

Add to your `.vscode/settings.json`:

```json
{
  "editor.defaultFormatter": "biomejs.biome",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "quickfix.biome": "explicit"
  }
}
```

### Other Editors

See [Biome editor integration](https://biomejs.dev/guides/integrate-in-editor/) for other editors.

## Continuous Integration

Add this to your CI pipeline:

```bash
npm run lint
```

The CI should fail only on actual errors, not warnings.

## Troubleshooting

### Hook not running

Make sure the hook is executable:
```bash
chmod +x .git/hooks/pre-commit
```

Or reinstall hooks:
```bash
npm run setup-hooks
```

### Too many warnings

Run the unsafe fix to address all warnings at once:
```bash
npm run lint:unsafe
```

Review the changes and commit.

### Lint errors blocking commits

If you need to commit despite errors (emergency fix):
```bash
git commit --no-verify
```

But please fix the errors in a follow-up commit!
