import {z} from 'zod';
import {adminClient,authenticatedUser} from '@/lib/supabase';
import {canAccessCourse} from '@/lib/portal-server';
import {failure,noStore,parseJson} from '@/lib/http';
export async function POST(request:Request){if(request.headers.get('origin')!==new URL(request.url).origin)return failure('Request not allowed',403);const user=await authenticatedUser();if(!user)return failure('Sign in first',401);const input=z.object({lessonId:z.string().uuid()}).strict().safeParse(await parseJson(request));if(!input.success)return failure('Invalid lesson',400);const db=adminClient();
 const {data:l}=await db.from('tutorial_lessons').select('is_published,module:tutorial_modules(course_id,is_published)').eq('id',input.data.lessonId).maybeSingle();const m=Array.isArray(l?.module)?l.module[0]:l?.module;if(!l?.is_published||!m?.is_published||!await canAccessCourse(user.id,m.course_id))return failure('Active course access required',403);
 const {error}=await db.from('lesson_progress').upsert({profile_id:user.id,lesson_id:input.data.lessonId,completed_at:new Date().toISOString()},{onConflict:'profile_id,lesson_id'});if(error)return failure('Could not save progress',503);return noStore({ok:true});}
