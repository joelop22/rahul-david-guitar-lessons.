import {canAccessCourse} from '@/lib/portal-server';
import {LessonCompletion} from '@/components/portal/lesson-completion';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { adminClient, authenticatedUser } from '@/lib/supabase';
import { VideoPlayer } from './video-player';
import { Footer } from '@/components/footer';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Guitar tutorial' };

export default async function LessonPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await authenticatedUser();
  if (!user) redirect('/login?next=/student/tutorials');
  const { id } = await params;
  const db = adminClient();
  const { data: lesson } = await db.from('tutorial_lessons').select('id,title,description,module_id,is_published,module:tutorial_modules(id,title,course_id,is_published)').eq('id', id).maybeSingle();
  if (!lesson || !lesson.is_published) notFound();
  const lessonModule = Array.isArray(lesson.module) ? lesson.module[0] : lesson.module;
  if (!lessonModule || !lessonModule.is_published) notFound();
  if (!await canAccessCourse(user.id,lessonModule.course_id)) redirect('/student/tutorials');
  const {data:progress}=await db.from('lesson_progress').select('completed_at').eq('profile_id',user.id).eq('lesson_id',id).maybeSingle();

  return <>
    <main id="main-content" className="mx-auto max-w-5xl px-5 py-12 md:px-9 md:py-20">
      <Link href="/student/tutorials" className="inline-flex text-sm text-[#edac50] hover:text-white">← Back to tutorials</Link>
      <p className="eyebrow mt-12">{lessonModule.title}</p>
      <h1 className="section-title mt-4 text-4xl md:text-5xl">{lesson.title}</h1>
      {lesson.description && <p className="body-muted mt-5 max-w-2xl text-sm sm:text-base">{lesson.description}</p>}
      <VideoPlayer lessonId={lesson.id}/><LessonCompletion lessonId={lesson.id} completed={!!progress?.completed_at}/>
    </main>
    <Footer />
  </>;
}
