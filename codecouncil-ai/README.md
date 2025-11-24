<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# CodeCouncil AI – SaaS Readiness

This repo contains a client-side Vite + React app that orchestrates a set of analysis “agents” and calls Google Gemini for output. This document explains how to run locally, configure Bring Your Own Key (BYOK), and deploy safely as a SaaS.

## Quick Start (Local Dev)

- Prerequisites: Node.js 18+
- Install: `npm install`
- Optional dev key: copy `.env.example` to `.env.local` and set `VITE_GEMINI_API_KEY` (dev only; do not ship client keys)
- Run: `npm run dev`

## Production Key Management (BYOK)

This app is client-only. To avoid exposing secrets:
- Use the in-app “Skip trial” or “Switch to Personal Key” flow to paste your Gemini API key locally (stored in browser `localStorage`).
- Alternatively, integrate a backend proxy that injects a short-lived access token for Gemini. Do not bundle a long-lived key.

The app now prefers a runtime key saved in the browser. If none is set, it falls back to `VITE_GEMINI_API_KEY` for local development only.

## Scripts

- `npm run dev` – start Vite dev server
- `npm run build` – produce a production build
- `npm run preview` – preview the built app locally
- `npm run start` – alias for preview on a fixed port
- `npm run typecheck` – TypeScript type checking

## Deployment

This is a static build (Vite). You can deploy dist/ to any static host (Vercel, Netlify, Cloudflare Pages, S3+CloudFront).

Security headers:
- This app includes a CSP meta tag in `index.html` to restrict external origins for scripts, styles, fonts, images, and API calls (`api.github.com`, `generativelanguage.googleapis.com`). Adjust if you add more providers.

Env variables:
- For dev, use `.env.local` with `VITE_*` variables.
- For production, avoid embedding API keys in the client bundle; rely on BYOK or a server-side proxy.

## SaaS Readiness Notes

- Auth: Current login is simulated (LocalStorage). For launch, integrate a real identity provider (Google OAuth / Auth0) and replace the mock `Backend.auth`.
- Billing: Current “credits” are simulated. For launch, integrate Stripe (plans, metering, and webhooks) and enforce limits on the backend.
- Data: This app stores only minimal user data in `localStorage`. Ensure privacy policy and ToS reflect this. If you add a backend, implement proper data retention and DSRs (LGPD/GDPR).
- Quotas: BYOK mode is supported so end users can bring their own Gemini key and bypass platform credits.
- Logging/Telemetry: Add a privacy-respecting error/metrics solution (e.g., Sentry with PII scrubbing, or server-side logs only).

## Known Limitations (MVP)

- No real backend; history and user are stored locally.
- GitHub API is called unauthenticated and rate-limited.
- The Gemini SDK is called directly from the browser; rely on BYOK or a proxy in production.

## Local .env example

See `.env.example` in repo root of this app folder.

