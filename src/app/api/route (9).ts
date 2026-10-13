import {randomUUID} from 'node:crypto';
import {adminClient,authenticatedUser,requireOwner} from '@/lib/supabase';
import {failure,noStore,parseJson} from '@/lib/http';
import {uploadInput} from '@/lib/portal';
export async function POST(request:Request){
 if(request.headers.get('origin')!==new URL(request.url).origin)return failure('Request not allowed',403);
 const isAdmin=new URL(request.url).pathname.startsWith('/api/admin/portal');const owner=isAdmin?await requireOwner():null,user=isAdmin?owner:await authenticatedUser();if(!user)return failure('Sign in first',401);
 const parsed=uploadInput.safeParse(await parseJson(request));if(!parsed.success)return failure('Choose a supported file under 50 MB',400);const x=parsed.data,db=adminClient();
 const {data:student}=await db.from('portal_students').select('account_id').eq('id',x.studentId).maybeSingle();if(!student||!owner&&student.account_id!==user.id)return failure('Student not found',404);
 if(x.kind==='avatar'&&(!x.mime.startsWith('image/')||x.size>5000000))return failure('Choose a JPG, PNG or WebP photo under 5 MB',400);
 if(x.kind==='recording'){const {data:a}=await db.from('portal_assignments').select('id,reviewed_at').eq('id',x.assignmentId||'00000000-0000-0000-0000-000000000000').eq('student_id',x.studentId).maybeSingle();if(!a||a.reviewed_at||!x.mime.startsWith('video/'))return failure('Choose an unreviewed assignment and an MP4/WebM recording',400);}
 const extension=({'image/jpeg':'jpg','image/png':'png','image/webp':'webp','video/mp4':'mp4','video/webm':'webm'} as const)[x.mime];
 const key=`${x.studentId}/${x.kind==='avatar'?'avatars':`recordings/${x.assignmentId}`}/${randomUUID()}.${extension}`;
 const {data,error}=await db.storage.from('student-files').createSignedUploadUrl(key);if(error||!data)return failure('Private file storage is unavailable',503);return noStore({key,token:data.token});
}
