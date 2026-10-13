# Direct admin enquiries, branded email and returning to the waiting tab

## What this patch fixes

- Admin password login goes directly to `/admin/students` (Enquired/Taken list).
- `/admin` also shows the enquiry list directly, before community/tutorial tools.
- Includes the correct student list page AND the separate `[id]` profile page. The screenshot showed a profile message at `/admin/students`, suggesting the dynamic profile page was uploaded over the list page.
- Admin profile errors no longer display the student-only “manage login / open tutorials” message.
- Student email flows provide clearer delivery/rate-limit errors and optional email-code verification in the existing tab.
- Custom email confirmation uses a token-hash flow that does not require the original browser's PKCE verifier. The link first opens a confirmation page; email scanners cannot consume the token just by loading the page.
- After successful link confirmation, the existing waiting login tab checks the authenticated account and continues. A same-browser BroadcastChannel handshake lets the confirmation tab display “Your original website tab is ready” instead of navigating to a duplicate dashboard.
- Google and older default PKCE links still work through the existing callback.

## Installation

Upload the patch files with the exact paths from the ZIP. Especially:

- `src/app/admin/students/page.tsx`: list page (contains StudentsManager).
- `src/app/admin/students/[id]/page.tsx`: individual profile (contains StudentProfile).
- `src/app/admin/students/students-manager.tsx`: list implementation.

Do not upload the `[id]/page.tsx` contents over `students/page.tsx`. Do not flatten source files into repository root. No SQL changes or new npm packages are needed for this patch. Keep the previously installed portal/enquiry migrations.

## Email delivery is a Supabase setting

This code update cannot configure your SMTP provider credentials. Supabase's built-in sender is intended for testing, accepts project team member addresses only and is heavily rate-limited. Real student emails require a properly configured custom SMTP provider.

1. Supabase → Authentication → Email / SMTP settings: enable Custom SMTP.
2. Enter your provider's SMTP host, port, username and password directly there.
3. Sender email: use an address verified/authorized by your email provider. Do not invent a domain/address.
4. **Sender name: `RahulDavidGuitarLessons`**.
5. Save and check the provider's sender/domain verification status and Supabase email rate limits.
6. Disable provider link tracking for authentication links.
7. Check Supabase Auth logs and provider delivery logs for the exact error, then check recipient spam folders.

SMTP secrets stay in Supabase/provider settings, not GitHub or `NEXT_PUBLIC_` variables. Updating the website title alone does not change the From name.

Official reference: https://supabase.com/docs/guides/auth/auth-smtp

## Install the branded templates

Supabase → Authentication → Email Templates:

| Template | Subject | HTML file in this patch |
| --- | --- | --- |
| Confirm signup | Confirm your account — RahulDavidGuitarLessons | `supabase/email-templates/confirm-signup.html` |
| Magic link | Your sign-in link — RahulDavidGuitarLessons | `supabase/email-templates/magic-link.html` |
| Reset password | Reset your password — RahulDavidGuitarLessons | `supabase/email-templates/reset-password.html` |

Copy the full HTML into the corresponding template and save. Deploy this code BEFORE installing templates that point to the new confirmation page.

The templates include both a confirmation button using `{{ .TokenHash }}` and a one-time code using `{{ .Token }}`. Do not replace these template variables with a real user's token/code. The signup and magic-link type is email; password reset is recovery.

Set Supabase Site URL to:
`https://rahul-david-guitar-lessons.vercel.app`

Retain the redirect allow-list for the old and OAuth callback:
`https://rahul-david-guitar-lessons.vercel.app/auth/callback**`

Ensure Vercel `NEXT_PUBLIC_SITE_URL` is your live site. The new templates use Supabase's Site URL; if testing localhost, use the appropriate project Site URL/template environment so mail does not unexpectedly go to production.

Official references:
- https://supabase.com/docs/guides/getting-started/tutorials/with-nextjs
- https://supabase.com/docs/guides/auth/auth-email-templates

## Original tab behavior — practical limits

A website cannot force Gmail, an email app or a browser to open an external link in a particular existing tab. It also cannot reliably close a tab that the browser/email app opened.

- Same browser, same site origin, waiting login tab still open: it continues after successful authentication; the confirmation tab tells you to return to the original tab.
- No waiting tab or another browser/device: confirmation continues in the newly opened tab.
- Most reliable way to avoid another site tab: copy the email code into the code field in the original login tab. This supports signup confirmation, existing-account email login and password reset.
- Email verification/sign-in is never accepted merely because a tab sends a message; the waiting tab checks the actual authenticated account and a fresh sign-in.
- Password reset goes to student account settings so the student can save a new password.
- New signup accounts remain unlinked to the training profile until Rahul links the verified account.

## Live test order

1. Commit correctly located files; wait for Vercel Ready.
2. Admin password login should open Enquired immediately. Taken row should open `/admin/students/<UUID>`.
3. Configure/verify custom SMTP, sender name and templates.
4. Request a fresh email, verify the branded From name and actual delivery.
5. Test the code in the original login tab.
6. Test the link in the same browser with the waiting tab open; also test opening on another device.
7. Test password reset and signup confirmation separately.

No real SMTP/provider credentials are available here; email delivery and cross-tab browser behavior need these live tests after setup. If email still fails, send the exact redacted Auth/provider error, never passwords or API keys.
