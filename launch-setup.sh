#!/bin/bash

# CodeCouncil AI - Production Setup Guide
# This script guides you through the 5 critical steps before launch

set -e

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║  CodeCouncil AI - Production Setup & Deployment Guide      ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Step 1: Stripe Products & Price IDs
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}STEP 1: Create Stripe Products & Price IDs${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo ""

cat << 'STRIPE_GUIDE'
You need to create 4 Stripe products in your Stripe Dashboard.

🔗 Go to: https://dashboard.stripe.com/products

CREATE THESE 4 PRODUCTS:

┌─────────────────────────────────────────────────────────┐
│ 1. STARTUP MONTHLY                                      │
├─────────────────────────────────────────────────────────┤
│ Name: Startup Audit - Monthly                           │
│ Price: $49.00 USD / month (recurring)                   │
│ Billing Period: Monthly                                 │
│ Copy the Price ID: price_xxxxxxxxxxxxx                  │
│ Set as: STRIPE_PRICE_STARTUP_MONTHLY                    │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ 2. STARTUP ANNUAL                                       │
├─────────────────────────────────────────────────────────┤
│ Name: Startup Audit - Annual                            │
│ Price: $499.00 USD / year (recurring)                   │
│ Billing Period: Yearly                                  │
│ Copy the Price ID: price_xxxxxxxxxxxxx                  │
│ Set as: STRIPE_PRICE_STARTUP_ANNUAL                     │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ 3. ENTERPRISE MONTHLY                                   │
├─────────────────────────────────────────────────────────┤
│ Name: Enterprise Deep Dive - Monthly                    │
│ Price: $149.00 USD / month (recurring)                  │
│ Billing Period: Monthly                                 │
│ Copy the Price ID: price_xxxxxxxxxxxxx                  │
│ Set as: STRIPE_PRICE_ENTERPRISE_MONTHLY                 │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ 4. ENTERPRISE ANNUAL                                    │
├─────────────────────────────────────────────────────────┤
│ Name: Enterprise Deep Dive - Annual                     │
│ Price: $1,499.00 USD / year (recurring)                 │
│ Billing Period: Yearly                                  │
│ Copy the Price ID: price_xxxxxxxxxxxxx                  │
│ Set as: STRIPE_PRICE_ENTERPRISE_ANNUAL                  │
└─────────────────────────────────────────────────────────┘

ALSO GET YOUR API KEYS:
1. Go to https://dashboard.stripe.com/apikeys
2. Copy your:
   - Publishable Key: pk_live_xxxxx (or pk_test_xxxxx for testing)
   - Secret Key: sk_live_xxxxx (or sk_test_xxxxx for testing)

3. Get Webhook Signing Secret:
   - Go to https://dashboard.stripe.com/webhooks
   - Create endpoint: POST https://yourdomain.com/api/billing/stripe/webhook
   - Select events: charge.succeeded, charge.failed, customer.subscription.updated
   - Copy Signing Secret: whsec_xxxxx

STRIPE_GUIDE

read -p "✓ Have you created all 4 Stripe products? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}Please create the Stripe products first.${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✓ Step 1 complete!${NC}"
echo ""

# Step 2: Update .env files
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}STEP 2: Update .env Files with Stripe Credentials${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo ""

# Check if .env files exist
if [ ! -f "backend/.env" ]; then
    echo -e "${YELLOW}Creating backend/.env from example...${NC}"
    cp backend/.env.example backend/.env
fi

echo "Please update backend/.env with your Stripe credentials:"
echo ""
echo "  STRIPE_SECRET_KEY=sk_live_xxxxx (or sk_test_xxxxx)"
echo "  STRIPE_PRICE_STARTUP_MONTHLY=price_xxxxx"
echo "  STRIPE_PRICE_STARTUP_ANNUAL=price_xxxxx"
echo "  STRIPE_PRICE_ENTERPRISE_MONTHLY=price_xxxxx"
echo "  STRIPE_PRICE_ENTERPRISE_ANNUAL=price_xxxxx"
echo "  STRIPE_WEBHOOK_SECRET=whsec_xxxxx"
echo ""

read -p "✓ Have you updated backend/.env with all Stripe credentials? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}Please update backend/.env first.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Step 2 complete!${NC}"
echo ""

# Step 3: Promote admin user
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}STEP 3: Promote Admin User${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo ""

echo "You need to promote your user to admin. Choose one:"
echo ""
echo "  A) Using the database directly (if you have psql)"
echo "  B) Using the API endpoint"
echo ""

read -p "Which method? (A/B): " -n 1 -r
echo
if [[ $REPLY =~ ^[Aa]$ ]]; then
    read -p "Enter your email address: " user_email
    echo ""
    echo "Run this SQL command in your database:"
    echo ""
    echo -e "${YELLOW}UPDATE \"User\" SET \"isAdmin\" = true WHERE email = '$user_email';${NC}"
    echo ""
elif [[ $REPLY =~ ^[Bb]$ ]]; then
    echo "You can promote admin via API after deployment."
    echo "See PRODUCTION.md for instructions."
fi

echo -e "${GREEN}✓ Step 3 complete!${NC}"
echo ""

# Step 4: Deployment platform selection
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}STEP 4: Choose Deployment Platform${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo ""

echo "Choose your deployment platform:"
echo ""
echo "  1) Railway (recommended - easiest)"
echo "  2) Render"
echo "  3) AWS (Elastic Beanstalk or Lambda)"
echo "  4) DigitalOcean"
echo "  5) Heroku"
echo "  6) Manual (Docker on your own server)"
echo ""

read -p "Enter choice (1-6): " platform_choice
echo ""

case $platform_choice in
    1)
        cat << 'RAILWAY'
╔─ RAILWAY DEPLOYMENT ──────────────────────────────────────╗
│                                                             │
│ Railway is the easiest option. Follow these steps:        │
│                                                             │
│ 1. Go to https://railway.app                              │
│ 2. Sign in with GitHub                                    │
│ 3. Click "New Project" → "Deploy from GitHub"             │
│ 4. Select your CodeConcilAI repository                    │
│ 5. Railway auto-detects Node.js + PostgreSQL              │
│                                                             │
│ 6. Add environment variables:                              │
│    STRIPE_SECRET_KEY=sk_live_xxxxx                        │
│    STRIPE_PRICE_STARTUP_MONTHLY=price_xxxxx               │
│    ... (add all Stripe vars)                              │
│    GOOGLE_CLIENT_ID=xxx                                   │
│    GOOGLE_CLIENT_SECRET=xxx                               │
│    JWT_SECRET=$(openssl rand -base64 32)                  │
│    DATABASE_URL=postgresql://...                          │
│    GEMINI_API_KEY=xxx                                     │
│    SENTRY_DSN=xxx                                         │
│    SENDGRID_API_KEY=xxx                                   │
│    FRONTEND_URL=https://yourdomain.com                    │
│                                                             │
│ 7. Click "Deploy"                                         │
│ 8. Wait for deployment to complete                        │
│ 9. Update DNS to point to Railway domain                  │
│                                                             │
│ ✓ Done! Your app is live on Railway                      │
│                                                             │
╚────────────────────────────────────────────────────────────╝
RAILWAY
        ;;
    2)
        cat << 'RENDER'
╔─ RENDER DEPLOYMENT ───────────────────────────────────────╗
│                                                             │
│ Render is similar to Railway. Steps:                      │
│                                                             │
│ 1. Go to https://render.com                               │
│ 2. Click "New +" → "Web Service"                          │
│ 3. Connect your GitHub repository                         │
│ 4. Set build command: npm install                         │
│ 5. Set start command: npm run start                       │
│ 6. Add all environment variables                          │
│ 7. Create PostgreSQL database                             │
│ 8. Deploy                                                  │
│                                                             │
╚────────────────────────────────────────────────────────────╝
RENDER
        ;;
    3)
        cat << 'AWS'
╔─ AWS DEPLOYMENT ──────────────────────────────────────────╗
│                                                             │
│ Option 1: AWS Elastic Beanstalk (easiest for AWS)         │
│                                                             │
│ 1. Install AWS CLI: aws configure                         │
│ 2. Create RDS PostgreSQL database                         │
│ 3. Create Elastic Beanstalk environment                   │
│ 4. Deploy: eb deploy                                      │
│                                                             │
│ Option 2: AWS Lambda + API Gateway (serverless)           │
│                                                             │
│ 1. Use AWS Serverless Application Model (SAM)             │
│ 2. Deploy with: sam deploy                                │
│                                                             │
╚────────────────────────────────────────────────────────────╝
AWS
        ;;
    4)
        cat << 'DIGITALOCEAN'
╔─ DIGITALOCEAN DEPLOYMENT ─────────────────────────────────╗
│                                                             │
│ DigitalOcean App Platform (easiest)                       │
│                                                             │
│ 1. Go to https://cloud.digitalocean.com                   │
│ 2. Click "Apps" → "Create App"                            │
│ 3. Connect GitHub repository                              │
│ 4. DigitalOcean auto-detects Node.js                      │
│ 5. Add PostgreSQL database                                │
│ 6. Set environment variables                              │
│ 7. Deploy                                                  │
│                                                             │
│ Or use Droplet + Docker:                                  │
│ 1. Create Droplet (Ubuntu 22.04)                          │
│ 2. SSH into Droplet                                       │
│ 3. Install Docker & Docker Compose                        │
│ 4. Clone repo & run docker-compose up -d                  │
│                                                             │
╚────────────────────────────────────────────────────────────╝
DIGITALOCEAN
        ;;
    5)
        cat << 'HEROKU'
╔─ HEROKU DEPLOYMENT ───────────────────────────────────────╗
│                                                             │
│ 1. Install Heroku CLI: brew install heroku                │
│ 2. Login: heroku login                                    │
│ 3. Create app: heroku create codecouncil-ai               │
│ 4. Add PostgreSQL: heroku addons:create heroku-postgresql │
│ 5. Set env vars: heroku config:set KEY=value             │
│ 6. Deploy: git push heroku main                           │
│                                                             │
╚────────────────────────────────────────────────────────────╝
HEROKU
        ;;
    6)
        cat << 'MANUAL'
╔─ MANUAL DOCKER DEPLOYMENT ───────────────────────────────╗
│                                                             │
│ On your own server (VPS/Dedicated):                       │
│                                                             │
│ 1. SSH into server: ssh user@your-server.com              │
│ 2. Install Docker & Docker Compose                        │
│ 3. Clone repository                                       │
│ 4. Create .env file with credentials                      │
│ 5. Run: docker-compose -f docker-compose.yml \            │
│           -f docker-compose.monitoring.yml up -d          │
│ 6. Setup Nginx reverse proxy                              │
│ 7. Enable SSL with Let's Encrypt                          │
│                                                             │
╚────────────────────────────────────────────────────────────╝
MANUAL
        ;;
    *)
        echo -e "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}✓ Step 4 complete! Choose and follow platform guide.${NC}"
echo ""

# Step 5: Webhooks configuration
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}STEP 5: Configure Webhooks (Slack/PagerDuty)${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo ""

cat << 'WEBHOOKS'
Configure monitoring alerts to receive notifications.

┌─── SLACK INTEGRATION ─────────────────────────────────────┐
│                                                             │
│ 1. Create Slack workspace: https://slack.com/get-started   │
│ 2. Create webhook:                                        │
│    a) Go to https://api.slack.com/apps                    │
│    b) Create New App                                      │
│    c) Enable Incoming Webhooks                            │
│    d) Copy Webhook URL: https://hooks.slack.com/...       │
│                                                             │
│ 3. Create channels:                                       │
│    #alerts           (all alerts)                         │
│    #critical-alerts  (only critical)                      │
│    #warnings         (warnings)                           │
│                                                             │
│ 4. Add to backend/.env:                                   │
│    SLACK_WEBHOOK_URL=https://hooks.slack.com/services/... │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─── PAGERDUTY INTEGRATION ─────────────────────────────────┐
│                                                             │
│ 1. Create PagerDuty account: https://www.pagerduty.com     │
│ 2. Create service & escalation policy                     │
│ 3. Get Integration Key                                    │
│ 4. Add to backend/.env:                                   │
│    PAGERDUTY_SERVICE_KEY=xxxxx                            │
│                                                             │
│ PagerDuty alerts on-call engineer for critical issues     │
│                                                             │
└─────────────────────────────────────────────────────────────┘

WEBHOOKS

read -p "✓ Have you configured Slack/PagerDuty webhooks? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}You can configure webhooks later. Proceeding...${NC}"
fi

echo ""
echo -e "${GREEN}✓ Step 5 complete!${NC}"
echo ""

# Final summary
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ ALL 5 STEPS COMPLETE!${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo ""

echo "Your CodeCouncil AI is ready for production deployment!"
echo ""
echo "Next actions:"
echo "  1. Follow your chosen platform's deployment guide"
echo "  2. Monitor deployment logs"
echo "  3. Test subscription flow after deployment"
echo "  4. Configure SSL/TLS certificate"
echo "  5. Launch to users!"
echo ""
echo "For detailed instructions, see:"
echo "  - PRODUCTION.md      (deployment details)"
echo "  - ENTERPRISE.md      (feature configuration)"
echo "  - README.md          (project overview)"
echo ""
