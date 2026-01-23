# Oratoria - Copilot Handoff Instructions

This document provides instructions for AI code assistants to generate code for this project.

## Repository Layout

```
/Oratoria
  /apps
    /web        -> Next.js App Router (TypeScript)
    /api        -> NestJS backend (TypeScript)
  /packages
    /ui         -> React component library
    /lib        -> Shared TypeScript types
    /migrations -> Database migrations (Prisma)
  docker-compose.yml
  pnpm-workspace.yaml
```

## Quick Start Sequence

```bash
# Install dependencies
pnpm install

# Start database
docker-compose up -d postgres redis

# Run migrations
pnpm db:migrate

# Start development servers
pnpm dev
```

## Development Commands

```bash
# Web (Next.js)
cd apps/web && pnpm dev

# API (NestJS)
cd apps/api && pnpm dev

# Both
pnpm dev  # runs both in parallel
```

## Scaffolding Instructions

### Next.js App (apps/web)
- Uses App Router
- TypeScript strict mode
- CSS Modules for styling
- Design tokens in globals.css

### NestJS App (apps/api)
- Modules: Auth, User, Lesson, Placement, Speak, Analysis, SRS, RAG, AI-Adapter, Notifications
- Uses Prisma for ORM
- JWT-based auth with HTTP-only cookies
- BullMQ for background jobs

### Database (Prisma)
Schema location: `/packages/migrations/prisma/schema.prisma`

Key tables:
- users
- sessions
- lessons
- recordings
- analyses
- srs_items
- embeddings
- analytics_events

### AI Adapters
Location: `/apps/api/src/ai-adapter/`

- `llm.service.ts` - Gemini integration
- `asr.service.ts` - Speech-to-text (browser Web Speech API)
- `tts.service.ts` - Text-to-speech stub

## Mock Responses

For development without live AI providers, use stubs in the service files that return sample data.

## Testing

```bash
# API tests
cd apps/api && pnpm test

# Web tests
cd apps/web && pnpm test

# E2E
pnpm test:e2e
```

## Environment Variables

See `.env.example` for required environment variables.

## Design System

Design tokens are defined in `apps/web/src/app/globals.css`:
- color-bg: #F6F7F9
- color-surface: #FFFFFF
- color-text: #0B1220
- color-accent: #0B5FFF

Font: Inter (Google Fonts)
