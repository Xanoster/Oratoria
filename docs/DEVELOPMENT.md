# Oratoria Development Guide

This guide covers setting up and developing the Oratoria application.

## Prerequisites

- **Node.js**: ≥ 20.0.0
- **pnpm**: ≥ 8.0.0
- **Docker**: For local PostgreSQL and Redis
- **Git**: Version control

## Initial Setup

### 1. Clone and Install

```bash
git clone https://github.com/yourusername/Oratoria.git
cd Oratoria
pnpm install
```

### 2. Environment Configuration

Copy the example environment file:

```bash
cp .env.example .env
```

Configure the following variables:

```env
# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Database (for backend)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/oratoria

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# AI (Optional)
GEMINI_API_KEY=your-gemini-key
```

### 3. Start Infrastructure

```bash
docker compose up -d
```

This starts:
- PostgreSQL on port 5432
- Redis on port 6379

### 4. Run Database Migrations

```bash
pnpm db:migrate
```

### 5. Start Development Servers

```bash
# Start all services
pnpm dev

# Or start individually
pnpm --filter @oratoria/web dev    # Frontend on :3000
pnpm --filter @oratoria/api dev    # Backend on :3001
```

---

## Project Scripts

| Script | Description |
|--------|-------------|
| `pnpm dev` | Start all services in parallel |
| `pnpm build` | Build all packages |
| `pnpm test` | Run all tests |
| `pnpm lint` | Lint all packages |
| `pnpm db:migrate` | Run Prisma migrations |
| `pnpm db:generate` | Generate Prisma client |
| `pnpm db:studio` | Open Prisma Studio |
| `pnpm clean` | Clean all node_modules |

---

## Frontend Development

### Directory Structure

```
apps/web/src/
├── app/              # Next.js App Router
│   ├── (auth)/       # Auth-related routes
│   ├── learn/        # Learning dashboard
│   ├── lesson/[id]/  # Dynamic lesson pages
│   └── layout.tsx    # Root layout
├── components/       # React components
├── lib/              # Utilities and hooks
└── styles/           # Global styles
```

### Adding a New Page

1. Create folder in `src/app/[route-name]/`
2. Add `page.tsx` with the page component
3. For authenticated pages, wrap with `AppLayout`

```tsx
// src/app/my-page/page.tsx
import { AppLayout } from '@/components/AppLayout';

export default function MyPage() {
  return (
    <AppLayout>
      <div className="p-8">
        <h1>My Page</h1>
      </div>
    </AppLayout>
  );
}
```

### Styling Guidelines

- Use Tailwind CSS utility classes
- Dark theme colors: `bg-[#0A0E1A]`, `text-white`
- Blue accent: `bg-blue-600`, `text-blue-400`
- Border color: `border-[#1E293B]`

---

## Backend Development

### Directory Structure

```
apps/api/src/
├── [module]/
│   ├── module.ts          # Module definition
│   ├── controller.ts      # HTTP endpoints
│   ├── service.ts         # Business logic
│   └── dto/               # Data transfer objects
├── prisma/                # Database client
└── main.ts                # Application entry
```

### Creating a New Module

```bash
cd apps/api
nest g module my-feature
nest g controller my-feature
nest g service my-feature
```

### API Endpoint Pattern

```typescript
// my-feature.controller.ts
@Controller('my-feature')
@UseGuards(JwtAuthGuard)
export class MyFeatureController {
  constructor(private readonly service: MyFeatureService) {}

  @Get()
  findAll(@Req() req: Request) {
    return this.service.findAll(req.user.id);
  }

  @Post()
  create(@Body() dto: CreateDto, @Req() req: Request) {
    return this.service.create(dto, req.user.id);
  }
}
```

---

## Database

### Schema Changes

1. Edit `packages/migrations/prisma/schema.prisma`
2. Generate migration:
   ```bash
   pnpm db:migrate -- --name my_change
   ```
3. Generate client:
   ```bash
   pnpm db:generate
   ```

### Prisma Studio

Browse data visually:

```bash
pnpm db:studio
```

---

## Testing

### Running Tests

```bash
# All tests
pnpm test

# Frontend only
pnpm --filter @oratoria/web test

# Backend only
pnpm --filter @oratoria/api test
```

### Test Structure

```
__tests__/
├── unit/         # Unit tests
├── integration/  # API integration tests
└── e2e/          # End-to-end tests
```

---

## Debugging

### Frontend

Use React DevTools and browser console. Add `debugger` statements or use VS Code's debugger.

### Backend

```bash
# Start with debug mode
pnpm --filter @oratoria/api start:debug
```

Attach VS Code debugger to port 9229.

---

## Common Issues

### Port Already in Use

```bash
# Find process
lsof -i :3000
# Kill it
kill -9 <PID>
```

### Database Connection Failed

1. Check Docker is running: `docker ps`
2. Verify DATABASE_URL in `.env`
3. Restart containers: `docker compose restart`

### Prisma Client Out of Sync

```bash
pnpm db:generate
```

---

## Code Quality

### Before Committing

```bash
pnpm lint
pnpm type-check
```

### Recommended VS Code Extensions

- ESLint
- Prettier
- Tailwind CSS IntelliSense
- Prisma
