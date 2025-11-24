#!/bin/bash

# CodeCouncil AI - Pre-Launch Configuration Script
# This script guides you through the final setup steps

set -e

echo "🚀 CodeCouncil AI - Pre-Launch Configuration"
echo "=============================================="
echo ""

# Step 1: Stripe Products
echo "📝 STEP 1: Create Stripe Products"
echo "===================================="
echo ""
echo "Visit: https://dashboard.stripe.com/products"
echo ""
echo "Create 4 products with these price IDs:"
echo ""
echo "1. STARTUP MONTHLY"
echo "   Name: Startup Audit - Monthly"
echo "   Price: \$49.00 USD/month (recurring)"
echo "   Price ID: price_startup_monthly"
echo ""
echo "2. STARTUP ANNUAL"
echo "   Name: Startup Audit - Annual"
echo "   Price: \$499.00 USD/year (recurring)"
echo "   Price ID: price_startup_annual"
echo ""
echo "3. ENTERPRISE MONTHLY"
echo "   Name: Enterprise Deep Dive - Monthly"
echo "   Price: \$149.00 USD/month (recurring)"
echo "   Price ID: price_enterprise_monthly"
echo ""
echo "4. ENTERPRISE ANNUAL"
echo "   Name: Enterprise Deep Dive - Annual"
echo "   Price: \$1,499.00 USD/year (recurring)"
echo "   Price ID: price_enterprise_annual"
echo ""

read -p "✓ Have you created all 4 Stripe products? (yes/no) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Please create the Stripe products first"
    exit 1
fi

echo ""
echo "✅ Great! Now let's configure the environment variables..."
echo ""

# Step 2: Environment Configuration
echo "📝 STEP 2: Environment Configuration"
echo "====================================="
echo ""

# Get Stripe credentials
read -p "Enter your Stripe Public Key (pk_live_... or pk_test_...): " STRIPE_PUBLIC_KEY
read -p "Enter your Stripe Secret Key (sk_live_... or sk_test_...): " -s STRIPE_SECRET_KEY
echo
read -p "Enter your Stripe Webhook Secret (whsec_...): " -s STRIPE_WEBHOOK_SECRET
echo

# Check if backend/.env exists
if [ ! -f "backend/.env.local" ]; then
    echo "Creating backend/.env.local..."
    cp backend/.env.example backend/.env.local
fi

# Update backend/.env with Stripe credentials
echo ""
echo "Updating backend/.env.local with Stripe credentials..."

cat >> backend/.env.local << EOF

# Stripe Configuration
STRIPE_PUBLIC_KEY=$STRIPE_PUBLIC_KEY
STRIPE_SECRET_KEY=$STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET=$STRIPE_WEBHOOK_SECRET
STRIPE_PRICE_STARTUP_MONTHLY=price_startup_monthly
STRIPE_PRICE_STARTUP_ANNUAL=price_startup_annual
STRIPE_PRICE_ENTERPRISE_MONTHLY=price_enterprise_monthly
STRIPE_PRICE_ENTERPRISE_ANNUAL=price_enterprise_annual
EOF

echo "✅ Stripe credentials configured"
echo ""

# Step 3: Database Setup
echo "📝 STEP 3: Database Initialization"
echo "===================================="
echo ""

if ! command -v npm &> /dev/null; then
    echo "❌ npm not found. Please install Node.js first."
    exit 1
fi

cd backend

if [ ! -d "node_modules" ]; then
    echo "Installing backend dependencies..."
    npm install
fi

echo "Creating/updating database..."
npx prisma migrate dev --name stripe_subscriptions || npx prisma db push

echo "Seeding database..."
npm run db:seed

cd ..

echo "✅ Database initialized"
echo ""

# Step 4: Admin User
echo "📝 STEP 4: Create Admin User"
echo "============================="
echo ""

read -p "Enter admin email (or press Enter to skip): " ADMIN_EMAIL

if [ -n "$ADMIN_EMAIL" ]; then
    echo ""
    echo "To promote the user to admin, run after deployment:"
    echo "UPDATE \"User\" SET \"isAdmin\" = true WHERE email = '$ADMIN_EMAIL';"
    echo ""
    echo "For Railway/Render, use the database console."
    echo "For Docker, use: docker exec codecouncil-postgres psql -U postgres"
    echo ""
fi

# Step 5: Deployment Choice
echo "📝 STEP 5: Choose Deployment Platform"
echo "======================================"
echo ""
echo "Choose your deployment platform:"
echo "1) Railway (recommended)"
echo "2) Render"
echo "3) Heroku"
echo "4) AWS Elastic Beanstalk"
echo "5) Docker locally (development)"
echo ""

read -p "Enter your choice (1-5): " -n 1 DEPLOY_CHOICE
echo
echo ""

case $DEPLOY_CHOICE in
    1)
        echo "🚀 Railway Deployment"
        echo "===================="
        echo ""
        echo "1. Go to: https://railway.app"
        echo "2. Sign in with GitHub"
        echo "3. Create new project → GitHub repo"
        echo "4. Select CodeConcilAI repository"
        echo "5. Railway will auto-detect & deploy"
        echo ""
        echo "Environment variables to add in Railway dashboard:"
        echo "  DATABASE_URL (auto-generated)"
        echo "  STRIPE_PUBLIC_KEY=$STRIPE_PUBLIC_KEY"
        echo "  STRIPE_SECRET_KEY=$STRIPE_SECRET_KEY"
        echo "  STRIPE_WEBHOOK_SECRET=$STRIPE_WEBHOOK_SECRET"
        echo "  JWT_SECRET (generate: openssl rand -base64 32)"
        echo "  GOOGLE_CLIENT_ID (from Google Console)"
        echo "  GOOGLE_CLIENT_SECRET (from Google Console)"
        echo ""
        echo "After deployment:"
        echo "  1. Update Stripe webhook endpoint:"
        echo "     https://<your-railway-url>/api/billing/stripe/webhook"
        echo ""
        ;;
    2)
        echo "🚀 Render Deployment"
        echo "===================="
        echo ""
        echo "1. Go to: https://render.com"
        echo "2. Sign up with GitHub"
        echo "3. Create new Web Service"
        echo "4. Connect GitHub repository"
        echo "5. Set runtime: Node 18+"
        echo ""
        echo "Build command: cd backend && npm install && npm run build"
        echo "Start command: npm start"
        echo ""
        echo "Add environment variables in Render dashboard"
        echo ""
        ;;
    3)
        echo "🚀 Heroku Deployment"
        echo "===================="
        echo ""
        echo "1. Install Heroku CLI: https://devcenter.heroku.com/articles/heroku-cli"
        echo "2. heroku login"
        echo "3. heroku create codecouncil-ai"
        echo "4. git push heroku main"
        echo ""
        ;;
    4)
        echo "🚀 AWS Elastic Beanstalk"
        echo "======================="
        echo ""
        echo "See PRODUCTION.md for detailed AWS setup"
        echo ""
        ;;
    5)
        echo "🚀 Local Docker Development"
        echo "=========================="
        echo ""
        echo "Starting Docker stack..."
        echo ""
        docker-compose up
        ;;
esac

echo ""
echo "✅ Pre-launch configuration complete!"
echo ""
echo "🎯 Next Steps:"
echo "  1. Complete deployment on your chosen platform"
echo "  2. Create admin user in database"
echo "  3. Test subscription flow"
echo "  4. Configure Slack webhooks (optional)"
echo "  5. Launch to users!"
echo ""
echo "📚 Documentation:"
echo "  - QUICKSTART.md      - Quick reference"
echo "  - ENTERPRISE.md      - Complete feature guide"
echo "  - PRODUCTION.md      - Deployment guide"
echo ""
