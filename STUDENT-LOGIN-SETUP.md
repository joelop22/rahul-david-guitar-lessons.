# Student login update — username/password and Google

Updated 11 October 2026. Production website: https://rahul-david-guitar-lessons.vercel.app

## Install the update

Extract `student-login-update.zip` into your existing `G:\rdgl` folder. Replace matching files; do not create a separate login folder. Keep your `.env.local` and current admin settings.

1. Supabase → SQL Editor: run ONLY `supabase/migrations/20261011_student_usernames.sql` from this update. Do not run the full `schema.sql` over your existing database.
2. The migration adds a private username mapping and two narrowly scoped functions. It does not alter existing users, passwords, roles, enrollments, videos or reviews.
3. Supabase → Authentication → Sign In / Providers → Email: enable email/password sign-in and account signup, and keep email confirmation enabled. If you deliberately disable public signup, Create account cannot work.
4. Test locally using `npm run dev`, then push the changed source to GitHub. Vercel's build command stays `npm run build:app`.

## Student experience

- `/login`: username OR email plus password; create account; forgot password; existing-student email link; Google button when enabled.
- Signup asks for email and a password of at least 12 characters. After email confirmation, the student chooses a unique username at `/student/account`.
- Existing email-link students: click “Existing student? Use email link”, open the email, then choose a username and set their first password. Existing account IDs and enrollments remain intact.
- Usernames: 3–24 letters, numbers or underscores, case-insensitive. Names are claimed only by verified signed-in users. Uniqueness is enforced in the database.
- `/student/account`: choose/change username, set/change password, continue to lessons or sign out.
- Google users can keep Google-only sign-in, or add a username and password from their account page.
- Account creation does not grant access to paid lessons. Existing enrollment checks still apply. Student sessions cannot authorize the separate owner dashboard.
- Use the same email already associated with paid enrollment. Supabase can link trusted identities with matching verified emails; verify that Google login reaches the existing student account before assuming enrollment transfer. Different emails create distinct accounts; no automatic transfer is implemented.

## Enable Google sign-in

Google's client secret is entered in Supabase, never in source files or browser environment variables.

1. Open https://console.cloud.google.com and select/create your Google Cloud project.
2. In Google Auth Platform, configure Branding, Audience and Data Access. Choose External for general students. Basic scopes: `openid`, email, profile; do not request unrelated Google data.
3. Create an OAuth client with application type **Web application**.
4. Authorized JavaScript origin:
   `https://rahul-david-guitar-lessons.vercel.app`
   Add `http://localhost:3000` separately if testing locally.
5. Supabase → Authentication → Sign In / Providers → Google: copy the exact provider callback URL displayed there.
6. Paste that Supabase callback URL into Google's **Authorized redirect URIs**. Normally it looks like:
   `https://YOUR_SUPABASE_PROJECT_REFERENCE.supabase.co/auth/v1/callback`
   This is NOT the website's `/auth/callback` URL. Copy the actual value from Supabase.
7. Enter Google's Client ID and Client Secret into the Supabase Google provider settings. Enable the provider and save.
8. While the Google app is in Testing, add the student/test email addresses in Audience → Test users. For general student access, move the Google app to Production and complete any branding/domain verification Google requests.
9. In Vercel add this non-secret Config variable for Production:
   `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED=true`
   Add the same line to local `.env.local` if testing locally. Redeploy after adding it.

The Google button is hidden until this flag is enabled so students are not offered an unconfigured provider. No Google client ID/secret needs to be added to Vercel for this Supabase-hosted OAuth flow.

## URL configuration

Supabase → Authentication → URL Configuration:

Site URL:
`https://rahul-david-guitar-lessons.vercel.app`

Redirect allow-list entry, accommodating the callback's next query parameter:
`https://rahul-david-guitar-lessons.vercel.app/auth/callback**`

For local development, optionally retain:
`http://localhost:3000/auth/callback**`

Vercel Production variable:
`NEXT_PUBLIC_SITE_URL=https://rahul-david-guitar-lessons.vercel.app`

The app starts Google/signup/reset through `/auth/callback`, which exchanges the PKCE code and sends students to their account or requested student page. External, admin and API destinations are rejected. The Google Cloud redirect URI is Supabase's provider callback; Supabase's allowed redirect is the website callback. These are two different settings.

## Email delivery

Signup confirmations, password reset and email links require working email delivery. Configure production SMTP in Supabase for real students. Supabase's built-in test mail delivery is limited and may reject addresses outside permitted project users; a successful Google setup alone does not fix email delivery.

Students who forgot their username can sign in with their email. Students who forgot their password use Forgot password with their email, then open a fresh reset link and save a new password on the authenticated account page.

## Push and deploy

After copying files and applying the migration:

```bash
cd /g/rdgl
git status
git add .
git diff --cached --stat
git commit -m "Add student password and Google sign-in"
git push
```

Do not stage `.env.local`, passwords or keys. The existing `.gitignore` excludes local environment files. Vercel should deploy the push automatically when connected to `main`; ensure the Google enable flag is saved before the final redeploy.

## Verify before announcing the update

- Existing email/password account signs in with email.
- New signup email confirms and leads to account setup.
- Unique username signs in; wrong password gives a generic error.
- Duplicate username is rejected; another account cannot claim an existing name.
- Existing email-link student sets a password without losing their account/enrollment.
- Forgot password email opens the account page and a new password works.
- Google sign-in succeeds for an allowed test user, then a general student after Google Production setup.
- `/admin/login` still works independently; student login does not unlock admin.
- Paid lessons remain gated and existing videos/reviews still work.

Local validation delivered with this update: 20 focused auth/community tests, TypeScript checks and production build. Live Google, SMTP and database integration require your project configuration and a real sign-in test; they have not been tested against your credentials here.

## Official references

- https://supabase.com/docs/guides/auth/social-login/auth-google
- https://supabase.com/docs/guides/auth/passwords
- https://supabase.com/docs/guides/auth/redirect-urls
- https://supabase.com/docs/guides/auth/auth-smtp
