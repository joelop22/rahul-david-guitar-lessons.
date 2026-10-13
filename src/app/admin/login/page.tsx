import {redirect} from 'next/navigation';
import {requireOwner} from '@/lib/supabase';
import {adminLoginConfigured} from '@/lib/admin-config';
import {AdminLoginView} from '@/components/admin-login-view';
export const dynamic='force-dynamic';
export const metadata={title:'Admin sign-in',robots:{index:false,follow:false}};
export default async function AdminLogin(){if(await requireOwner())redirect('/admin/students');return <AdminLoginView configured={adminLoginConfigured()}/>;}
