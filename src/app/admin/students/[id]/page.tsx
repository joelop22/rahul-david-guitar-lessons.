import {redirect} from 'next/navigation';
import Link from 'next/link';
import {requireOwner} from '@/lib/supabase';
import {StudentProfile} from '@/components/portal/profile';
import {Footer} from '@/components/footer';
export const dynamic='force-dynamic';export const metadata={title:'Student profile',robots:{index:false,follow:false}};
export default async function Profile({params}:{params:Promise<{id:string}>}){if(!await requireOwner())redirect('/admin/login');const {id}=await params;return <><main id="main-content" className="page-width page-intro"><Link className="text-link" href="/admin/students">← Students</Link><StudentProfile studentId={id} admin/></main><Footer/></>;}
