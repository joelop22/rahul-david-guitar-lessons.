/** Replace photos here, or overwrite the corresponding files in public/images.
 * Keep text, overlays and rounded clipping in the UI. Update alt and position
 * when replacing a photo. Both the Next app and private preview use this map. */
export const siteImages = {
  hero: { src: '/images/hero-guitar.webp', alt: 'Hands playing a wooden acoustic guitar in a softly lit teaching studio', position: '70% 50%', mobilePosition: '75% 50%', width: 1672, height: 941 },
  beginner: { src: '/images/beginner-guitar.webp', alt: 'A picking hand practising on an acoustic guitar', position: '50% 50%', mobilePosition: '50% 50%', width: 1536, height: 1024 },
  intermediate: { src: '/images/intermediate-guitar.webp', alt: 'A fretting hand practising a chord on an acoustic guitar neck', position: '65% 50%', mobilePosition: '65% 50%', width: 1536, height: 1024 },
  advanced: { src: '/images/advanced-guitar.webp', alt: 'Hands practising lead technique on a black electric guitar', position: '50% 50%', mobilePosition: '50% 50%', width: 1536, height: 1024 },
} as const;
export type SiteImageKey = keyof typeof siteImages;
