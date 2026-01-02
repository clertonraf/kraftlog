#!/bin/bash
# Setup script to install git hooks

HOOKS_DIR=".git/hooks"
PRE_COMMIT_HOOK="$HOOKS_DIR/pre-commit"

echo "Setting up git hooks..."

# Check if .git directory exists
if [ ! -d ".git" ]; then
  echo "Error: This script must be run from the root of a git repository."
  exit 1
fi

# Create hooks directory if it doesn't exist
mkdir -p "$HOOKS_DIR"

# Create pre-commit hook
cat > "$PRE_COMMIT_HOOK" << 'EOF'
#!/bin/sh
# Pre-commit hook to run Biome linting

echo "Running Biome linter..."

# Run Biome check with auto-fix on staged files
npx @biomejs/biome check --write --staged .

# Get staged files
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(ts|tsx|js|jsx)$' || true)

if [ -z "$STAGED_FILES" ]; then
  echo "✓ No staged TypeScript/JavaScript files to lint"
  exit 0
fi

# Re-add auto-fixed files
echo "$STAGED_FILES" | xargs git add

echo "✓ Biome linting completed"
echo "Note: Hook allows warnings. Review with 'npm run lint' before pushing."
exit 0
EOF

# Make hook executable
chmod +x "$PRE_COMMIT_HOOK"

echo "✓ Pre-commit hook installed successfully!"
echo ""
echo "The pre-commit hook will automatically:"
echo "  - Run Biome linting on staged files"
echo "  - Auto-fix issues when possible"
echo "  - Re-stage fixed files"
echo "  - Allow commits with warnings (not errors)"
echo ""
echo "To review all issues before pushing, run: npm run lint"
echo "To bypass the hook (not recommended), use: git commit --no-verify"
