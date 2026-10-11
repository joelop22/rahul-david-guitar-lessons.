# Tutor profile update

Replace the old “A little practice. A little more you.” About section with a dedicated Rahul David tutor profile.

Extract this update into G:\rdgl and replace matching files, then commit and push to GitHub for Vercel to deploy. This update changes only the tutor section; it does not change login, Supabase or payments.

## Add Rahul's portrait

1. Upload the real portrait to `public/images/rahul-david.jpg` (or a PNG/WebP with its actual extension).
2. Edit `src/lib/tutor-profile.ts`:

```ts
portrait: '/images/rahul-david.jpg',
```

3. Change `portraitPosition` if the face needs a different crop, for example `'50% 25%'`.
4. Edit `biography`, `role`, `location` and `formats` in the same file. Add experience or qualifications only after Rahul confirms them.
5. Commit the photo and source update to main. Vercel will deploy them.

Until the real portrait is added, the section uses an RD monogram. It does not show an invented portrait or invented years of experience. Existing course photos remain separate.

If updating through GitHub's website, retain these exact paths:
- src/app/page.tsx
- src/app/globals.css
- src/components/tutor-profile.tsx (new)
- src/lib/tutor-profile.ts (new)

Use Add file → Create new file with the complete path for new files. No database changes or environment variables are needed.
