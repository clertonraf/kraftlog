# Biome Linting - Quick Reference

## ⚡ Quick Commands

```bash
# Check for issues
npm run lint

# Fix safe issues automatically
npm run lint:fix

# Fix all issues (including unsafe)
npm run lint:unsafe

# Format code
npm run format

# Install/reinstall git hooks
npm run setup-hooks
```

## 📋 Current Status

- ✅ **Errors**: 0
- ⚠️ **Warnings**: 37 (non-blocking)
- 🎯 **Files**: 70 checked
- 🔧 **Hook**: Active

## 🎨 Style Guide

### Formatting
- **Indentation**: 2 spaces
- **Quotes**: Single for JS, double for JSX
- **Semicolons**: Always
- **Line width**: 100 characters
- **Trailing commas**: ES5 style

### Example
```typescript
// ✅ Good
const user = {
  name: 'John',
  email: 'john@example.com',
};

// ❌ Bad
const user = {
    name: "John",
    email: "john@example.com"
}
```

## 🔍 Common Issues & Fixes

### Unused Variables
```typescript
// ❌ Error
const unused = 'test';

// ✅ Fix: Remove or prefix with _
const _unused = 'test';
```

### Unused Imports
```typescript
// ❌ Error
import React from 'react';

// ✅ Fix: Remove if not used
// (React 17+ doesn't need it for JSX)
```

### Hook Dependencies (Warning)
```typescript
// ⚠️ Warning
const loadData = async () => { /* ... */ };
useEffect(() => {
  loadData();
}, [loadData]); // loadData changes every render

// ✅ Fix: Wrap in useCallback
const loadData = useCallback(async () => {
  /* ... */
}, []);
useEffect(() => {
  loadData();
}, [loadData]); // No warning
```

## 🚫 Bypassing the Hook

**Not recommended**, but if you must:

```bash
git commit --no-verify
```

Please fix issues in a follow-up commit!

## 🆘 Troubleshooting

### Hook not running
```bash
npm run setup-hooks
```

### Too many issues shown
```bash
npm run lint -- --max-diagnostics=10
```

### Want to see only errors
```bash
npx @biomejs/biome check . --diagnostic-level=error
```

### Hook is blocking my commit
```bash
# See what's wrong
npm run lint

# Try to fix automatically
npm run lint:fix

# Or fix unsafe issues
npm run lint:unsafe
```

## 📚 Full Documentation

- **Setup Guide**: [docs/LINTING.md](./LINTING.md)
- **Setup Summary**: [docs/BIOME_SETUP_SUMMARY.md](./BIOME_SETUP_SUMMARY.md)
- **Biome Docs**: https://biomejs.dev/

## 💡 Tips

1. **Install IDE extension** for real-time feedback
2. **Run lint before pushing** to catch issues early
3. **Fix warnings incrementally** as you modify files
4. **Use `lint:unsafe`** to batch-fix issues
5. **Check hook is working**: `ls -la .git/hooks/pre-commit`

## ⚙️ Configuration

Main config file: `biome.json`

Key settings:
```json
{
  "formatter": { "indentStyle": "space", "indentWidth": 2 },
  "linter": { "enabled": true, "rules": { "recommended": true } }
}
```

## 🎯 Goals

- ✅ Consistent code style
- ✅ Catch errors early
- ✅ Improve code quality
- ✅ Fast linting (Biome is written in Rust)
- ✅ Automatic fixes
- ✅ Low friction for developers

---

**Last Updated**: 2026-01-02  
**Maintainer**: Development Team
