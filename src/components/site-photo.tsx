import type { CSSProperties } from 'react';
import { siteImages, type SiteImageKey } from '@/lib/site-images';
export function SitePhoto({ image, className = '', priority = false }: { image: SiteImageKey; className?: string; priority?: boolean }) {
  const photo = siteImages[image];
  return <img src={photo.src} alt={photo.alt} width={photo.width} height={photo.height} className={className} style={{ objectPosition: photo.position, '--photo-mobile-position': photo.mobilePosition } as CSSProperties} loading={priority ? 'eager' : 'lazy'} fetchPriority={priority ? 'high' : 'auto'} decoding="async" />;
}
