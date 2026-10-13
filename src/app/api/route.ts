import {canAccessCourse} from '@/lib/portal-server';
import {NextResponse} from 'next/server';
import {adminClient,authenticatedUser,configured} from '@/lib/supabase';
import {failure} from '@/lib/http';
export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}){
 if(!configured())return failure('Lesson service is not configured',503);
 const user=await authenticatedUser();if(!user)return failure('Please sign in',401);
 const {id}=await params;const db=adminClient();
 const {data:lesson}=await db.from('tutorial_lessons').select('video_key,is_published,module:tutorial_modules(course_id,is_published)').eq('id',id).maybeSingle();
 const lessonModule=Array.isArray(lesson?.module)?lesson?.module[0]:lesson?.module;
 if(!lesson?.is_published||!lessonModule?.is_published)return failure('Lesson not found',404);
 if(!await canAccessCourse(user.id,lessonModule.course_id))return failure('Active course access is required',403);
 const {data,error}=await db.storage.from('tutorial-videos').createSignedUrl(lesson.video_key,1800);
 if(error||!data?.signedUrl)return failure('Private video is not available',404);
 return NextResponse.json({url:data.signedUrl},{headers:{'Cache-Control':'no-store, private'}});
}
