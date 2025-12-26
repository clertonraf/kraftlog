#!/bin/bash
echo "Testing API connectivity from iOS Simulator perspective..."
echo ""

# Test 1: localhost
echo "1. Testing localhost:8080..."
curl -s -o /dev/null -w "HTTP %{http_code} - Time: %{time_total}s\n" http://localhost:8080/api/auth/login \
  -X POST -H "Content-Type: application/json" -d '{"email":"test","password":"test"}'

# Test 2: 127.0.0.1
echo "2. Testing 127.0.0.1:8080..."
curl -s -o /dev/null -w "HTTP %{http_code} - Time: %{time_total}s\n" http://127.0.0.1:8080/api/auth/login \
  -X POST -H "Content-Type: application/json" -d '{"email":"test","password":"test"}'

# Test 3: Check if backend is listening
echo ""
echo "3. Backend listening ports:"
docker-compose exec -T backend netstat -tln 2>/dev/null | grep 8080 || echo "Could not check ports"

echo ""
echo "4. Backend health:"
curl -s http://localhost:8080/actuator/health 2>&1 | head -5 || echo "No actuator endpoint"

