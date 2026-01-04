#!/bin/bash
set -e

echo "🔧 Setting up E2E tests..."

# Check if NODE_ENV is set to production
if [ "$NODE_ENV" = "production" ]; then
  echo "⚠️  WARNING: NODE_ENV is set to 'production'"
  echo "   This prevents devDependencies from installing."
  echo "   Temporarily unsetting for installation..."
  unset NODE_ENV
fi

# 1. Install dependencies
echo "📦 Installing dependencies (including devDependencies)..."
npm install

# 2. Create Playwright symlink
echo "🔗 Creating Playwright symlink..."
mkdir -p node_modules/@playwright
ln -sf ~/.nvm/versions/node/v25.1.0/lib/node_modules/@playwright/test node_modules/@playwright/test

# 3. Verify setup
if [ -L node_modules/@playwright/test ]; then
  echo "✅ Playwright symlink created"
else
  echo "❌ Failed to create Playwright symlink"
  exit 1
fi

if [ -f node_modules/typescript/lib/typescript.js ]; then
  echo "✅ TypeScript installed"
else
  echo "❌ TypeScript not installed"
  exit 1
fi

if [ -f node_modules/@types/react/index.d.ts ]; then
  echo "✅ @types/react installed"
else
  echo "❌ @types/react not installed"
  exit 1
fi

echo ""
echo "✅ E2E setup complete!"
echo ""
echo "To run tests:"
echo "  playwright test e2e/smoke.spec.ts"
echo ""
echo "⚠️  If you have NODE_ENV=production in your shell, unset it first:"
echo "  unset NODE_ENV"
