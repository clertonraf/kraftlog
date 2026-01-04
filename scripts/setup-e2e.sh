#!/bin/bash
set -e

echo "🔧 Setting up E2E tests..."

# 1. Install dependencies
echo "📦 Installing dependencies..."
npm install

# 2. Create Playwright symlink
echo "🔗 Creating Playwright symlink..."
mkdir -p node_modules/@playwright
ln -sf ~/.nvm/versions/node/v25.1.0/lib/node_modules/@playwright/test node_modules/@playwright/test

# 3. Verify setup
if [ -L node_modules/@playwright/test ]; then
  echo "✅ Playwright symlink created successfully"
else
  echo "❌ Failed to create Playwright symlink"
  exit 1
fi

echo "✅ E2E setup complete! Run: playwright test e2e/smoke.spec.ts"
