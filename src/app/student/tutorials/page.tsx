import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, BookOpen, LockKeyhole, PlayCircle } from 'lucide-react';
import { authenticatedUser, adminClient, configured } from '@/lib/supabase';
import { Footer } from '@/components/footer';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'My tutorial library' };

export default async function Tutorials() {
  const user = await authenticatedUser();
  if (!user) return <Gate title="Your lessons start here." description="Sign in to see the private lessons for your paid course." href="/login?next=/student/tutorials" action="Student sign-in"/>;
  if (!configured()) return <Gate title="Tutorial access is being set up." description="The learning portal isn't connected yet. You can explore the public courses in the meantime." href="/courses" action="View courses"/>;

  const db = adminClient();
  const { data: enrollments } = await db.from('enrollments').select('course_id,status,course:courses(name)').eq('profile_id', user.id).eq('status', 'active');
  if (!enrollments?.length) return <Gate title="No active courses yet." description="Once your class payment is verified, your enrolled course tutorials will appear here." href="/join" action="Join a class"/>;

  const courseIds = enrollments.map(e => e.course_id);
  const { data: modules } = await db.from('tutorial_modules').select('id,title,description,course_id,sort_order,course:courses(name)').in('course_id', courseIds).eq('is_published', true).order('sort_order');
  const moduleIds = (modules || []).map(m => m.id);
  const { data: lessons } = moduleIds.length
    ? await db.from('tutorial_lessons').select('id,module_id,title,description,duration_seconds,sort_order').in('module_id', moduleIds).eq('is_published', true).order('sort_order')
    : { data: [] };

  return <>
    <main id="main-content" className="mx-auto max-w-7xl px-5 py-16 md:px-9 md:py-24">
      <p className="eyebrow">Student library</p><Link className="text-link" href="/student/account">Manage account</Link>
      <h1 className="section-title mt-5 text-[clamp(2.45rem,5vw,4rem)]">Your music.<br/><span className="text-[#edac50]">Your next lesson.</span></h1>
      <p className="body-muted mt-5 max-w-2xl text-sm sm:text-base">Continue learning with the guitar tutorials included in your enrollment.</p>
      <div className="mt-7 flex flex-wrap gap-2">{enrollments.map(e => <span key={e.course_id} className="border border-[#3b4554] bg-[#1e2935] px-4 py-2 text-xs font-medium text-[#dae6f7]">{Array.isArray(e.course) ? e.course[0]?.name : (e.course as {name:string} | null)?.name || 'Guitar course'} · Active</span>)}</div>
      {modules?.length ? <div className="mt-12 grid gap-5 md:grid-cols-2">{modules.map(module => {
        const related = (lessons || []).filter(l => l.module_id === module.id);
        return <article className="dark-panel rounded-xl p-6 sm:p-8" key={module.id}>
          <div className="flex items-center justify-between"><BookOpen size={20} className="text-[#edac50]"/><span className="text-xs text-[#8d939b]">{related.length} lessons</span></div>
          <h2 className="mt-9 font-sans text-2xl font-medium tracking-[-.04em]">{module.title}</h2>
          {module.description && <p className="body-muted mt-3 text-sm">{module.description}</p>}
          <div className="mt-7 divide-y divide-[#343737] border-t border-[#343737]">{related.map((lesson, i) => <Link key={lesson.id} href={`/student/tutorials/${lesson.id}`} className="flex items-center justify-between gap-3 py-4 text-sm transition hover:text-[#edac50]"><span className="flex min-w-0 items-center gap-3"><PlayCircle className="shrink-0 text-[#aabbd6]" size={18}/><span className="truncate">{i + 1}. {lesson.title}</span></span><ArrowRight className="shrink-0" size={16}/></Link>)}{!related.length && <p className="py-5 text-sm text-[#a3a6ac]">New lessons coming soon.</p>}</div>
        </article>;
      })}</div> : <div className="dark-panel mt-12 rounded-xl p-10 text-center"><BookOpen className="mx-auto text-[#edac50]" size={30}/><h2 className="mt-5 font-sans text-2xl font-medium">You&apos;re enrolled.</h2><p className="body-muted mx-auto mt-3 max-w-md text-sm">Rahul hasn’t published tutorials for your course yet. Check back when new lessons are ready.</p></div>}
    </main>
    <Footer />
  </>;
}

function Gate({ title, description, href, action }: { title: string; description: string; href: string; action: string }) {
  return <><main className="mx-auto max-w-xl px-5 py-20 text-center md:py-28">
    <LockKeyhole className="mx-auto text-[#edac50]" size={32}/>
    <h1 className="section-title mt-6 text-4xl">{title}</h1>
    <p className="body-muted mt-5 text-sm">{description}</p>
    <Link className="text-link mt-5" href="/student/account">Manage student account</Link>
    <Link className="button-primary mt-8" href={href}>{action} <ArrowRight size={16}/></Link>
  </main><Footer/></>;
}
