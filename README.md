# Oratoria - German Learning App

<p align="center">
  <strong>Voice-first German learning platform with AI-powered feedback</strong>
</p>

<p align="center">
  Built with Next.js • NestJS • Supabase • Google Gemini
</p>

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [Architecture](./docs/ARCHITECTURE.md) | System design, modules, and data flow |
| [Development](./docs/DEVELOPMENT.md) | Setup guide and coding patterns |
| [API Reference](./docs/API.md) | REST API endpoints |

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14 (App Router) + TypeScript |
| Backend | NestJS + Prisma |
| Database | PostgreSQL + pgvector (via Supabase) |
| Auth | Supabase Auth |
| AI | Google Gemini |
| Monorepo | pnpm workspaces |

## 🚀 Quick Start

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Set Up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Get your API credentials from Settings → API
3. Copy `.env.example` to `apps/web/.env.local`
4. Add your Supabase URL and anon key

```env
NEXT_PUBLIC_SUPABASE_URL=your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Configure Supabase Dashboard

**Authentication → URL Configuration**:
- Add redirect URL: `http://localhost:3000/auth/callback`

**Authentication → Email Auth** (optional, for faster testing):
- Disable "Enable email confirmations"

### 4. Run Development Server

```bash
pnpm dev
# or
pnpm --filter @oratoria/web dev
```

Visit **http://localhost:3000**

## Project Structure

```
/Oratoria
  /apps
    /web              # Next.js frontend
    /api              # NestJS backend (future)
  /packages
    /ui               # Shared React components
    /lib              # Shared TypeScript types
    /migrations       # Database migrations (Prisma)
```

## ✨ Features

### Implemented
- 🔐 **Authentication** - Signup, login, magic link via Supabase
- 🎯 **Onboarding** - Multi-step flow with placement test
- 📚 **Learning Dashboard** - Personalized lesson recommendations
- 🗣️ **Speaking Practice** - Voice recording with Web Speech API
- 🎭 **Roleplay** - Scenario-based conversation practice
- 📊 **Progress Tracking** - Statistics and achievements
- 🔄 **SRS Review** - Spaced repetition system (UI)
- ⚙️ **Settings** - GDPR-compliant data management

### Coming Soon
- 🤖 AI-powered pronunciation analysis
- 📱 Mobile responsive design
- 🌐 Offline mode

## Development

**Frontend only** (current setup):
```bash
pnpm --filter @oratoria/web dev
```

**Run linter**:
```bash
pnpm lint
```

**Type check**:
```bash
pnpm type-check
```

## Supabase Schema

The app uses Supabase's built-in auth. For custom tables (lessons, recordings, etc.), run migrations from `packages/migrations` when needed.

## Environment Variables

See `.env.example` for all required variables.

**Required for frontend**:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**Optional**:
- `GEMINI_API_KEY` (for AI features)
- SMTP settings (for magic link emails)

## Contributing

This is a personal project. Feel free to fork and adapt for your own use.

## License

MIT
