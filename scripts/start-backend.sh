#!/bin/bash

# KraftLog Backend Quick Start Script

echo "🚀 Starting KraftLog Backend..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop."
    exit 1
fi

# Check if KraftLogApi exists
if [ ! -d "../KraftLogApi" ]; then
    echo "❌ KraftLogApi repository not found at ../KraftLogApi"
    echo "Please clone the repository first:"
    echo "  cd .. && git clone https://github.com/clertonraf/KraftLogApi.git"
    exit 1
fi

# Start services
echo "📦 Starting PostgreSQL and Backend API..."
docker-compose up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check health
echo "🔍 Checking service health..."
if curl -f http://localhost:8080/actuator/health > /dev/null 2>&1; then
    echo "✅ Backend is running at http://localhost:8080"
    echo "✅ Database is running at localhost:5433"
    echo ""
    echo "📝 Test the API:"
    echo "  curl http://localhost:8080/api/auth/login -X POST \\"
    echo "    -H 'Content-Type: application/json' \\"
    echo "    -d '{\"email\":\"admin@kraftlog.com\",\"password\":\"admin123\"}'"
    echo ""
    echo "📊 View logs:"
    echo "  docker-compose logs -f backend"
    echo ""
    echo "🛑 Stop services:"
    echo "  docker-compose down"
else
    echo "⚠️  Backend is starting... This may take a minute."
    echo "   Check logs: docker-compose logs -f backend"
fi
