#!/bin/bash

echo "🔍 Verifying Maestro test configuration..."
echo ""

ERRORS=0

# Check for invalid 'wait' commands
echo "Checking for invalid 'wait' commands..."
if grep -r "^- wait:" .maestro/*.yaml 2>/dev/null; then
    echo "❌ Found invalid 'wait:' commands. Use 'waitForAnimationToEnd' instead."
    ERRORS=$((ERRORS + 1))
else
    echo "✅ No invalid 'wait' commands found"
fi

# Check for invalid 'timeout' at root level
echo ""
echo "Checking for invalid root-level 'timeout' properties..."
if grep -E "^timeout:|^  timeout:" .maestro/*.yaml 2>/dev/null | grep -v "waitForAnimationToEnd:" | grep -v "^    timeout:" ; then
    echo "❌ Found invalid 'timeout' properties. Only use inside 'waitForAnimationToEnd'."
    ERRORS=$((ERRORS + 1))
else
    echo "✅ No invalid 'timeout' properties found"
fi

# Check that all files have appId
echo ""
echo "Checking that all test files have appId..."
for file in .maestro/*.yaml; do
    if [ "$file" != ".maestro/config.yaml" ]; then
        if ! grep -q "^appId:" "$file"; then
            echo "❌ Missing appId in $file"
            ERRORS=$((ERRORS + 1))
        fi
    fi
done
echo "✅ All test files have appId"

echo ""
if [ $ERRORS -eq 0 ]; then
    echo "✅ All Maestro configuration checks passed!"
    exit 0
else
    echo "❌ Found $ERRORS error(s) in Maestro configuration"
    exit 1
fi
