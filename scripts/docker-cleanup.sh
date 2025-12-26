#!/bin/bash

# KraftLog Docker Cleanup Script
# This script purges all Docker resources for a clean restart

echo "🧹 KraftLog Docker Cleanup"
echo "=========================="
echo ""
echo "This will remove:"
echo "  - All KraftLog containers"
echo "  - All KraftLog images"
echo "  - All KraftLog volumes"
echo "  - All KraftLog networks"
echo ""
read -p "Are you sure you want to continue? (y/N) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Cleanup cancelled"
    exit 1
fi

echo ""
echo "🛑 Stopping all KraftLog containers..."
docker-compose down

echo ""
echo "🗑️  Removing containers..."
docker ps -a | grep kraftlog | awk '{print $1}' | xargs -r docker rm -f

echo ""
echo "🗑️  Removing images..."
docker images | grep kraftlog | awk '{print $3}' | xargs -r docker rmi -f

echo ""
echo "🗑️  Removing volumes..."
docker volume ls | grep kraftlog | awk '{print $2}' | xargs -r docker volume rm

echo ""
echo "🗑️  Removing networks..."
docker network ls | grep kraftlog | awk '{print $1}' | xargs -r docker network rm

echo ""
echo "🧹 Pruning unused Docker resources..."
docker system prune -f

echo ""
echo "✅ Cleanup complete!"
echo ""
echo "To rebuild and start services:"
echo "  docker-compose up --build -d"
