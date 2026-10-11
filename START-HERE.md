# Separate admin update

Read [ADMIN-SETUP.md](ADMIN-SETUP.md) to create the new owner user-ID/password login.

# Rahul David Guitar Lessons — editable website

This package contains the complete Next.js application, its images, database SQL,
and an optional static UI preview. The dark studio design is implemented in the
real application source, not just a screenshot.

## Run the website on your computer

Use Node.js 22 or newer. Open a terminal in this folder:

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000. With no credentials, public pages work and account,
admission, review submission and payment functions remain unavailable.

## Deploy the full application to your existing site

This is a Next.js application and requires a host that supports Next.js server
routes (a plain HTML-only host cannot run authentication, payments or reviews).
For a Node deployment, configure the environment variables from `.env.example`,
then use:

```sh
npm run build:app
npm start
```

Use **npm run build:app** as the production build command. The default
`npm run build` deliberately produces a static design preview with services
disabled; it is not the production application build.

Point your domain at the configured Next.js deployment using your host's domain
settings. No existing external domain or hosting account has been changed.
Do not place server keys in public variables or commit `.env.local`.

## Database and accounts

- Fresh Supabase project: run `supabase/schema.sql` once.
- Existing project: apply only missing migrations from `supabase/migrations/`
  in filename order. Do not rerun the whole fresh-project schema.
- Add the Supabase URL, public anonymous key and server service-role key to the
  host's environment. Set the Supabase site URL and permitted auth callback to
  your own domain (`https://YOUR-DOMAIN/auth/callback`).
- For the separate owner login, follow `ADMIN-SETUP.md` and run
  `npm run setup:admin`. This creates the user-ID/password owner account.
- `/admin/login` is the dedicated owner sign-in; `/admin` contains the public class-moments manager, review moderation,
  travel quotes and private tutorial manager.

## Public class moments (not tutorial videos)

1. Apply `supabase/migrations/20261011_community.sql` if upgrading an existing DB.
2. Set `COMMUNITY_ENABLED=true` after the database and authentication work.
3. In `/admin`, upload a short MP4/WebM clip, title and description.
4. Confirm permission from everyone shown (parents/guardians for children).
5. Upload saves a draft. Choose Publish to show it on the homepage or Hide to
   remove it. Short-lived playback links already issued expire within 5 minutes.

Use real class footage: 15–45 seconds is a useful starting point. Portrait and
landscape videos work. Add burned-in captions for speech. Limit: 50 MB per file.
Files use a separate private `class-moments` storage bucket; public playback is
allowed only for published clips. Paid tutorials remain in `tutorial-videos`.
To replace a clip, upload its replacement and hide the old clip. Owner management
shows the latest 100 clips; the homepage shows the latest 12 published clips.

## Website reviews

Visitors use `/reviews`, sign in by email, and leave a name, rating and review.
Each account has one review. Submissions and edits go to Pending. In `/admin`,
review the submission and publish or decline it with an explanation. Moderate
for relevance, privacy and abuse, never simply for a low rating.

The homepage displays the latest 12 approved website reviews in a continuous
horizontal strip. It includes pause/resume and direction buttons, pauses on
hover/focus, permits manual scrolling when paused and disables animation when
reduced motion is requested. No fake reviews or ratings are included. The strip
starts animating once there are at least two real approved reviews.

## Google Maps reviews

Set these to Rahul's actual Google Business Profile links and rebuild:

- `NEXT_PUBLIC_GOOGLE_MAPS_URL`: public profile/read-reviews link.
- `NEXT_PUBLIC_GOOGLE_REVIEW_URL`: Google Business Profile → Read reviews →
  Get more reviews → copy the review link.

This version adds direct Read Google reviews / Review on Google links. Google
handles its own sign-in and review submission. Website reviews stay on this
website. **Google review text is not currently imported into the scrolling
strip.** Displaying Google review cards on-site would require a configured
Google Places API integration or an approved widget, with attribution; no
scraping or fabricated Google ratings are used here.

## Design and image editing

- `src/components/hero.tsx`: edge-to-edge hero with bottom fade and scroll fade.
- `src/components/header.tsx`: full-width top navbar → blurred floating capsule.
- `src/app/globals.css`: colours, spacing, mobile cards, capsule and animations.
- `src/components/community.tsx`: class moments and moving website reviews.
- `src/lib/site-images.ts`: the image registry. Replace files in `public/images`
  or edit their paths and crop positions in this file.
- Images are generated guitar illustrations/photos, not real student footage.

## Checks and preview

```sh
npm run typecheck
node --test tests/community.test.cjs
npm run build:app
npm run build
```

The `static-preview/` folder included in the ZIP is ready to serve with any
static server. For example `python3 -m http.server 8080 --directory static-preview`
then open http://localhost:8080. Do not open nested pages via file:// URLs.

Verified here: TypeScript, production compilation, static export, and review /
clip access-control tests. Real Supabase uploads, email sign-in, payment flows
and browser/device rendering still need verification in your configured host.

## Before admissions or payments go live

Keep `ADMISSIONS_ENABLED=false` until real batches, owner-approved policies,
Razorpay test payments and webhook verification are complete. Existing lesson
fees and first-month-only payment behaviour are preserved. See README.md and
CLIENT-REQUIREMENTS-UPDATE.md for those original requirements. Account/payment
credentials and a real Google profile are not included in this package.
