# Full-screen studio update — 11 October 2026

Start with [START-HERE.md](START-HERE.md) for setup, deployment, class clips, reviews and Google links. The application now includes an edge-to-edge fading hero, scroll-responsive capsule navigation, mobile swipe cards, class-moment uploads, moderated website reviews and a smooth review strip. No real student clips or reviews are seeded.

# Rounded dark studio UI — October 2026

The approved UI is implemented with responsive rounded panels, amber actions,
local Inter fonts and four replaceable generated photographs. See
[IMAGE-REPLACEMENT.md](IMAGE-REPLACEMENT.md) for image swaps and build commands.

`npm run build` creates the private UI preview; `npm run build:app` builds the
full existing application with its provider integrations. The preview does not
submit admissions, send sign-in email or process payments.

# Rahul David Guitar Lessons

## Client-approved lesson plans — October 2026

- **Online:** ₹1,800 monthly in advance; 4 lessons × 45 minutes.
- **Offline at teacher location:** ₹2,000 monthly in advance; 4 lessons × 60 minutes; **Elamakkara, Kochi**.
- **Home tuition:** ₹2,000 monthly in advance; 4 lessons × 60 minutes; **additional travel charges, if applicable, require owner approval and student review BEFORE Razorpay checkout**.
- Student form: student name, age, verified login email, phone, guardian contact for minors, experience, course level, mode, Malayalam/English language, preferred days and time, address for home tuition, musical goals/favourite songs.
- Days/times are **preferences**, not confirmed appointments. No batch slots are seeded or invented. Rahul must confirm availability and publish genuine options before registration and payment will work.
- Home tuition is initially saved as `awaiting_quote`. Rahul approves the total in `/admin` and contacts the student. The student signs in again, chooses the same class option, reviews the final amount and explicitly proceeds to payment.
- Payments remain guarded behind `ADMISSIONS_ENABLED=false` by default. Do not activate live payments without configuring Razorpay test credentials, required policies, valid batches and end-to-end tests.

### Existing installations vs fresh Supabase projects

- **New Supabase project:** run the updated `supabase/schema.sql` once.
- **Existing Supabase project previously set up with the older `schema.sql`:** first back up your data, then run **only** `supabase/migrations/20261010_client_requirements.sql` for the new fields and enum constraints. Do not run the full `schema.sql` again.
- This starter has no invented batch times. Rahul must create legitimate active `batches` rows for each course/mode he actually offers, with `fee_paise` matching the published monthly fee (online: 180000, offline/home: 200000). Only after genuine availability is confirmed should admission intake be enabled.
- Student data and video access still depend on configured Supabase Auth and payment reconciliation. Use test mode until all tests pass.
- **Monthly payments:** this phase charges **the first month only**. It does **not** automatically collect subsequent monthly fees or revoke access on renewal due dates. Decide renewal/access-expiry policy before launching monthly renewals.

 — Phase 2

A Next.js/TypeScript/Tailwind starter with server-enforced course pricing, Supabase Auth, Razorpay order/payment verification, enrolled-only video lessons, and an owner tutorial uploader. The application is supplied **without credentials**. A static UI preview is deployed separately; live integrations have not been exercised end-to-end.

## What is implemented

- Responsive home page, public courses, and admission form
- Courses/batches load from Supabase when configured; unpublished fees remain unavailable
- Supabase email-link sign-in (`/login`), server session refresh middleware, auth callback
- Authenticated admission creation; amount and course/batch are looked up from the server database
- Razorpay order creation, HMAC checkout signature verification, captured-payment reconciliation
- Signed Razorpay webhook endpoint, event deduplication, idempotent SQL payment/enrollment transaction
- Payment confirmation page and prefilled WhatsApp link to **+91 79943 57541**, manually sent by the student
- Student tutorial listing restricted by **active course enrollment**, protected video playback URLs
- Owner-only `/admin` module creation and short private MP4/WebM lesson uploader using Supabase Storage signed upload URLs
- Safe by default: `ADMISSIONS_ENABLED=false`

## Requirements

- Node.js 20.9+ (Node 22 recommended)
- npm and Internet access to download project dependencies
- Supabase account/project (database, Auth, Storage)
- Razorpay account with **test** credentials

## Start the project

1. Extract the ZIP and open `rahul-david-guitar-lessons` in VS Code.
2. In the project terminal:

```bash
npm install
cp .env.example .env.local
npm run dev
```

On Windows PowerShell, copy `.env.example` to `.env.local` with `Copy-Item .env.example .env.local`.

3. Open `http://localhost:3000`.

**You can preview the home page and course copy without any credentials.** The join form will be disabled until backend setup is complete.

## Step A — Set up Supabase

1. Create a project at https://supabase.com.
2. In SQL Editor, run `supabase/schema.sql` **once on a fresh project**. It creates all tables, RLS policies, a transaction function, the private `tutorial-videos` bucket, and three course records (with no fees).
3. Copy **Project URL**, **anon/publishable key** (use in `NEXT_PUBLIC_SUPABASE_ANON_KEY`), and **service role secret key** into `.env.local`. Do not expose the service-role key in frontend code or a Git repository.
4. Under Authentication → URL Configuration, set site URL to `http://localhost:3000` and allow redirect `http://localhost:3000/auth/callback` for local testing.
5. Under Authentication → Providers, enable the Email provider and email link/OTP sign-in for the project's intended audience. Check Supabase email-send quota or configure SMTP for real student delivery.
6. Use the website `/login` to create Rahul's owner account. In Authentication → Users, identify **his verified user UUID**, then run in SQL Editor:

```sql
update public.profiles
set role = 'owner'
where id = 'REPLACE_WITH_VERIFIED_RAHUL_AUTH_USER_UUID';
```

7. Confirm `/admin` is accessible to Rahul's account and inaccessible to a student account.

**Do not use the owner's phone number or name alone to identify which Auth account to promote.** Verify the actual user UUID before changing a role.

## Step B — Set course fees and batches

The database seeds `Beginner Guitar`, `Intermediate Guitar`, and `Advanced Guitar`, but intentionally creates **no batches or fee amounts**. Rahul needs to decide his real prices and schedules.

In Supabase → Table Editor → `batches`, add rows with:

- `course_id`: select the matching `courses.id`
- `mode`: `online` or `offline`
- `label`: e.g. `Weekday evening` (only when Rahul decides)
- `schedule_description`: real days, times and timezone
- `fee_paise`: actual rupee fee × 100 (example math only: ₹1,000 = 100000 paise)
- `is_active`: true when a batch is ready for enrollment
- `capacity`: optional, leave null for first version unless you add payment-time seat reservation and refund handling

**Do not invent fees or batch timings.** The join page automatically lists active batches once added.

## Step C — Configure Razorpay TEST mode

1. In Razorpay, obtain a test-mode Key ID and Key Secret.
2. Set `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` in `.env.local`.
3. Configure `RAZORPAY_WEBHOOK_SECRET` separately and enable the `payment.captured` webhook event when you have an HTTPS endpoint.
4. For local webhook testing, use a secure HTTPS tunnel if desired. Configure the URL ending `/api/payments/webhook`.
5. Keep `ADMISSIONS_ENABLED=false` until test order creation, verification, retries, and webhook processing work correctly. Then set `ADMISSIONS_ENABLED=true` **for test mode only**.
6. Use test payment credentials/cards supplied by Razorpay, not real payments.

Official references:
- https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/
- https://razorpay.com/docs/webhooks/validate-test/

**Go-live blocker:** Before using live keys, thoroughly test interrupted checkouts, refunds, duplicate webhooks, account activation, and concurrent seat capacity. A real successful payment may require manual refund if a capped batch fills while multiple checkouts are open; do not set hard seat caps without reservation logic.

## Step D — Private tutorials and Rahul's uploads

- Students sign in with their verified email before admission.
- When a payment is **captured**, the SQL transaction updates the admission to `paid` and creates an `active` enrollment for the student's `auth.users.id`.
- `/student/tutorials` only shows published modules/lessons for active enrollments.
- `/api/student/lessons/[id]/playback` checks the student enrollment on the server before issuing a **30-minute** temporary video URL.
- In `/admin`, Rahul can create a module, select a short MP4/WebM video (max 50 MB), upload it privately, and publish the lesson.
- The storage bucket is private; video URLs are temporary but **cannot** prevent screen recording. For larger or streamed videos, replace Storage with Mux/Bunny Stream.

## Security and privacy

- Do not reveal any service-role key, Razorpay API secret, or webhook secret to the browser.
- All user identification is performed server-side with `supabase.auth.getUser()`.
- Razorpay signature uses `HMAC-SHA256(order_id|payment_id)`, followed by server-side payment status + amount + currency verification.
- Webhooks use the **raw** body for signed verification.
- The SQL payment transaction grants course access only upon captured payment, protected from the browser by revoked RPC permissions and RLS.
- Owner publishing/upload endpoints check the authenticated account's `profiles.role='owner'` before using elevated database privileges.
- Prefilled WhatsApp confirmation opens a draft that the student must tap **Send**. No automatic sending or file attachment occurs.
- Publish an owner-approved Privacy Policy, Terms, and Refund Policy before collecting payments. The draft legal pages are placeholders, not final legal advice.

## API routes

| Route | What it does |
|---|---|
| `GET /api/catalog` | Available courses/batches |
| `POST /api/admissions` | Authenticated, server-priced admission |
| `POST /api/payments/create-order` | Create/reuse a Razorpay order |
| `POST /api/payments/verify` | Signature, captured status, enrollment |
| `POST /api/payments/webhook` | Signed webhook processing |
| `GET /api/student/lessons/[id]/playback` | Private temporary playback URL |
| `POST /api/admin/modules` | Owner creates tutorial module |
| `POST /api/admin/tutorials/upload-url` | Owner gets signed private upload token |
| `POST /api/admin/tutorials` | Owner publishes lesson metadata |

## What remains before production

- Actual fees and batch schedule data from Rahul
- Real Supabase and Razorpay **test** account configuration
- Owner-approved legal policies and real venue details
- Thorough end-to-end auth, payment, webhook, and video-upload testing
- Better rate limiting, bot protection, audit events, monitoring and backup/reconciliation jobs
- Refund workflow and automatic enrollment revocation for refunded admissions
- Robust capped-batch seat reservation and concurrent payment handling
- Automated receipt PDF and support/contact pages
- Production deployment to Vercel, email deliverability and Razorpay live activation

## Validation status

All TypeScript/TSX source files were parsed for syntax errors. Dependency installation and runtime/build testing were not completed in the file-generation environment because the required npm packages weren't cached and network access wasn't available. Run `npm install`, `npm run typecheck`, `npm run lint`, and `npm run build` in your own environment before relying on this code.

## Phase 3 — Premium dark UI update

Phase 3 **includes the entire Phase 2 codebase** and replaces the presentation layer. You do not need to install Phase 1 or Phase 2 first.

### Design decisions

- Minimal charcoal theme (`#101113`) with off-white text and muted blue accents.
- Poppins for headlines and Inter for body/UI; loaded via Google Fonts CSS with system-font fallbacks if offline.
- Responsive mobile disclosure menu and 48px+ button targets.
- Editorial type-led homepage with a restrained guitar-fretboard graphic. The provided bass-guitar poster is **not** used as a full-site background or hero image; it is course-specific reference material.
- Cleaner Courses, Join Class, Student Login, Tutorials, Owner Studio and Payment Confirmation pages.
- No fabricated fee, batches, biographies, testimonials, or course results.
- All existing Supabase/Razorpay/business-logic files and environment flags retained.

### Updated UI files

- `src/app/globals.css`
- `src/app/layout.tsx`
- `src/components/header.tsx`
- `src/components/footer.tsx`
- `src/components/course-card.tsx`
- `src/components/legal-draft.tsx`
- `src/app/page.tsx`
- `src/app/courses/page.tsx`
- `src/app/join/page.tsx`
- `src/app/join/join-flow.tsx`
- `src/app/login/page.tsx` and `src/app/login/email-login.tsx`
- `src/app/student/tutorials/page.tsx` and `src/app/student/tutorials/[id]/*`
- `src/app/payment/success/page.tsx`
- `src/app/admin/page.tsx` and `src/app/admin/admin-editor.tsx`

### Important

Do **not** enable admissions until your real Supabase and Razorpay **test** accounts are configured and payments have been tested. `ADMISSIONS_ENABLED=false` remains the safe default. CSS and React changes do not replace a full integration, security, and end-to-end QA review.

### VS Code instructions

1. Extract `rahul-david-guitar-lessons-premium-dark.zip`.
2. Open the inner `rahul-david-guitar-lessons` folder in VS Code.
3. In the terminal, run `npm install`.
4. Copy `.env.example` to `.env.local` (PowerShell: `Copy-Item .env.example .env.local`; macOS/Linux: `cp .env.example .env.local`).
5. Run `npm run dev`, then visit `http://localhost:3000`.

This build is a design/code update. External providers remain disconnected until credentials are added. The Poppins/Inter Google Fonts need internet connectivity in the browser to load.
