import {adminClient} from './supabase';
export async function canAccessCourse(account:string,course:string){const db=adminClient();
 const {data:p}=await db.from('portal_students').select('id').eq('account_id',account).maybeSingle();
 if(p){const {data:access}=await db.from('portal_courses').select('access_status').eq('student_id',p.id).eq('course_id',course).maybeSingle();if(access)return access.access_status==='active';}
 const {data:paid}=await db.from('enrollments').select('id').eq('profile_id',account).eq('course_id',course).eq('status','active').limit(1).maybeSingle();return !!paid;
}
export async function fileExists(key:string,mimePrefix:string,maxSize=50000000){const db=adminClient(),slash=key.lastIndexOf('/');const {data,error}=await db.storage.from('student-files').list(key.slice(0,slash),{search:key.slice(slash+1)});return !error&&data?.some(f=>f.name===key.slice(slash+1)&&f.metadata?.mimetype?.startsWith(mimePrefix)&&Number(f.metadata?.size)<=maxSize);}
