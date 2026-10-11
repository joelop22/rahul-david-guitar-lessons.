import Link from 'next/link';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { Footer } from './footer';
import { SitePhoto } from './site-photo';
import { LessonFormats } from './lesson-formats';
import { money, type Course } from '@/lib/catalog';
import type { SiteImageKey } from '@/lib/site-images';

const topics: Record<string, string[]> = {
  beginner: ['First chords', 'Strumming', 'Chord changes', 'Favourite songs'],
  intermediate: ['Rhythm & control', 'Music theory', 'Confident playing'],
  advanced: ['Technique', 'Phrasing', 'Musical expression'],
};

export function CoursesView({ courses }: { courses: Course[] }) {
  return <><main id="main-content" className="page-width course-page"><header className="page-intro"><p className="eyebrow">Find your starting point</p><h1>A course for every stage.</h1><p>From your first chord to a sound of your own. Find the course that meets you where you are, then choose how you’d like to learn.</p><nav className="course-jumps" aria-label="Course levels">{courses.map(course => <a key={course.slug} href={`#${course.slug}`}>{course.name.replace(' Guitar', '')}</a>)}</nav></header>
    <div className="course-detail-list">{courses.map((course, index) => {
      const image: SiteImageKey = ['beginner','intermediate','advanced'].includes(course.slug) ? course.slug as SiteImageKey : 'beginner';
      return <article id={course.slug} key={course.id} className="course-detail"><div className="course-detail-photo"><SitePhoto image={image} priority={index === 0}/></div><div className="course-detail-copy"><p className="eyebrow">{String(index + 1).padStart(2, '0')} / {course.level}</p><h2>{course.name}</h2><p>{course.description}</p><ul className="course-topics">{(topics[course.slug] || ['Guitar technique', 'Practice & songs']).map(topic => <li key={topic}>{topic}</li>)}</ul><Link href={`/join?course=${encodeURIComponent(course.slug)}`} className="button-primary">Choose this course <ArrowRight size={17}/></Link><div className="course-schedule">{course.batches?.length ? <><h3>Available class options</h3><ul>{course.batches.map(batch => <li key={batch.id}><Link href={`/join?course=${encodeURIComponent(course.slug)}&mode=${batch.mode}`}>{batch.label} · {money(batch.fee_paise)} / month <ArrowUpRight size={13} style={{ display: 'inline' }}/></Link><p>{batch.schedule_description || 'Timing confirmed with Rahul before payment.'}</p></li>)}</ul></> : <p>Contact Rahul to confirm the next available class.<br/><a href={`https://wa.me/917994357541?text=${encodeURIComponent(`Hello Rahul, I am interested in ${course.name}. Could you share your available class options?`)}`} target="_blank" rel="noopener noreferrer">Ask about availability ↗</a></p>}</div></div></article>;
    })}</div><LessonFormats/></main><Footer/></>;
}
