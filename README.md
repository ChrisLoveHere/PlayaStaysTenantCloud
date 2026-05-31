# PlayaStays

Long-term rental management across Quintana Roo — Playa del Carmen, Tulum, Cozumel, and more.

## Tech stack

- **Next.js 16** (App Router) + React + TypeScript
- **Tailwind CSS** + **shadcn/ui**
- **Neon Postgres** + **Drizzle ORM**
- **Auth.js** (NextAuth v5) with role-based access
- **Resend** for transactional email (renewals, overdue rent, showing reminders)
- **FullCalendar** (showings + agent availability)
- **Vercel Blob** for file uploads (local `./public/uploads` in dev)

## Quick start

```bash
# 1. Install dependencies
npm install

# 2. Copy environment file and add your Neon credentials
cp .env.example .env.local

# 3. Generate AUTH_SECRET and add to .env.local
openssl rand -base64 32

# 4. Push database schema to Neon
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
- **rent_payment_claims** — tenant-reported payments pending landlord review
- **prospect_notes** — internal notes on prospects/applications
- **documents** — polymorphic file attachments

## Scripts

| Command        | Description              |
|----------------|--------------------------|
| `npm run dev`  | Start development server |
| `npm run db:push` | Push schema to Neon |
| `npm run db:seed` | Seed demo accounts    |
| `npm run db:studio` | Drizzle Studio GUI  |

## Deployment (Vercel + Neon)

Add these environment variables in [Vercel project settings](https://vercel.com/chris-projects-63dd8012/playa-stays-tenant-cloud/settings/environment-variables):

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | Neon **pooled** connection string |
| `AUTH_SECRET` | `openssl rand -base64 32` |
| `AUTH_URL` | `https://playa-stays-tenant-cloud.vercel.app` |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob token (production uploads) |
| `RESEND_API_KEY` | Optional — email reminders |
| `CRON_SECRET` | Optional — secures `/api/cron/reminders` |

After first deploy, run locally against production Neon:

```bash
npm run db:push   # if schema changed
npm run db:seed   # optional demo data
```

### Agent approval

Agents self-register at `/register/agent` with `isActive: false`. Landlord approves at `/landlord/agents`. Unapproved agents see `/pending-approval` only.

## License

Private — all rights reserved.
