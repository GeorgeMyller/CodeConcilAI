# CodeCouncil AI Backend API Service

Simple, production-ready backend service for the CodeCouncil AI SaaS platform.

## Features

- ✅ OAuth 2.0 Google authentication with JWT
- ✅ Mock billing system (upgrade to Stripe for production)
- ✅ Gemini API proxy with authentication
- ✅ Rate limiting & CORS protection
- ✅ TypeScript with strict type checking
- ✅ Docker-ready
- ✅ Health checks & error handling

## Quick Start

```bash
# Install
npm install

# Dev (with hot reload)
npm run dev

# Build
npm run build

# Production
NODE_ENV=production npm start

# Type check
npm run typecheck
```

## Environment Setup

Copy `.env.example` to `.env.local` and fill in:

```bash
cp .env.example .env.local
```

Required credentials:
- **Google OAuth:** Client ID + Secret from [Google Cloud Console](https://console.cloud.google.com/)
- **Gemini API Key:** From [Google AI Studio](https://aistudio.google.com/)
- **JWT Secret:** Generate with: `openssl rand -base64 32`

## API Routes

### `/api/auth`
- `POST /google` – Exchange Google ID token for JWT
- `POST /refresh` – Refresh expired JWT
- `GET /me` – Get current user profile

### `/api/billing`
- `GET /plans` – List pricing plans
- `GET /usage` – Get user's credit balance
- `POST /process-transaction` – Deduct credits for analysis
- `POST /upgrade-to-unlimited` – Enable BYOK (Bring Your Own Key) mode

### `/api/gemini`
- `POST /analyze` – Proxy Gemini API with auth
- `GET /models` – List available models

## Docker

```bash
# Build
docker build -t codecouncil-backend .

# Run
docker run -p 5000:5000 \
  -e GOOGLE_CLIENT_ID=xxx \
  -e GOOGLE_CLIENT_SECRET=xxx \
  -e GEMINI_API_KEY=xxx \
  codecouncil-backend
```

Or with Docker Compose (includes frontend):

```bash
docker-compose up
```

## Deployment

See [../DEPLOY.md](../DEPLOY.md) for complete deployment guides:
- Railway, Render, Vercel
- AWS, DigitalOcean
- Production checklist

## Next Steps for Production

1. Replace mock billing with real Stripe integration + database webhooks
2. Add PostgreSQL for user/transaction persistence
3. Implement rate limiting per user
4. Add email notifications (SendGrid)
5. Enable two-factor authentication
6. Set up monitoring (Sentry, DataDog)

## License

MIT
