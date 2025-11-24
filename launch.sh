#!/bin/bash

# CodeCouncil AI – Production Launch Script
# This script prepares the app for production deployment

set -e

echo "🚀 CodeCouncil AI – Production Launch Check"
echo "=========================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Function to print status
check() {
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓${NC} $1"
  else
    echo -e "${RED}✗${NC} $1"
    exit 1
  fi
}

warning() {
  echo -e "${YELLOW}⚠${NC} $1"
}

# 1. Backend checks
echo -e "\n${YELLOW}Checking Backend...${NC}"
cd backend

# Type check
npx tsc --noEmit
check "Backend TypeScript compilation"

# Build
npm run build
check "Backend build successful"

# Check env vars
if [ ! -f .env.local ]; then
  warning "backend/.env.local not found (create from .env.example)"
else
  grep -q "GOOGLE_CLIENT_ID" .env.local && check "GOOGLE_CLIENT_ID set" || warning "GOOGLE_CLIENT_ID not set"
  grep -q "GEMINI_API_KEY" .env.local && check "GEMINI_API_KEY set" || warning "GEMINI_API_KEY not set"
  grep -q "JWT_SECRET" .env.local && check "JWT_SECRET set" || warning "JWT_SECRET not set"
fi

cd ..

# 2. Frontend checks
echo -e "\n${YELLOW}Checking Frontend...${NC}"
cd codecouncil-ai

# Type check
npx tsc --noEmit
check "Frontend TypeScript compilation"

# Build
npm run build
check "Frontend build successful"

# Check env vars
if [ ! -f .env.local ]; then
  warning "codecouncil-ai/.env.local not found (create from .env.example)"
else
  grep -q "VITE_API_URL" .env.local && check "VITE_API_URL set" || warning "VITE_API_URL not set"
  grep -q "VITE_GOOGLE_CLIENT_ID" .env.local && check "VITE_GOOGLE_CLIENT_ID set" || warning "VITE_GOOGLE_CLIENT_ID not set"
fi

cd ..

# 3. Docker checks
echo -e "\n${YELLOW}Checking Docker...${NC}"
if command -v docker &> /dev/null; then
  check "Docker is installed"
  docker-compose config > /dev/null
  check "docker-compose.yml is valid"
else
  warning "Docker not installed (required for containerized deployment)"
fi

# 4. Git checks
echo -e "\n${YELLOW}Checking Git...${NC}"
if git log -1 --format=%H &> /dev/null; then
  check "Repository has commits"
  
  # Check for uncommitted changes
  if git diff-index --quiet HEAD --; then
    check "All changes committed"
  else
    warning "Uncommitted changes detected. Commit before deploying."
  fi
else
  warning "Not a git repository"
fi

# 5. Summary
echo -e "\n${GREEN}=========================================="
echo "✓ Production readiness check complete!"
echo "=========================================${NC}"

echo -e "\n${YELLOW}Next steps:${NC}"
echo "1. Update GitHub secrets for CI/CD (RAILWAY_TOKEN, VERCEL_TOKEN, etc.)"
echo "2. Deploy backend: cd backend && npm run build && deploy"
echo "3. Deploy frontend: npm run build && vercel deploy --prod"
echo "4. Monitor health: curl https://your-api.com/health"
echo "5. Set up error tracking: Sentry, DataDog, or CloudWatch"
echo ""
echo "See DEPLOY.md for detailed deployment instructions."
