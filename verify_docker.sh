#!/bin/bash

# CodeCouncil AI - Docker Verification Script

echo "🐳 Docker Verification Started"
echo "=============================="

# 1. Stop local services (to free up ports)
echo "🛑 Stopping local services..."
pkill -f "npm run dev" || echo "No local services running."

# 2. Build and Start Docker Containers
echo "🏗️  Building and starting containers..."
# Bypass Docker credential helper issue
mkdir -p .docker_tmp
echo '{"credsStore": ""}' > .docker_tmp/config.json
export DOCKER_CONFIG=$(pwd)/.docker_tmp

docker-compose up --build -d

# 3. Wait for services to be ready
echo "⏳ Waiting for services to initialize..."
sleep 15

# 4. Verify Backend
echo "🔍 Verifying Backend..."
if curl -s http://localhost:5001/health | grep -q "ok"; then
    echo "✅ Backend is HEALTHY (http://localhost:5001)"
else
    echo "❌ Backend is UNHEALTHY"
    docker-compose logs backend
    exit 1
fi

# 5. Verify Frontend
echo "🔍 Verifying Frontend..."
if curl -s -I http://localhost:3000 | grep -q "200 OK"; then
    echo "✅ Frontend is ACCESSIBLE (http://localhost:3000)"
else
    echo "❌ Frontend is UNREACHABLE"
    docker-compose logs frontend
    exit 1
fi

echo ""
echo "🎉 Docker Deployment Verified!"
echo "   - Frontend: http://localhost:3000"
echo "   - Backend:  http://localhost:5001"
