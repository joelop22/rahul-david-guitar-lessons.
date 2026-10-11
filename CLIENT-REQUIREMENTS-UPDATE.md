# Client requirements update — 10 October 2026

This update preserves the Phase 2 Next.js App Router + TypeScript + Tailwind CSS + Supabase + Razorpay + private tutorials architecture, while applying the confirmed lesson plans and location.

## Confirmed tuition plans

| Class mode | Monthly fee | Duration | Place |
|---|---:|---|---|
| Online | ₹1,800 | 4 classes × 45 minutes | Remote |
| Offline | ₹2,000 | 4 classes × 60 minutes | Teacher's location: Elamakkara, Kochi |
| Home tuition | ₹2,000 + agreed travel | 4 classes × 60 minutes | Student's address |

All are first-month payments in advance. Travel fees are owner-approved before payment. No specific schedules, instructor qualifications or statistics were invented.

## New fields

Student name, age, account email, phone, guardian name/phone for minors, experience level, class mode (online/offline/home), preferred language (Malayalam/English), preferred days/time, full home address for home tuition, musical goals and favourite songs.

## Flow

1. Sign in using a verified Supabase account.
2. Select course, class mode and a genuinely published available class option.
3. Complete the student details and preferred timings form.
4. Review the monthly tuition and terms.
5. For home tuition, save `awaiting_quote`. Rahul approves a non-negative travel charge in `/admin` after speaking to the student. Student returns and reviews/accepts the exact total.
6. For online/offline or approved home tuition, server calculates amount from approved price snapshot and creates the Razorpay order.
7. Razorpay verification and webhooks record captured payments; existing enrollment logic grants course tutorial access only then.
8. The student opens a prefilled WhatsApp confirmation and presses Send manually.

Students can enquire by WhatsApp even while there are no published schedules. No payment is possible while published availability and credentials are absent.

## Supabase SQL instructions

- For **new Supabase installations** run `supabase/schema.sql`.
- For **existing installations** that used the previous schema: back up your DB first, then run `supabase/migrations/20261010_client_requirements.sql` only (not the whole new schema again).
- The published fee must be 180000 paise for online, 200000 for offline/home when approved class options are added by the owner.

## Testing and configuration

- Syntax parsed with TypeScript compiler API (including JSX); no syntax errors found.
- Local import paths checked; no missing local imports found.
- Fee/duration assertions passed for all three class modes.
- Full `npm install` / `next build` was **not completed** in the file-generation environment because package registry access timed out. Run `npm install`, `npm run typecheck` and `npm run build` locally before deployment.
- Razorpay and Supabase remain unconfigured; `.env.example` has blank secrets and `ADMISSIONS_ENABLED=false` by default.
- This is **first-month checkout**, not automated recurring monthly billing or automatic tutorial-access expiry. Configure those policies separately before collecting renewal payments.
