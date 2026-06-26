<div class="cover">

# Tesla Certified Trade-In Wholesale Portal

## Platform Setup & Technical Overview

<p class="subtitle">How <span class="accent">teslatradeins.com.au</span> was built and deployed</p>

<p class="meta">
<strong>Document version:</strong> 1.0<br>
<strong>Domain:</strong> teslatradeins.com.au<br>
<strong>Repository:</strong> github.com/DumpleDorf/tradeins<br>
<strong>Date:</strong> June 2026
</p>

</div>

## 1. Introduction

This document describes how the **Tesla Certified Trade-In Wholesale Portal** was created, configured, and deployed. The platform allows Tesla employees to list certified trade-in vehicles for approved wholesale partners to browse and reserve.

**Key principle:** No payment is processed on the platform. Partners reserve vehicles; Tesla approves or rejects each reservation before any sale is considered final.

### Technology stack

| Component | Service | Purpose |
|-----------|---------|---------|
| Domain | GoDaddy | Domain registration & DNS |
| Hosting | Vercel | Website hosting & deployment |
| Source code | GitHub | Version control & auto-deploy |
| Database | Supabase (PostgreSQL) | User accounts, listings, reservations |
| Image storage | Supabase Storage | Vehicle photo uploads |
| Email (planned) | Resend | Reservation & approval notifications |

### Live URLs

| Purpose | URL |
|---------|-----|
| Public site | https://teslatradeins.com.au |
| Tesla employee login | https://teslatradeins.com.au/login/tesla |
| Partner login | https://teslatradeins.com.au/login/partner |

---

## 2. Domain setup (GoDaddy)

### 2.1 Purchase domain

The domain **teslatradeins.com.au** was registered through **GoDaddy**.

### 2.2 Connect domain to Vercel

1. Log in to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Open the project → **Settings** → **Domains**
3. Add `teslatradeins.com.au`
4. In **GoDaddy** → **My Products** → **DNS Management**, add the DNS records Vercel provides (typically an **A record** for `@` and/or a **CNAME** for `www`)
5. Wait 15–60 minutes for DNS propagation
6. Vercel automatically provisions HTTPS (SSL)

> **Note:** GoDaddy is used for domain registration and DNS only. The website itself is hosted on Vercel, not GoDaddy web hosting.

---

## 3. Source code (GitHub)

### 3.1 Repository

| Item | Detail |
|------|--------|
| Repository | github.com/DumpleDorf/tradeins |
| Branch | main |
| Framework | Next.js 15 (React) |
| Local path | C:\Users\emccarthy\Projects\tesla-wholesale-portal |

### 3.2 How code updates are deployed

1. Make changes to the project locally
2. Commit and push to GitHub:
   ```bash
   git add .
   git commit -m "Description of changes"
   git push origin main
   ```
3. Vercel automatically detects the push and redeploys the site (usually within 2–5 minutes)

---

## 4. Hosting (Vercel)

### 4.1 Project configuration

| Setting | Value |
|---------|--------|
| Project name | project-yjrus |
| Team | tesla-tradeins |
| Framework | Next.js |
| Build command | npm run build |
| Node version | 24.x |

### 4.2 Required environment variables

These are configured in **Vercel → Settings → Environment Variables**:

| Variable | Purpose |
|----------|---------|
| `AUTH_SECRET` | Encrypts login sessions |
| `POSTGRES_PRISMA_URL` | Database connection (auto-set by Supabase) |
| `POSTGRES_URL_NON_POOLING` | Direct database connection (auto-set) |
| `SUPABASE_URL` | Supabase project URL (auto-set) |
| `SUPABASE_SERVICE_ROLE_KEY` | Image upload access (auto-set) |
| `SUPABASE_STORAGE_BUCKET` | `vehicle-photos` |
| `NEXT_PUBLIC_APP_URL` | `https://teslatradeins.com.au` |

### 4.3 Redeploying after changes

After changing environment variables: **Deployments → ⋯ → Redeploy**

---

## 5. Database (Supabase)

### 5.1 Project details

| Item | Detail |
|------|--------|
| Project name | supabase-violet-park |
| Region | Sydney (ap-southeast-2) |
| Database | PostgreSQL |

### 5.2 How tables were created

Because the local network could not reach Supabase directly, tables were created using SQL in the **Supabase SQL Editor**:

1. Open Supabase Dashboard → **SQL Editor**
2. Run the script: `prisma/init.sql` (creates all tables)
3. Run the script: `prisma/seed.sql` (creates demo users and sample vehicle)
4. Run the script: `prisma/fix-logins.sql` (ensures password hashes are correct)

### 5.3 Database tables

| Table | Purpose |
|-------|---------|
| User | Login accounts (Tesla staff, partners, super admin) |
| PartnerProfile | Partner company details |
| Vehicle | Trade-in vehicle listings |
| VehiclePhoto | Photos attached to listings |
| Reservation | Partner vehicle reservations |
| AuditLog | Record of all system actions |
| PasswordResetToken | Password reset requests |
| SystemSetting | App configuration |

### 5.4 Image storage

Create a public storage bucket in Supabase:

1. Supabase Dashboard → **Storage** → **New bucket**
2. Name: `vehicle-photos`
3. Enable **Public bucket**

---

## 6. User roles

| Role | Access |
|------|--------|
| **Super Admin** | Manage all users, full audit log |
| **Tesla Employee** | Create listings, approve reservations, manage partners |
| **Wholesale Partner** | Browse inventory, reserve vehicles, view own reservations |

### Demo accounts (change before production use)

| Role | Email | Password | Login page |
|------|-------|----------|------------|
| Super Admin | superadmin@tesla.com | SuperAdmin123! | /login/tesla |
| Tesla Employee | lister@tesla.com | TeslaEmployee123! | /login/tesla |
| Partner | partner@wholesale.com | Partner123! | /login/partner |

---

## 7. Vehicle status workflow

```
Available → Reserved → Pending Tesla Approval → Sold
                                              ↘ Rejected → Available (re-listed)
```

| Status | Meaning |
|--------|---------|
| Available | Visible to all partners in inventory |
| Reserved | Hidden from other partners; awaiting Tesla review |
| Pending Tesla Approval | Reservation submitted; Tesla must approve or reject |
| Sold | Tesla approved the reservation |
| Rejected | Tesla rejected; vehicle returned to Available |

---

## 8. Email setup (planned — Resend)

To enable automated emails (reservation alerts, approvals, rejections):

1. Create account at [resend.com](https://resend.com)
2. Add domain `teslatradeins.com.au`
3. Add SPF/DKIM DNS records in GoDaddy (provided by Resend)
4. Add `RESEND_API_KEY` and `EMAIL_FROM` to Vercel environment variables
5. Redeploy

---

## 9. Troubleshooting

| Problem | Solution |
|---------|----------|
| Site shows GoDaddy parking page | DNS not yet pointing to Vercel; check GoDaddy DNS records |
| Build fails on Vercel | Check deployment logs; ensure latest code is on GitHub `main` branch |
| Login fails | Confirm users exist in Supabase `User` table; run `fix-logins.sql`; redeploy Vercel |
| No tables in Supabase | Run `init.sql` in SQL Editor |
| Photos won't upload | Create `vehicle-photos` bucket in Supabase Storage |

---

## 10. Support contacts

| Area | Contact / Resource |
|------|-------------------|
| Domain (GoDaddy) | godaddy.com/help |
| Hosting (Vercel) | vercel.com/support |
| Database (Supabase) | supabase.com/docs |
| Source code | github.com/DumpleDorf/tradeins |

<footer>Tesla Certified Trade-In Wholesale Portal — Platform Setup Overview — teslatradeins.com.au — Confidential</footer>
