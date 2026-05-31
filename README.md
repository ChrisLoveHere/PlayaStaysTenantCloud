# Landlord Hub

Unified property management for landlords, leasing agents, and tenants — built for Mexico (MXN, flexible addresses, SPEI-friendly rent tracking).

## Tech stack

- **Next.js 16** (App Router) + React + TypeScript
- **Tailwind CSS** + **shadcn/ui**
- **SQLite** + **Drizzle ORM** (easy local start; Postgres-ready path documented)
- **Auth.js** (NextAuth v5) with role-based access
- **FullCalendar** (showings + agent availability)
- Local file uploads (upgradeable to S3/Vercel Blob)

## Quick start

```bash
# 1. Install dependencies
npm install

# 2. Copy environment file
cp .env.example .env.local

# 3. Generate AUTH_SECRET and add to .env.local
openssl rand -base64 32

# 4. Push database schema
npm run db:push

# 5. Seed demo data
npm run db:seed

# 6. Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Demo accounts (after seed)

| Role     | Email                 | Password     |
|----------|-----------------------|--------------|
| Landlord | landlord@example.com  | password123  |
| Agent    | agent@example.com     | password123  |
| Prospect | prospect@example.com  | password123  |

## User roles

| Role     | Dashboard   | Access |
|----------|-------------|--------|
| Landlord | `/landlord` | Full portfolio management |
| Agent    | `/agent`    | Assigned prospects, showings, availability, commissions |
| Prospect | `/portal`   | Application, property search |
| Tenant   | `/portal`   | Lease, payments, maintenance |

## Project structure

```
src/
├── app/
│   ├── api/auth/          # Auth.js handlers
│   ├── landlord/          # Landlord dashboard & modules
│   ├── agent/             # Agent dashboard & modules
│   ├── portal/            # Tenant / prospect portal
│   ├── login/ register/   # Auth pages
│   └── page.tsx           # Marketing landing
├── components/
│   ├── auth/              # Login, register forms
│   ├── layout/            # Dashboard shell, nav
│   └── ui/                # shadcn components
├── lib/
│   ├── actions/           # Server actions
│   ├── auth/              # Session helpers
│   ├── db/
│   │   └── schema/        # Drizzle tables, relations, enums
│   └── utils/             # MXN formatting, labels
├── auth.ts                # Auth.js config
└── middleware.ts          # Route protection by role
```

## Database schema

See [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) for full ERD, relationships, and workflow details.

### Core tables

- **users** — auth + role (`landlord` | `agent` | `tenant` | `prospect`)
- **agent_profiles** — commission settings per agent
- **properties** — Mexico address fields, rent/deposit in MXN cents
- **prospects** — screening data linked to user account
- **applications** — prospect ↔ property ↔ agent with pipeline stage
- **showings** — scheduled viewings
- **agent_availability_blocks** — agent calendar blocks
- **tenants** — active/past tenants with history link to prospect
- **leases** — dates, document URL, renewal tracking
- **commissions** — recorded when lease signed
- **maintenance_requests** — tenant-submitted tickets
- **rent_payments** — manual SPEI-friendly tracking
- **documents** — polymorphic file attachments

## Scripts

| Command        | Description              |
|----------------|--------------------------|
| `npm run dev`  | Start development server |
| `npm run db:push` | Push schema to SQLite |
| `npm run db:seed` | Seed demo accounts    |
| `npm run db:studio` | Drizzle Studio GUI  |

## Deployment (Vercel)

1. Set `AUTH_SECRET` and `AUTH_URL` in Vercel env vars
2. For production DB, use Vercel Postgres or Neon and update `DATABASE_URL`
3. Note: current schema uses SQLite — migrate to `pgTable` definitions before production Postgres deploy

## License

Private — all rights reserved.
