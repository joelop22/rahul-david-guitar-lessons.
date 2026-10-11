import { AdminSignOut } from './sign-out';
import { CommunityManager } from './community-manager';
import { communityReady } from '@/lib/community-server';
import { redirect } from 'next/navigation';
import { adminClient, requireOwner } from '@/lib/supabase';
import { AdminEditor } from './admin-editor';
import { TravelQuotes } from './travel-quotes';
import { Footer } from '@/components/footer';

export const dynamic = 'force-dynamic';

export default async function Admin() {
  const owner = await requireOwner();
  if (!owner) redirect('/admin/login');
  const db = adminClient();
  const [{ data: courses }, { data: modules }, { data: quotes }] = await Promise.all([
    db.from('courses').select('id,name').order('sort_order'),
    db.from('tutorial_modules').select('id,title,course_id').order('sort_order'),
    db.from('admissions').select('id,admission_number,student_name,phone,home_address,preferred_days,preferred_time,course_name_snapshot,base_fee_paise').eq('mode_snapshot','home').eq('status','awaiting_quote').order('created_at',{ascending:true}),
  ]);

  return <>
    <main id="main-content" className="mx-auto max-w-5xl px-5 py-16 md:px-9 md:py-24">
      <div className="admin-topbar"><p className="eyebrow">Owner studio</p><AdminSignOut/></div>
      <h1 className="section-title mt-4 text-4xl md:text-5xl">Your teaching studio.</h1>
      <p className="body-muted mt-5 max-w-2xl text-sm sm:text-base">Organise your guitar tutorials into modules and upload short private video lessons. Only paid students enrolled in the corresponding course can play published lessons.</p>
      <CommunityManager enabled={communityReady()}/>
      <h2 className="section-title mt-10">Private tutorials</h2>
      <TravelQuotes quotes={quotes || []}/>
      <AdminEditor courses={courses || []} modules={modules || []}/>
      <p className="status-note mt-7">Current upload limit: 50 MB per MP4/WebM video. Larger lessons and adaptive streaming will need a dedicated video platform.</p>
    </main><Footer/>
  </>;
}
