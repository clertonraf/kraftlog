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
# Pre-commit hook to run Biome linting and TypeScript type checking

echo "Running Biome linter..."

# Run Biome check with auto-fix on staged files
npx @biomejs/biome check --write --staged .

# Get staged files
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(ts|tsx|js|jsx)$' || true)

if [ -z "$STAGED_FILES" ]; then
  echo "✓ No staged TypeScript/JavaScript files to lint"
else
  # Re-add auto-fixed files
  echo "$STAGED_FILES" | xargs git add
  echo "✓ Biome linting completed"
fi

# Run TypeScript type checking
echo "Running TypeScript type checker..."
npx tsc --noEmit

if [ $? -ne 0 ]; then
  echo ""
  echo "❌ TypeScript type checking failed!"
  echo "Please fix the type errors before committing."
  echo ""
  echo "To bypass this check (not recommended), use: git commit --no-verify"
  exit 1
fi

echo "✓ TypeScript type checking passed"
echo ""
echo "✅ All checks passed! Proceeding with commit..."
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
echo "  - Run TypeScript type checking (tsc --noEmit)"
echo "  - Block commits if type errors are found"
echo ""
echo "To review all issues before pushing, run: npm run lint"
echo "To bypass the hook (not recommended), use: git commit --no-verify"
