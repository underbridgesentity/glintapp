# Glint

Glint sells time. The clean car is proof it worked.

A mobile-first platform for eco-friendly, water-efficient car cleaning at
South African office parks and residential estates. Customers book, pay, and
verify through the app. Technicians work the queue. Ops sees everything.

## Stack

- Next.js (App Router) + TypeScript, dark mode only
- Tailwind CSS with Glint brand tokens (carbon / white / lemon)
- Vercel Postgres (Neon) + Drizzle ORM, checked-in migrations
- Auth.js (NextAuth v5), server-side RBAC
- PayFast payments behind a `PaymentProvider` interface (ITN webhook)
- Vercel Blob for imagery

## Local setup

1. `npm install`
2. Copy `.env.example` to `.env` and fill in `DATABASE_URL` (Neon),
   `AUTH_SECRET` (`npx auth secret`), and Blob/PayFast values.
3. Run migrations: `npm run db:migrate`
4. Seed demo data: `npm run seed`
5. `npm run dev` and open http://localhost:3000

## Database

- Edit `src/db/schema.ts`, then `npm run db:generate` to create a migration
  under `drizzle/`. Commit the migration. Apply with `npm run db:migrate`.
- Never push schema changes ad-hoc to production.

## Deploy

`main` deploys to production on Vercel; pull requests deploy to previews.
Set the same env vars in the Vercel project settings.

## Build tooling

`CLAUDE.md`, `AGENTS.md`, and `memory/` govern how the agent builds this
repo. None of it ships in the product. No AI features ship in Glint.
