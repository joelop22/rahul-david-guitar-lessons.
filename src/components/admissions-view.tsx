import { ArrowUpRight } from 'lucide-react';
import { Footer } from './footer';
import { SitePhoto } from './site-photo';
import { JoinFlow } from '@/app/join/join-flow';
import type { Course } from '@/lib/catalog';

export function AdmissionsView({ courses, preferredCourse = '', preferredMode = 'online', configured = false }: { courses: Course[]; preferredCourse?: string; preferredMode?: string; configured?: boolean }) {
  return <><main id="main-content" className="admission-layout page-width"><div className="admission-intro"><p className="eyebrow">Student admission</p><h1>Your first step<br/>starts here.</h1><p>Find your course, choose your class format and tell Rahul what you’d like to play. Class availability and the full first-month fee are confirmed before payment.</p><div className="admission-photo"><SitePhoto image="beginner"/></div><ol className="admission-steps"><li><span>01</span>Choose your course and class format.</li><li><span>02</span>Share your details and timing preferences.</li><li><span>03</span>Review your confirmed class option and fee.</li></ol><a href="https://wa.me/917994357541?text=Hello%20Rahul%2C%20I%27d%20like%20help%20with%20guitar%20class%20admission." target="_blank" rel="noopener noreferrer" className="text-link">Need a hand? Talk to Rahul <ArrowUpRight size={16}/></a></div><JoinFlow key={`${preferredCourse}-${preferredMode}`} courses={courses} preferredCourse={preferredCourse} preferredMode={preferredMode} configured={configured}/></main><Footer/></>;
}
