# Replacing the website images

All four images are separate from the page text, buttons and rounded styling.
Both the Next.js app and the private preview use `src/lib/site-images.ts`.

| Image | File | Crop focus |
| --- | --- | --- |
| Home hero / login | `public/images/hero-guitar.webp` | Right side; leave space for the headline on desktop |
| Beginner course | `public/images/beginner-guitar.webp` | Picking hand and acoustic guitar |
| Intermediate course / About | `public/images/intermediate-guitar.webp` | Fretting hand |
| Advanced course | `public/images/advanced-guitar.webp` | Electric guitar and hands |

Replace the matching file to keep all page references. Or add a new file to
`public/images` and change its `src` in `src/lib/site-images.ts`. Update the
image description (`alt`), dimensions, and `position` if the composition changes.
The current photos are generated placeholders, not portraits of Rahul.

Landscape images of at least 1600 px wide work well for the hero; course
photographs should be at least 1000 px wide. Keep the subject clear in both
landscape and square crops. Rounded corners and the hero shading come from
CSS, so they automatically apply to replacement photos.

## Run and build

- `npm run dev`: the full Next.js app, with its original provider integrations.
- `npm run typecheck`: check application TypeScript.
- `npm run build`: export a private UI preview to `dist` from the shared UI.
- `npm run build:app`: build the full Next.js app for a configured deployment.
- `npm start`: run the full app after `npm run build:app`.

The private preview includes the homepage, courses, admission form, student
login and policy views. Course links, mobile navigation, lesson-format tabs,
FAQs and admission form fields work. Sign-in, admissions and payments stay
unavailable in that preview. No student data is submitted or stored there.

The full application retains the existing Supabase, Razorpay, enrollment,
private tutorial and owner upload code. Its existing setup requirements and
`ADMISSIONS_ENABLED` guard still apply. No backend credentials were added.
