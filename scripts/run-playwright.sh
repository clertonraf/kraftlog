#!/bin/bash
# Wrapper script to run Playwright E2E tests
# This ensures npx doesn't prompt for installation

set -e

# Run playwright with yes piped to avoid prompts
yes | npx @playwright/test@1.57.0 "$@" 2>&1 | grep -v "^y$" || true
