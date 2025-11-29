# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` - Start development server (http://localhost:3000)
- `npm run build` - Production build
- `npm run lint` - Run ESLint
- `npx tsx scripts/run-migration.ts` - Run database migrations

## Architecture

This is a Next.js 16 application using the App Router with Supabase as the backend.

### Tech Stack
- **Framework**: Next.js 16 with App Router
- **Database**: PostgreSQL via Supabase
- **Auth**: Supabase Auth
- **Styling**: Tailwind CSS v4
- **Language**: TypeScript

### Key Directories
- `app/` - Next.js App Router pages and API routes
- `lib/` - Shared utilities and database clients
- `lib/migrations/` - SQL migration files
- `scripts/` - Database and utility scripts (run with `npx tsx`)

### Database
- Supabase client initialized in `lib/supabase.ts`
- Session helper in `lib/getSession.ts`
- Migrations use direct PostgreSQL connection via `pg` client

### Environment Variables
Required in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `POSTGRES_URL` (for migrations)
