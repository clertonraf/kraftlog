#!/bin/bash

# Build Docker images for KraftLog backend services
set -e

echo "🏗️  Building KraftLog Docker Images"
echo "=================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
KRAFTLOG_API_DIR="/Users/clerton/workspace/KraftLogApi"
KRAFTLOG_IMPORT_DIR="/Users/clerton/workspace/KraftLogImport"

# Check if directories exist
if [ ! -d "$KRAFTLOG_API_DIR" ]; then
  echo -e "${RED}❌ KraftLogApi directory not found at $KRAFTLOG_API_DIR${NC}"
  exit 1
fi

if [ ! -d "$KRAFTLOG_IMPORT_DIR" ]; then
  echo -e "${RED}❌ KraftLogImport directory not found at $KRAFTLOG_IMPORT_DIR${NC}"
  exit 1
fi

# Build KraftLogApi
echo -e "${BLUE}📦 Building KraftLog API Docker image...${NC}"
cd "$KRAFTLOG_API_DIR"

if [ ! -f "Dockerfile" ]; then
  echo -e "${RED}❌ Dockerfile not found in $KRAFTLOG_API_DIR${NC}"
  exit 1
fi

docker build -t kraftlog-api:latest .
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ KraftLog API image built successfully${NC}"
else
  echo -e "${RED}❌ Failed to build KraftLog API image${NC}"
  exit 1
fi

echo ""

# Build KraftLogImport
echo -e "${BLUE}📦 Building KraftLog Import Docker image...${NC}"
cd "$KRAFTLOG_IMPORT_DIR"

if [ ! -f "Dockerfile" ]; then
  echo -e "${RED}❌ Dockerfile not found in $KRAFTLOG_IMPORT_DIR${NC}"
  exit 1
fi

docker build -t kraftlog-import:latest .
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ KraftLog Import image built successfully${NC}"
else
  echo -e "${RED}❌ Failed to build KraftLog Import image${NC}"
  exit 1
fi

echo ""
echo -e "${GREEN}🎉 All Docker images built successfully!${NC}"
echo ""
echo "Available images:"
docker images | grep kraftlog
