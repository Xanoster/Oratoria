# Oratoria 🎭

A German language learning app focused on speaking practice through immersive roleplay scenarios. Master German one scenario at a time with spaced repetition and AI-powered conversations.

## Features

- 🔐 **Authentication**: Email/password signup and login with NextAuth.js
- ☁️ **Cloud Database**: Supabase PostgreSQL for persistent user data
- 🗺️ **Learning Roadmap**: Progress through scenarios with real-time tracking
- 🎯 **Spaced Repetition (SRS)**: Optimized learning based on proven memory science
- 🎭 **Roleplay Practice**: Contextual German conversations with AI
- 📊 **Progress Tracking**: Track your learning journey with real statistics

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: Supabase PostgreSQL + Prisma ORM
- **Authentication**: NextAuth.js v5 (Auth.js)
- **Styling**: CSS with custom design system
- **Language**: TypeScript

## Getting Started

### Prerequisites

- Node.js 18+
- Supabase account (free tier works)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Xanoster/Oratoria.git
   cd Oratoria
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   # Database (Supabase PostgreSQL)
   DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres"

   # NextAuth
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-super-secret-key-min-32-chars"
   ```

4. **Set up the database**
   ```bash
   npx prisma migrate dev
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Authentication pages (login, signup)
│   ├── api/               # API routes
│   ├── dashboard/         # User dashboard
│   ├── roadmap/           # Learning journey roadmap
│   └── roleplay/          # Roleplay practice
├── components/            # React components
├── lib/                   # Utilities and configurations
│   ├── auth.config.ts     # NextAuth configuration
│   └── db.ts              # Prisma client
└── types/                 # TypeScript type definitions

prisma/
├── schema.prisma          # Database schema
└── migrations/            # Database migrations
```

## Database Schema

Key models:
- **User**: Authentication and profile data
- **RoleplayScenario**: Learning scenarios with progress tracking
- **Sentence**: German sentences for practice
- **SRSState**: Spaced repetition data per user/sentence
- **SpeakingAttempt**: Records of practice attempts

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy!

### Environment Variables for Production

```env
DATABASE_URL="your-supabase-connection-string"
NEXTAUTH_URL="https://yourdomain.com"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see LICENSE for details.
