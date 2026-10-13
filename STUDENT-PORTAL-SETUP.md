# Student profiles, progress, course access and certificates

Updated 12 October 2026. Production: https://rahul-david-guitar-lessons.vercel.app

## Included in this update

1. Admin → Students → Taken: compact student name/avatar/course rows, name search and full profile links. Enquired keeps the enquiry cards.
2. Private admin profile: original enquiry/contact/guardian details, student photo, goals, learning level, joining date and account linking.
3. Per-course training dates/status, manual tutorial access grant/suspend/revoke for offline or WhatsApp admission, as well as existing paid access.
4. Student dashboard at `/student/dashboard`: own profile, courses, assignments, tutor feedback, skill progress and certificates.
5. Attendance/class records and tutor-only notes; dated skill assessment history with Not started / Practising / Improving / Confident ratings.
6. Practice assignments with target dates and optional linked tutorials. Students report practice done and submit private MP4/WebM recordings. Rahul reviews with feedback.
7. Tutorial completion button, recorded separately from practice and tutor-assessed skills.
8. Tutor-confirmed completion, frozen certificate details, private certificate print page, Print / Save as PDF button and fixed A4 landscape design.
9. Public Learning together counter: only current active training, normalized email deduplication across courses/profiles, round down in groups of five (27 → 25+), animate when visible, reduced-motion support, hidden below five. It exposes no exact total or student identities.
10. Clearer enquiry preferred-time/day validation messages.

## Install database migration first

Use the same working Supabase project. Confirm the earlier enquiries migration has been applied:

`supabase/migrations/20261012_enquiries.sql`

Then run ONLY this new migration in SQL Editor:

`supabase/migrations/20261012_student_portal.sql`

Do not run the full schema over the existing database. `supabase/schema.sql` is supplied only for fresh installations.

The migration creates six private portal tables and server-only functions for verified account linking, access changes, atomic course completion/certificate issuance and the rounded public counter. The `student-files` bucket is private. Students do not write these tables directly from the browser; authorized server routes perform writes.

No new npm packages or Vercel environment variables are needed. Keep all existing Supabase credentials and the separate admin-login variables.

## Upload source without flattening folders

Extract `student-portal-update.zip` into the existing `G:\rdgl` root and preserve all folder paths. Keep `.env.local` and your real tutor portrait/configuration unchanged.

If using GitHub uploads, open the appropriate repository folder before uploading files. New route folder names such as `[id]` must stay exactly as supplied. Do not put `page.tsx`, `route.ts`, or component files at repository root. The root Markdown setup guide belongs at root; source files do not.

Key paths:

| Area | Paths |
| --- | --- |
| Taken list | `src/app/admin/students/students-manager.tsx`, `src/app/api/admin/students/route.ts` |
| Admin student profile | `src/app/admin/students/[id]/page.tsx` |
| Student dashboard | `src/app/student/dashboard/page.tsx` |
| Shared private profile UI | `src/components/portal/profile.tsx` |
| Owner API | Supplied files under `src/app/api/admin/portal` (separate owner session) |
| Portal server API | `src/app/api/portal/route.ts`, `src/app/api/portal/upload/route.ts`, `src/app/api/portal/recording/route.ts` |
| Access/validation | `src/lib/portal.ts`, `src/lib/portal-server.ts` |
| Tutorial access/completion | Supplied files under `src/app/student/tutorials`, `src/app/api/student`, and `src/components/portal/lesson-completion.tsx` |
| Certificate | `src/app/certificates/[id]/page.tsx`, `src/app/certificates/[id]/print.tsx` |
| Public counter | `src/components/learning-counter.tsx`, `src/app/api/learning-count/route.ts`, `src/app/page.tsx` |
| Styling | `src/app/globals.css` |
| Migration | `supabase/migrations/20261012_student_portal.sql` |
| Preview/testing/docs | Supplied `scripts`, `tests`, schema and setup-guide files |

Use `npm run build:app` for Vercel/full application. `npm run build` remains the disabled static design preview.

```bash
cd /g/rdgl
npm run typecheck
npm run build:app
git status
git add .
git diff --cached --stat
git commit -m "Add student profiles progress and certificates"
git push
```

Inspect staged files, keep secrets out of GitHub, and let the connected Vercel branch deploy.

## First real student — recommended setup flow

1. Open `/admin/students` with the separate owner login.
2. Confirm the enquiry and mark it Taken.
3. In Taken, click the student's compact row. Opening a Taken profile initializes its private student record if necessary.
4. Confirm the name, goals, level and joining date. Upload the student's real photo if desired (JPG/PNG/WebP, max 5 MB).
5. Ask the student to register and verify their account email, using the existing username/password or Google sign-in flow.
6. In the admin profile, **Link verified email**. Only verified accounts with the student role can be linked. A registered account can be linked to only one profile. Do not create duplicate Taken profiles for the same person.
7. **Add training course**, with the actual course start date. Course dates can be corrected before certificate issuance.
8. **Grant access** for that course. Students can now play published tutorials for it without an online checkout.
9. Send the student to `/student/dashboard` (normal login now defaults there).

Existing paid users keep the old tutorial access path. Their new tracking profile is not auto-created from payments: create/confirm a Taken enquiry, link the account and add the training course. This avoids inventing training dates or linking a person based only on an unverified enquiry email.

## Separate statuses

- Enquired/Taken: admission contact tracking.
- Active/Paused/Completed: training status per course, used for the public counter.
- Active/Suspended/Revoked: tutorial access per course.
- Practice reported done / recording submitted / reviewed: assignment activity.
- Tutorial marked complete: student's own completion record.
- Skill assessment: tutor judgment, independent of viewing a video.
- Certificate: tutor-confirmed completion snapshot.

Completion does not revoke access automatically. Rahul controls tutorial access separately. Manual suspension/revocation also updates matching paid enrollment rows, and the portal override prevents a legacy paid row from bypassing a manual suspension.

Once linked, a profile cannot be reassigned to a different person's account through the ordinary UI. Correct account reassignment needs a reviewed database correction so private history/certificates are not accidentally transferred.

## Class and improvement tracking

- Add class date, attendance, student-visible feedback and optional tutor-only notes.
- Class/assessment dates cannot be in the future.
- Skill assessments append dated history. Enter a consistent skill name; case variations are grouped when displaying the latest assessment.
- The progress bar represents the average latest tutor rating across assessed skills, divided by the maximum rating of 3. It is not a claim that the entire course is complete.
- The dashboard shows the exact all-time attended-class count and tutorial completion count. The practice summary uses the displayed assignment history. History lists display the latest 200 class, skill and assignment records per category.
- There is no predetermined number of classes or fabricated course percentage.

## Practice assignments and recordings

- Select the course, exercise/song, instructions, optional target date and optional published tutorial from that course.
- Student can mark practice done and upload a private recording (MP4/WebM, max 50 MB).
- Recording uploads go directly to signed Supabase storage URLs, so large video bytes do not pass through a Vercel function body.
- Only the student and Rahul can request temporary playback URLs for the recording.
- Rahul saves feedback and marks it reviewed; the student cannot overwrite a reviewed submission.
- Assignment recordings are never automatically published as public class moments. Public use needs separate permission and the existing class-moments workflow.
- Superseded/orphan uploads are not automatically cleaned up. Rahul should apply the chosen retention/deletion process to private student storage.

## Certificates

A certificate exists only after Rahul selects **Confirm course completion**, supplies a valid completion date and checks the confirmation box.

Completion is recorded in one database transaction with a unique certificate per training-course record. Repeated confirmation returns the same certificate rather than generating duplicates.

Saved fields: student name, course name, actual start and completion dates, unique certificate number, issue time, issuing tutor and branding snapshot. Later profile name edits do not change issued certificates. Completion/start dates are locked once issued; certificate corrections require a reviewed correction, not casual profile editing.

Period formatting:
- 2026 start / 2027 finish → **2026–27**.
- Both in 2026 → **2026**.

Print button appears for the tutor and linked student only after a certificate is issued. Open it, click **Print / Save as PDF**, choose landscape A4 and select your browser's **Save as PDF** printer to download. Disable browser headers/footers. PDF generation uses the browser print engine; there is no separate server PDF download endpoint.

The fixed certificate layout is in `src/app/certificates/[id]/page.tsx` and its certificate CSS. Branding configuration is `certificateBrand` in `src/lib/portal.ts`.

Rahul's actual signature is optional, disabled initially. To use it on future certificates, upload the approved signature to `public/images/certificate-signature.png` and set `signatureEnabled:true`. No signature is fabricated. Use versioned asset filenames if changing signature imagery later. Already issued branding is saved separately.

## Counter rules

A student counts when at least one training course is Active and has reached its start date. Multiple courses count once; paused/completed-only students and enquiries with no active training course do not count. The count is deduplicated using the current linked account email or enquiry email. At least five active students are needed before the homepage section appears.

Public API returns only a rounded milestone (e.g. 25), never 27, individual student names, emails or account IDs. The client animates 0 → 25 and then displays 25+. With reduced motion it displays the final value immediately.

## Live acceptance checks

- Admin can open a Taken row and link the correct verified student account.
- A different student cannot retrieve that profile, recording or certificate.
- Student response contains no `private_notes`, even if a separate owner session is present in the same browser.
- Grant course access → published tutorials work. Suspend/revoke → playback endpoint and lesson page deny access, including previously paid users with a portal override.
- Add class/skill records; verify feedback and progress on the student dashboard.
- Assign practice, submit a short test recording as the student, and review it as Rahul.
- Mark a tutorial complete; verify it appears in the completion count independently from skills.
- Confirm completion as tutor; verify certificate is not available beforehand and its period/name/course are correct afterward.
- Edit the profile name after issuance; saved certificate name remains unchanged.
- Print/save the real certificate and verify one-page A4 layout, including any longer name and approved signature.
- At five or more real active students, verify milestone counter rounding and active/paused/completed behavior. Do not create fake public student statistics.

## Validation performed and remaining checks

Focused auth/privacy/access/counter tests and TypeScript checks run locally. The full production build is checked separately from the disabled design preview.

No real Supabase credentials, student files or Google sessions are available in this workspace. The SQL migration has not been executed against your database here. Real account linking, database functions, signed storage uploads, browser certificate printing and the production counter must be verified after applying the migration and deploying. Browser visual QA is unavailable in this environment.

The separate static preview does not grant access, issue certificates or expose real student profiles. Do not confuse a successful preview publish with deployment of your real Vercel application.
