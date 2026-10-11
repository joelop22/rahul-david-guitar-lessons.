import {redirect} from 'next/navigation';
import {authenticatedUser,userClient} from '@/lib/supabase';
import {StudentAccount} from './student-account';
import {Footer} from '@/components/footer';
export const dynamic='force-dynamic';
export const metadata={title:'Student account',robots:{index:false,follow:false}};
export default async function Account(){
 const user=await authenticatedUser();if(!user)redirect('/login?next=/student/account');
 const client=await userClient();const {data,error}=await client.from('student_usernames').select('username').eq('user_id',user.id).maybeSingle();
 return <><main id="main-content" className="page-width page-intro student-account"><p className="eyebrow">Your student space</p><h1>Your account.</h1><p>Choose a username and manage your password.</p><StudentAccount email={user.email||''} username={data?.username||''} usernamesReady={!error}/></main><Footer/></>;
}
