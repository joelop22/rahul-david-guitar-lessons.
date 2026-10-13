import {redirect} from 'next/navigation';
import {authenticatedUser} from '@/lib/supabase';
import {StudentProfile} from '@/components/portal/profile';
import {Footer} from '@/components/footer';
export const dynamic='force-dynamic';export const metadata={title:'My student dashboard',robots:{index:false,follow:false}};
export default async function Dashboard(){if(!await authenticatedUser())redirect('/login?next=/student/dashboard');return <><main id="main-content" className="page-width page-intro"><StudentProfile/></main><Footer/></>;}
