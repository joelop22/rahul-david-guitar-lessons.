import type { Metadata } from 'next';
import { liveCourses } from '@/lib/catalog-server';
import { previewCourses } from '@/lib/catalog';
import { CoursesView } from '@/components/courses-view';
export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Guitar courses' };
export default async function CoursesPage() {
  const live = await liveCourses().catch(() => []);
  const courses = live.length ? live : previewCourses.map((course, index) => ({ ...course, id: `preview-${index}`, is_active: true, batches: [] }));
  return <CoursesView courses={courses}/>;
}
