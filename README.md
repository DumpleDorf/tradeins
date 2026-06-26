# Tesla Certified Trade-In Wholesale Portal

Full-stack B2B portal for Tesla's internal trade-in wholesale program.

**Production domain:** [https://teslatradeins.com.au](https://teslatradeins.com.au)

## Features

- **Three user roles:** Super Admin, Tesla Employee (lister/admin), Wholesale Partner
- **Separate login flows** for Tesla employees and partners
- **Vehicle listings** with multi-photo upload, status workflow, and disclaimers
- **Partner inventory** with filters, sorting, pagination, and photo gallery with zoom
- **Reservation workflow** — no payments; email notifications to Tesla on reserve
- **Approval workflow** — Tesla approves/rejects; partners notified by email
- **Partner management** — invite-only, no self-registration
- **Audit logging** for all status changes
- **Password reset** via email

## Tech Stack

- **Next.js 15** (App Router) + TypeScript
- **Tailwind CSS** — Tesla brand aesthetic (dark theme, `#E31937` accent)
- **PostgreSQL** via Prisma ORM
- **Auth.js (NextAuth v5)** — email/password, JWT sessions, RBAC
- **Resend** — transactional email
- **Supabase Storage** — vehicle photo uploads (optional; falls back to base64 in dev)
- **Vercel** — deployment

## Prerequisites

- Node.js 20+
- PostgreSQL database ([Supabase](https://supabase.com) or [Neon](https://neon.tech))
- [Resend](https://resend.com) account with `teslatradeins.com.au` domain verified
- [Vercel](https://vercel.com) account (domain already connected)

## Local Setup

### 1. Clone and install

```bash
cd Projects/tesla-wholesale-portal
npm install
```

### 2. Environment variables

Copy `.env.example` to `.env.local` and fill in values:

```bash
cp .env.example .env.local
```

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `AUTH_SECRET` | Random secret (`openssl rand -base64 32`) |
| `NEXT_PUBLIC_APP_URL` | `https://teslatradeins.com.au` |
| `RESEND_API_KEY` | From Resend dashboard |
| `EMAIL_FROM` | `Tesla Trade-Ins <noreply@teslatradeins.com.au>` |
| `TESLA_TEAM_EMAIL` | Inbox for reservation alerts |
| `SUPABASE_URL` | Supabase project URL (for image storage) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |
| `SUPABASE_STORAGE_BUCKET` | `vehicle-photos` |

### 3. Database setup

```bash
npm run db:push
npm run db:seed
```

### 4. Create Supabase storage bucket

In Supabase → Storage → New bucket:

- Name: `vehicle-photos`
- Public: **Yes**

### 5. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Seed accounts

| Role | Email | Password |
|------|-------|----------|
| Super Admin | `superadmin@tesla.com` | `SuperAdmin123!` |
| Tesla Employee | `lister@tesla.com` | `TeslaEmployee123!` |
| Partner | `partner@wholesale.com` | `Partner123!` |

**Change these passwords immediately in production.**

## Deploy to Vercel

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial Tesla wholesale portal"
git remote add origin <your-repo-url>
git push -u origin main
```

### 2. Import in Vercel

1. Vercel Dashboard → **Add New Project** → import your repo
2. Add all environment variables from `.env.example`
3. Deploy

Domain `teslatradeins.com.au` is already configured in Vercel.

### 3. Run database migration on production

Use your database provider's SQL console or run locally against production `DATABASE_URL`:

```bash
npm run db:push
npm run db:seed
```

## Resend + GoDaddy DNS

1. Resend → **Domains** → Add `teslatradeins.com.au`
2. Copy SPF/DKIM records into GoDaddy DNS (same panel as Vercel records)
3. Wait for verification
4. Set `EMAIL_FROM` to `noreply@teslatradeins.com.au`

## Vehicle Status Flow

```
Available → Reserved → Pending Tesla Approval → Sold
                                              ↘ Rejected → Available
```

## Project Structure

```
src/
├── app/
│   ├── api/           # REST API routes
│   ├── admin/         # Super Admin pages
│   ├── inventory/     # Partner inventory browse
│   ├── login/         # Tesla + Partner login
│   ├── reservations/  # Partner reservations dashboard
│   ├── tesla/         # Tesla employee dashboard
│   └── vehicles/      # Vehicle detail + reserve
├── components/        # UI components
├── emails/            # Email HTML templates
└── lib/               # Auth, DB, email, RBAC, audit
prisma/
├── schema.prisma      # Database schema
└── seed.ts            # Demo data
```

## Business Rules (enforced in code)

- Reserved vehicles are hidden from all other partners immediately
- One reservation per vehicle at a time
- No sale is final without explicit Tesla approval
- Partners cannot see other partners' reservations
- Tesla employees cannot reserve vehicles
- All status changes are audit-logged with user ID and timestamp

## License

Internal use — Tesla Certified Trade-In Wholesale Program.
