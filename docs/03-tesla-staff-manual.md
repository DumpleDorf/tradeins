<div class="cover">

# Tesla Certified Trade-In Wholesale Portal

## Tesla Staff User Manual

<p class="subtitle">Guide for Tesla employees — listers and administrators</p>

<p class="meta">
<strong>Audience:</strong> Tesla Employees & Super Admins<br>
<strong>Login URL:</strong> teslatradeins.com.au/login/tesla<br>
<strong>Document version:</strong> 1.0 — June 2026
</p>

</div>

## 1. Welcome

Welcome to the **Tesla Certified Trade-In Wholesale Portal**. As a Tesla employee, you can list certified trade-in vehicles, manage wholesale partner accounts, and approve or reject partner reservations.

<div class="note">
<strong>Important:</strong> No sales are final until approved by Tesla. Partners see this disclaimer on every page.
</div>

### Role overview

| Role | Capabilities |
|------|-------------|
| **Tesla Employee** | Create/edit/delete listings, approve reservations, manage partners, view audit log |
| **Super Admin** | All Tesla Employee capabilities + manage Tesla employee accounts |

---

## 2. Logging in

1. Open: **https://teslatradeins.com.au/login/tesla**
2. Enter your Tesla email and password
3. Click **Sign in**

> Use the **Tesla Employee Login** page — not the Partner login page.

### Forgot password

Click **Forgot password?** on the login page and follow the email reset link.

---

## 3. Tesla Dashboard

After login, you arrive at the **Tesla Dashboard** with four sections:

| Section | Purpose |
|---------|---------|
| **Listings** | Create and manage vehicle listings |
| **Reservations** | Review and approve/reject partner reservations |
| **Partners** | Invite and manage wholesale partner accounts |
| **Audit Log** | View all platform activity |

---

## 4. Managing vehicle listings

### 4.1 View all listings

1. Dashboard → **Listings**
2. All listings are shown with their current status

### 4.2 Listing statuses

| Status | Meaning |
|--------|---------|
| **Available** | Live on partner inventory |
| **Reserved** | Partner has reserved; hidden from other partners |
| **Pending Approval** | Awaiting your approve/reject decision |
| **Sold** | You approved the reservation |
| **Rejected** | Reservation was rejected; vehicle re-listed |

### 4.3 Create a new listing

1. Listings → **New Listing**
2. Complete all fields:

| Field | Description |
|-------|-------------|
| Make | Vehicle manufacturer (default: Tesla) |
| Model | e.g. Model 3, Model Y |
| Year | Model year |
| Mileage (km) | Odometer reading |
| Exterior Colour | e.g. Pearl White |
| Interior Colour | e.g. Black |
| VIN | 17-character Vehicle Identification Number |
| Condition Grade (1–5) | 1 = poor, 5 = excellent |
| List Price (AUD) | Indicative wholesale price (not transactional) |
| Available From | Date vehicle is available for partners |
| Description | Full condition notes, service history, damage |
| Photos | Upload one or more vehicle photos |

3. Click **Create Listing**

<div class="note">
List prices are <strong>indicative only</strong>. Final sale terms are agreed offline after Tesla approval.
</div>

### 4.4 Edit or remove a listing

- You can **edit** or **delete** a listing at any time **before** it reaches **Pending Approval** or **Sold** status
- Once a partner reserves a vehicle, it moves to **Pending Approval** — edit options are limited

### 4.5 Optional: notify partners of new listings

In **Partners** section, enable:

> ☑ Email all active partners when a new listing goes live

Requires Resend email integration to be configured.

---

## 5. Managing reservations

### 5.1 View reservations

1. Dashboard → **Reservations**
2. All reservations are listed with partner details and vehicle information

### 5.2 Approve a reservation

1. Find the reservation with status **Pending Approval**
2. Review partner company, contact details, and vehicle information
3. Click **Approve**
4. Vehicle status changes to **Sold**
5. Partner receives a **confirmation email** automatically

> Approval constitutes Tesla's written confirmation of the sale. A Tesla representative should follow up offline.

### 5.3 Reject a reservation

1. Find the reservation with status **Pending Approval**
2. Click **Reject**
3. Enter a **rejection reason** (required)
4. Click **Confirm Reject**
5. Vehicle returns to **Available** status (visible to all partners again)
6. Partner receives a rejection email with your reason

### 5.4 Reservation workflow

```
Partner reserves vehicle
        ↓
Vehicle hidden from all other partners
        ↓
Email sent to Tesla team
        ↓
You approve or reject in Reservations
        ↓
Partner notified by email
```

---

## 6. Managing partner accounts

### 6.1 View partners

Dashboard → **Partners** — lists all invited wholesale partner companies.

### 6.2 Invite a new partner

1. Partners → **Invite Partner**
2. Complete the form:

| Field | Description |
|-------|-------------|
| Email | Partner's login email |
| Contact Name | Primary contact person |
| Company Name | Wholesale company name |
| Primary Contact | Name shown on reservations |
| Phone (optional) | Contact phone number |

3. Click **Send Invite**
4. Partner receives an email with login credentials
5. Partner must change their password after first login

> Partners **cannot self-register**. All accounts must be invited by Tesla.

### 6.3 Deactivate a partner

1. Find the partner in the list
2. Click **Deactivate**
3. Partner can no longer log in; existing reservations are unaffected

---

## 7. Audit log

Dashboard → **Audit Log**

Records all significant actions with timestamp and user:

| Action type | Example |
|-------------|---------|
| VEHICLE_CREATED | New listing added |
| VEHICLE_UPDATED | Listing edited |
| VEHICLE_DELETED | Listing removed |
| VEHICLE_RESERVED | Partner reserved a vehicle |
| RESERVATION_APPROVED | Tesla approved a sale |
| RESERVATION_REJECTED | Tesla rejected a reservation |
| PARTNER_INVITED | New partner account created |
| PARTNER_UPDATED | Partner details changed |

---

## 8. Super Admin — managing Tesla employees

*Super Admin users only*

1. Navigate to **Admin** dashboard
2. **User Management** → **Add Employee**
3. Enter name, email, and initial password
4. New employee can log in at `/login/tesla`

---

## 9. Business rules (enforced by the system)

| Rule | Detail |
|------|--------|
| One reservation per vehicle | Only one partner can reserve at a time |
| Reserved = hidden | Reserved vehicles immediately hidden from all other partners |
| No sale without approval | Status only becomes **Sold** after explicit Tesla approval |
| Partners see own data only | Partners cannot see other partners' reservations |
| Tesla cannot reserve | Tesla employees cannot reserve vehicles |
| All actions logged | Every status change recorded in audit log |

---

## 10. Disclaimers shown to partners

The following appears on all partner-facing pages:

> *"All reservations are subject to final approval by Tesla. No sale is confirmed until you receive written confirmation from Tesla."*

Listings display:

> *"No sales are final until approved by Tesla."*

---

## 11. Quick reference

| Task | Steps |
|------|-------|
| Log in | teslatradeins.com.au/login/tesla |
| Create listing | Dashboard → Listings → New Listing |
| Approve reservation | Dashboard → Reservations → Approve |
| Reject reservation | Dashboard → Reservations → Reject → enter reason |
| Invite partner | Dashboard → Partners → Invite Partner |
| Deactivate partner | Dashboard → Partners → Deactivate |
| View activity | Dashboard → Audit Log |
| Add Tesla employee | Admin → User Management (Super Admin only) |
| Log out | Sign out (top right) |

---

## 12. Getting help

| Issue | Action |
|-------|--------|
| Cannot log in | Contact Super Admin to verify account status |
| Build / technical issues | Refer to Platform Setup Overview document |
| Partner cannot log in | Check partner status is **Active** in Partners section |
| Email not sending | Resend integration must be configured (see setup guide) |

<footer>Tesla Certified Trade-In Wholesale Portal — Tesla Staff User Manual — teslatradeins.com.au — Confidential</footer>
