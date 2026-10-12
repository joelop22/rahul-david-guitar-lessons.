# Class enquiry and admin student list update

Updated 12 October 2026. Live Vercel website: https://rahul-david-guitar-lessons.vercel.app

## What changes

- Hero primary button: **Enquire about classes**, opening `/enquire`.
- New form collects the admission form's student details and lesson preferences without checkout, fees, payment fields, or a login requirement.
- Fields: name, age, phone, email, parent/guardian name and phone for students under 18, course, experience, class mode, optional published class option, preferred language/days/time, full address for home tuition, musical goals/favourite songs, and consent.
- Class option can remain **To be discussed with Rahul**, so enquiries work before schedules are published. Timing preferences do not reserve a place.
- Submit saves a private enquiry first, then opens Rahul's WhatsApp with all entered student details and an enquiry reference. The student must tap **Send** in WhatsApp; the website cannot silently send a WhatsApp message.
- If saving fails, WhatsApp does not open and an error keeps the form available. If WhatsApp does not open after saving, the saved confirmation includes a Continue to WhatsApp link.
- Retries from the same unchanged form reuse a submission ID rather than adding duplicate rows.
- `/admin` now links to **Students · Enquired & Taken**.
- `/admin/students` has separate **Enquired** and **Taken · Students** sections, full expandable details, WhatsApp contact action and paginated lists of 25 records.
- Admin can **Mark as Taken** or **Move back to Enquired**. Status changes preserve all submitted details.
- Taken is a student/contact tracking status. It does not create an Auth account, enroll a student in a paid course, or bypass protected tutorial access.
- Existing admission/payment routes, student login, tutor portrait configuration, class moments and reviews remain separate.

## Installation on the existing site

### 1. Database first

In your existing Supabase project → SQL Editor, paste/run:

`supabase/migrations/20261012_enquiries.sql`

Run only that migration, NOT the complete `supabase/schema.sql` over your existing project. The complete schema is included for future fresh installations.

The migration creates:
- `student_enquiries`: all enquiry details, consent timestamp, Enquired/Taken status and dates.
- `enquiry_request_limits` and server-only `allow_student_enquiry`: limits public submissions to 10 attempts per hour per server-observed IP hash.

Both tables have row-level security and no browser read/write grants. Server routes use the existing server secret, and admin list/status APIs require the separate owner session. No raw IP addresses are stored in the limit table.

No new Vercel environment variables are required. Existing Supabase server credentials and `WHATSAPP_OWNER_NUMBER` are used. Enquiries do not depend on `ADMISSIONS_ENABLED` or Razorpay credentials.

### 2. Copy/update source with exact paths

Extract `class-enquiry-update.zip` into the existing `G:\rdgl` folder. Replace matching files and preserve folder paths. Keep `.env.local` untouched.

If uploading through GitHub, open each matching folder before uploading. Do not upload TypeScript/CSS files to the repository root. Create new nested folders using Add file → Create new file and the complete filename when needed.

| File | Exact repository path |
| --- | --- |
| Hero button | `src/components/hero.tsx` |
| Enquiry form | `src/components/enquiry-view.tsx` |
| Validation and WhatsApp formatting | `src/lib/enquiries.ts` |
| Enquiry page | `src/app/enquire/page.tsx` |
| Save endpoint | `src/app/api/enquiries/route.ts` |
| Main admin link | `src/app/admin/page.tsx` |
| Admin students page | `src/app/admin/students/page.tsx` |
| Admin students manager | `src/app/admin/students/students-manager.tsx` |
| Protected admin list/status endpoint | `src/app/api/admin/students/route.ts` |
| Styles | `src/app/globals.css` |
| Privacy enquiry disclosure | `src/app/privacy/page.tsx` |
| Migration | `supabase/migrations/20261012_enquiries.sql` |
| Fresh-install schema | `supabase/schema.sql` |
| Static preview builder | `scripts/build-ui-preview.mjs` |
| Tests | `tests/enquiries.test.cjs` |
| This guide | `ENQUIRY-UPDATE-SETUP.md` (repository root) |

### 3. Test and push

```bash
cd /g/rdgl
npm run dev
```

For a production check: `npm run build:app`. Vercel's build command remains `npm run build:app`, not the static-preview command.

```bash
git status
git add .
git diff --cached --stat
git commit -m "Add class enquiries and admin student tracking"
git push
```

Vercel deploys the connected production branch. Do not commit `.env.local` or any passwords/secret keys. This update contains no credentials and requires no new npm dependencies.

## Live checks after deployment

1. Hero button opens https://rahul-david-guitar-lessons.vercel.app/enquire .
2. Submit an adult enquiry with no published batch. Check that it saves and opens WhatsApp with name, age, contact details, course/mode and all preferences.
3. Sign in at `/admin/login`; open `/admin/students`. The new enquiry appears under Enquired with all its details.
4. Mark as Taken; switch to Taken · Students and verify the record appears there. Move back if testing.
5. Test a student under 18: guardian fields are required and included in the saved/WhatsApp details.
6. Test home tuition: a full address is required and retained.
7. Confirm anonymous/student sessions cannot read `/api/admin/students` or change statuses.
8. Confirm existing admin/student login, class videos and reviews still work.

Public enquiry details are personal information. Keep them in private Supabase tables; do not add screenshots or database exports to GitHub. Review the existing privacy-policy draft and choose a retention/deletion process before collecting real enquiries at scale.

## Validation and limits

The update includes tests for guardian/address/consent validation, rejected client status/payment injection, save-before-WhatsApp behavior, failed saves, retry deduplication, throttling, private admin authorization and reversible Taken status. Auth/community regression tests also run.

A static design preview is provided separately; it deliberately disables form submission and does not expose real student records. Real Supabase migration behavior, WhatsApp app handoff and production submissions must be tested after you apply the migration and deploy to Vercel.
