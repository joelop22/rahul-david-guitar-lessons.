import Link from 'next/link';
import {LearningCounter} from '@/components/learning-counter';
import { Hero } from '@/components/hero';
import { Community } from '@/components/community';
import { ArrowRight, ArrowUpRight, Plus } from 'lucide-react';
import { CourseCard } from '@/components/course-card';
import { TutorProfile } from '@/components/tutor-profile';
import { Footer } from '@/components/footer';
import { LessonFormats } from '@/components/lesson-formats';
import { previewCourses } from '@/lib/catalog';
const faqs = [
  ['I have never played before. Can I join?', 'Yes. Beginner Guitar starts with holding the instrument, your first chords, simple rhythms and songs. Choose the beginner course when you enquire.'],
  ['Where do the lessons take place?', 'Choose live online lessons, in-person lessons in Elamakkara, Kochi, or home tuition. For home tuition, availability and any travel charges are agreed with Rahul before payment.'],
  ['Can I choose the day and time?', 'You can share your preferred days and time during admission. Rahul will confirm an available class option with you before payment; a preference is not a confirmed booking.'],
  ['How do the monthly fees work?', 'Online lessons are ₹1,800 for four 45-minute lessons. In-person and home tuition are ₹2,000 for four 60-minute lessons, paid in advance. Home tuition may include an agreed travel charge.'],
];
export default function Home() {
  return <><main id="main-content" className="homepage">
    <Hero/>
    <div className="page-width">
    <section id="courses" className="courses-section" aria-labelledby="courses-title"><div className="section-heading"><h2 id="courses-title">A course for every stage.</h2><Link className="quiet-link desktop-only" href="/courses">All courses <ArrowUpRight size={17}/></Link></div><div className="course-grid">{previewCourses.map(course => <CourseCard key={course.slug} title={course.name} slug={course.slug}/>)}</div></section>
    <LessonFormats/>
    <TutorProfile/>
    <LearningCounter/>
    <Community enabled={Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.COMMUNITY_ENABLED === 'true')}/>
    <section className="faq-section section-space"><div><p className="eyebrow">Before your first chord</p><h2>A few good questions.</h2><p>Something else on your mind?<br/><a href="https://wa.me/917994357541?text=Hello%20Rahul%2C%20I%20have%20a%20question%20about%20guitar%20lessons." target="_blank" rel="noopener noreferrer" className="text-link">Ask Rahul <ArrowUpRight size={15}/></a></p></div><div className="faq-list">{faqs.map(([q,a]) => <details key={q}><summary>{q}<Plus size={18} aria-hidden="true"/></summary><p>{a}</p></details>)}</div></section>
    <section className="closing-panel"><div><p className="eyebrow">Your next chapter sounds good</p><h2>Let’s start with a chord.</h2><p>Choose a course. Find your rhythm.</p></div><Link className="button-primary" href="/join">Apply for admission <ArrowRight size={19}/></Link></section>
  </div></main><Footer/></>;
}
