import {adminClient,authenticatedUser,requireOwner} from '@/lib/supabase';
import {failure,noStore} from '@/lib/http';
export async function GET(request:Request){const isAdmin=new URL(request.url).pathname.startsWith('/api/admin/portal');const owner=isAdmin?await requireOwner():null,user=isAdmin?owner:await authenticatedUser();if(!user)return failure('Sign in first',401);const db=adminClient();const id=new URL(request.url).searchParams.get('assignment');
 const {data:a}=await db.from('portal_assignments').select('student_id,recording_key').eq('id',id||'').maybeSingle();if(!a)return failure('Recording not found',404);
 const {data:s}=await db.from('portal_students').select('account_id').eq('id',a.student_id).maybeSingle();if(!owner&&s?.account_id!==user.id)return failure('Recording not found',404);if(!a.recording_key)return failure('No recording submitted',404);
 const {data,error}=await db.storage.from('student-files').createSignedUrl(a.recording_key,600);if(error||!data)return failure('Recording unavailable',404);return noStore({url:data.signedUrl});}
