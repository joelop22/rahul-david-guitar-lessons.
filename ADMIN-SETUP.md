# Separate admin login — quick setup

The owner dashboard now has its own user-ID/password login at `/admin/login`.
Student email-link login stays at `/login`. Their sessions and cookies are separate.
Signing in as a student, even with an owner email, does not open the admin dashboard.
All admin API routes check the dedicated admin session and the owner role.

## Update your existing G:\rdgl installation

1. Extract this update and copy its source files into `G:\rdgl`, replacing the old
   files. Keep your existing `.env.local` and your own images/content.
2. Stop the running server with Ctrl+C. In Git Bash inside `G:\rdgl`, run:

```bash
npm install
npm run setup:admin
```

If Git Bash reports that an interactive terminal is required, use
`winpty node scripts/setup-admin.mjs`, or run the command in the VS Code terminal.

3. The setup command asks for:
   - A login user ID (default `rahuladmin`).
   - An owner email. This identifies the account privately in Supabase; you do
     not need an email link to log into the admin dashboard.
   - Your chosen password (at least 12 characters), entered twice with typing
     hidden. Save it in your password manager.
4. Restart:

```bash
npm run dev
```

5. Open http://localhost:3000/admin/login and enter the user ID and password.
   There is also an Admin link in the website footer.

## Prerequisites

Your `.env.local` must already contain the Supabase URL, public key and server
secret. `supabase/schema.sql` must already have run in your fresh project.
The setup command creates a confirmed owner account and fills three new local
settings: ADMIN_USER_ID, ADMIN_AUTH_EMAIL and ADMIN_AUTH_USER_ID.
It does not send a sign-in email, store the password in source files, or change
students' passwords. Existing student accounts are not automatically promoted.
An existing owner email can be reused; its password will be updated by the setup.

## Resetting the password

Run `npm run setup:admin` again using the same admin user ID and owner email.
It verifies the existing owner role before updating the password. There is no
public admin signup or password reset button. Supabase authentication handles
password validation and authentication rate limits; tighter IP-based limits can
be configured at the hosting layer if needed.

## Hosted application

Add ADMIN_USER_ID, ADMIN_AUTH_EMAIL and ADMIN_AUTH_USER_ID to your hosting
provider's environment, alongside the existing Supabase settings. Rebuild and
use https://YOUR-DOMAIN/admin/login. Do not put passwords or server secrets in
NEXT_PUBLIC variables. Use npm run build:app for the full Next.js app.

The static design preview shows the separate login layout with submission
turned off. Real authentication and uploads run in the configured Next.js app.
An admin sign-out ends that admin session without signing out students.

## Verification

The update has automated checks for dedicated cookie isolation, configured
owner identity and role checks, cross-origin login protection, rejected passwords
and sign-out scope. A real login/upload test still requires your Supabase project.
