#!/bin/bash

# Script to fix Flyway migration issue by repairing the schema history

echo "🔧 Fixing Flyway Migration Issue..."

# Connect to PostgreSQL and repair Flyway schema
docker exec kraftlog-postgres psql -U postgres -d kraftlog -c "
DELETE FROM flyway_schema_history WHERE version = '6' AND success = false;
"

if [ $? -eq 0 ]; then
    echo "✅ Flyway schema history repaired"
    echo "🔄 Restarting backend container..."
    docker compose restart backend
    
    echo "⏳ Waiting for backend to start..."
    sleep 5
    
    # Check if backend is now healthy
    for i in {1..12}; do
        if curl -s http://localhost:8080/api/health > /dev/null 2>&1; then
            echo "✅ Backend is now healthy!"
            exit 0
        fi
        echo "   Waiting... ($i/12)"
        sleep 5
    done
    
    echo "⚠️  Backend may need more time to start"
    echo "   Check logs with: docker compose logs backend"
else
    echo "❌ Failed to repair Flyway schema"
    exit 1
fi
