#!/bin/bash

# CodeCouncil AI - Quick Start Guide
# This script helps you launch the application locally with all enterprise features

set -e

echo "🚀 CodeCouncil AI - Enterprise Setup"
echo "===================================="

# 1. Environment Setup
echo ""
echo "📝 Step 1: Configuring environment..."

if [ ! -f "backend/.env" ]; then
    cp backend/.env.example backend/.env
    echo "✅ Created backend/.env - UPDATE with your Stripe/Sentry/SendGrid keys"
fi

if [ ! -f "codecouncil-ai/.env" ]; then
    cp codecouncil-ai/.env.example codecouncil-ai/.env
    echo "✅ Created frontend/.env - UPDATE with your Google OAuth client ID"
fi

# 2. Database Setup
echo ""
echo "🗄️  Step 2: Setting up database..."

cd backend

if command -v node &> /dev/null; then
    echo "✅ Node.js found"
    
    # Check if node_modules exist
    if [ ! -d "node_modules" ]; then
        echo "📦 Installing backend dependencies..."
        npm install
    fi
    
    # Run migrations
    echo "🔄 Running database migrations..."
    npx prisma migrate dev --name init || npx prisma db push
    
    echo "🌱 Seeding database with demo data..."
    npm run db:seed
    
    echo "✅ Database setup complete"
else
    echo "❌ Node.js not found. Please install Node.js 18+ first."
    exit 1
fi

cd ..

# 3. Frontend Setup
echo ""
echo "🎨 Step 3: Setting up frontend..."

cd codecouncil-ai

if [ ! -d "node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    npm install
fi

echo "✅ Frontend dependencies installed"

cd ..

# 4. Docker Setup (Optional)
echo ""
echo "🐳 Step 4: Docker setup (optional)"

if command -v docker &> /dev/null && command -v docker-compose &> /dev/null; then
    echo "✅ Docker found"
    
    echo ""
    read -p "Start services with Docker Compose? (y/n) " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🚀 Starting main services (PostgreSQL + Backend + Frontend)..."
        docker-compose up -d
        
        read -p "Start monitoring stack? (Prometheus + Grafana) (y/n) " -n 1 -r
        echo
        
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            echo "📊 Starting monitoring stack..."
            docker-compose -f docker-compose.yml -f docker-compose.monitoring.yml up -d
            echo "✅ Monitoring available:"
            echo "   - Prometheus: http://localhost:9090"
            echo "   - Grafana: http://localhost:3001"
        fi
        
        echo ""
        echo "✅ All services started!"
        echo ""
        echo "📍 Access points:"
        echo "   - Frontend: http://localhost:3000"
        echo "   - Backend: http://localhost:5000"
        echo "   - Database: postgres://user:password@localhost:5432/codecouncil_ai"
        echo ""
        
        # Wait for services to start
        echo "⏳ Waiting for services to be ready..."
        sleep 5
        
        echo "🔗 Health checks:"
        curl -s http://localhost:5000/health && echo "✅ Backend health OK"
        
        exit 0
    fi
else
    echo "⚠️  Docker not found. You can still run services manually:"
    echo "   npm run dev (in backend directory)"
    echo "   npm run dev (in frontend directory)"
fi

# 5. Manual Setup (Fallback)
echo ""
echo "🔧 Manual Startup Instructions"
echo "=============================="
echo ""
echo "Terminal 1 - Start PostgreSQL (if not using Docker):"
echo "  docker run --name codecouncil-postgres -e POSTGRES_PASSWORD=password -e POSTGRES_DB=codecouncil_ai -p 5432:5432 -d postgres:15"
echo ""
echo "Terminal 2 - Start Backend:"
echo "  cd backend"
echo "  npm run dev"
echo ""
echo "Terminal 3 - Start Frontend:"
echo "  cd codecouncil-ai"
echo "  npm run dev"
echo ""
echo "Then access:"
echo "  Frontend: http://localhost:3000"
echo "  Backend: http://localhost:5000"
echo ""

# 6. Post-Setup Tasks
echo ""
echo "✅ Setup Complete!"
echo ""
echo "📋 Next Steps:"
echo "   1. Update backend/.env with your Stripe API keys"
echo "   2. Update codecouncil-ai/.env with your Google OAuth credentials"
echo "   3. Promote an admin user: UPDATE User SET isAdmin = true WHERE email = '...'"
echo "   4. Test subscriptions by accessing /api/subscriptions/plans"
echo "   5. Check admin dashboard at /api/admin/stats"
echo ""
echo "📚 Documentation:"
echo "   - ENTERPRISE.md - Complete feature guide"
echo "   - PRODUCTION.md - Deployment guide"
echo "   - IMPLEMENTATION_SUMMARY.md - What was implemented"
echo ""
echo "🎉 You're ready to launch!"
