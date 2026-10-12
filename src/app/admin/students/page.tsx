import Link from 'next/link';
import {redirect} from 'next/navigation';
import {requireOwner} from '@/lib/supabase';
import {StudentsManager} from './students-manager';
import {AdminSignOut} from '../sign-out';
import {Footer} from '@/components/footer';
export const dynamic='force-dynamic';
export const metadata={title:'Students and enquiries',robots:{index:false,follow:false}};
export default async function Students(){if(!await requireOwner())redirect('/admin/login');return <><main id="main-content" className="page-width page-intro"><div className="admin-topbar"><Link className="text-link" href="/admin">Back to your studio</Link><AdminSignOut/></div><p className="eyebrow mt-7">Students</p><h1>Enquiries &amp; students.</h1><p>Follow up on class enquiries, then move confirmed students to Taken.</p><StudentsManager/></main><Footer/></>;}
