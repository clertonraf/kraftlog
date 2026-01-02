# Biome Linter Setup

This project uses [Biome](https://biomejs.dev/) for linting and formatting TypeScript/JavaScript code.

## Why Biome?

Biome was chosen for this project because:

1. **Performance**: Biome is written in Rust and is significantly faster than ESLint + Prettier
2. **All-in-one**: Combines linting, formatting, and import sorting in a single tool
3. **Zero Config**: Works out of the box with sensible defaults
4. **Better Error Messages**: Provides clear, actionable error messages
5. **Compatibility**: Can replace ESLint and Prettier without major changes to workflow

## Available Commands

```bash
# Check for linting and formatting issues
npm run lint

# Auto-fix safe issues
npm run lint:fix

# Auto-fix all issues (including unsafe fixes)
npm run lint:unsafe

# Format code only
npm run format
```

## Configuration

The Biome configuration is in `biome.json` at the project root. Key settings:

- **Indent**: 2 spaces
- **Line Width**: 100 characters
- **Quote Style**: Single quotes for JS/TS, double quotes for JSX
- **Semicolons**: Always required
- **Trailing Commas**: ES5 style

## IDE Integration

### VS Code

Install the official Biome extension:
1. Open VS Code
2. Go to Extensions (Cmd+Shift+X)
3. Search for "Biome"
4. Install the official Biome extension by biomejs

Add to your `.vscode/settings.json`:
```json
{
  "editor.defaultFormatter": "biomejs.biome",
  "editor.formatOnSave": true,
  "[javascript]": {
    "editor.defaultFormatter": "biomejs.biome"
  },
  "[typescript]": {
    "editor.defaultFormatter": "biomejs.biome"
  },
  "[typescriptreact]": {
    "editor.defaultFormatter": "biomejs.biome"
  }
}
```

### Other Editors

See [Biome editor integrations](https://biomejs.dev/guides/editors/first-party-extensions/)

## Ignored Files

The following files/directories are automatically ignored via `.gitignore`:
- `node_modules/`
- `coverage/`
- `.expo/`
- `android/`
- `ios/`
- Build and dist directories

Config files (`.config.js`, `.setup.js`) have linting disabled via overrides.

## Migration from ESLint

Biome has replaced ESLint in this project. The old ESLint config is kept for reference but not actively used. If you need to run ESLint for any reason, use `npx expo lint`.

## Pre-commit Hooks

Consider setting up a pre-commit hook to run Biome automatically:

```bash
# .git/hooks/pre-commit
#!/bin/sh
npm run lint:fix
```

## Troubleshooting

**Issue**: `biome: command not found`
- **Solution**: Use `npm run lint` or `npx @biomejs/biome check .`

**Issue**: Too many errors reported
- **Solution**: Run `npm run lint:fix` to auto-fix most issues

**Issue**: Want to disable a specific rule
- **Solution**: Edit `biome.json` and add the rule to the `rules` section
