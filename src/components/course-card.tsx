import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { SitePhoto } from './site-photo';
import type { SiteImageKey } from '@/lib/site-images';
export function CourseCard({ title, slug }: { title: string; slug: string }) {
  return <article className="course-card"><Link href={`/courses#${slug}`} className="course-card-link" aria-label={`View ${title}`}><div className="course-card-image"><SitePhoto image={slug as SiteImageKey} /></div><div className="course-card-copy"><h3>{title}</h3><span className="text-link">View course <ArrowRight size={18} aria-hidden="true" /></span></div></Link></article>;
}
