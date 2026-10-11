import type { Metadata } from 'next';
import { liveCourses } from '@/lib/catalog-server';
import { previewCourses } from '@/lib/catalog';
import { AdmissionsView } from '@/components/admissions-view';
export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Apply for admission' };
export default async function JoinPage({ searchParams }: { searchParams: Promise<{ course?: string; mode?: string }> }) {
  const live = await liveCourses().catch(() => []);
  const params = await searchParams;
  const configured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET && process.env.ADMISSIONS_ENABLED === 'true');
  const courses = live.length ? live : previewCourses.map((course, index) => ({ ...course, id: `preview-${index}`, is_active: true, batches: [] }));
  return <AdmissionsView courses={courses} preferredCourse={params.course} preferredMode={params.mode} configured={configured}/>;
}
