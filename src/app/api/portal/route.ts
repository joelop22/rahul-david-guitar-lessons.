import {adminClient,authenticatedUser,requireOwner} from '@/lib/supabase';
import {failure,noStore,parseJson} from '@/lib/http';
import {certificateBrand,portalInput} from '@/lib/portal';
import {fileExists} from '@/lib/portal-server';
async function actor(request:Request){const isAdmin=new URL(request.url).pathname.startsWith('/api/admin/portal');const owner=isAdmin?await requireOwner():null;return {owner,user:isAdmin?owner:await authenticatedUser()};}
export async function GET(request:Request){
 try{
 const requested=new URL(request.url).searchParams.get('student');
 const {owner,user}=await actor(request);if(!user)return failure('Sign in first',401);const db=adminClient();
 let query=db.from('portal_students').select('*');query=owner&&requested?query.eq('id',requested):query.eq('account_id',user.id);
 let {data:student,error}=await query.maybeSingle();
 if(!student&&owner&&requested){const {data:e}=await db.from('student_enquiries').select('*').eq('id',requested).eq('status','taken').maybeSingle();if(e){const created=await db.from('portal_students').upsert({id:e.id,full_name:e.student_name,goals:e.musical_goals||'',learning_level:e.experience_level},{onConflict:'id',ignoreDuplicates:true});if(created.error)throw created.error;const found=await db.from('portal_students').select('*').eq('id',requested).single();student=found.data;error=found.error;}}
 if(error)return failure('Student portal setup is incomplete. Apply the portal migration.',503);if(!student)return noStore({unlinked:true});
 const [{data:enquiry},{data:courses},{data:sessions},{data:skills},{data:assignments},{data:certificates},{data:catalog},{data:modules}]=await Promise.all([
 db.from('student_enquiries').select('*').eq('id',student.id).maybeSingle(),db.from('portal_courses').select('*,course:courses(name)').eq('student_id',student.id).order('started_on'),
 db.from('portal_sessions').select('*').eq('student_id',student.id).order('session_date',{ascending:false}).order('created_at',{ascending:false}).limit(200),
 db.from('portal_skills').select('*').eq('student_id',student.id).order('assessed_on',{ascending:false}).order('created_at',{ascending:false}).limit(200),
 db.from('portal_assignments').select('*').eq('student_id',student.id).order('created_at',{ascending:false}).limit(200),db.from('portal_certificates').select('*').eq('student_id',student.id),
 db.from('courses').select('id,name').eq('is_active',true).order('sort_order'),db.from('tutorial_modules').select('id,course_id').eq('is_published',true)]);
 const courseIds=(courses||[]).filter(c=>owner||c.access_status==='active').map(c=>c.course_id);const visibleModules=(modules||[]).filter(m=>courseIds.includes(m.course_id));
 const {data:lessons}=visibleModules.length?await db.from('tutorial_lessons').select('id,title,module_id').eq('is_published',true).in('module_id',visibleModules.map(m=>m.id)):{data:[]};
 const {count:completedLessons}=student.account_id?await db.from('lesson_progress').select('id',{count:'exact',head:true}).eq('profile_id',student.account_id).not('completed_at','is',null).in('lesson_id',(lessons||[]).map(l=>l.id)):{count:0};
 const {count:completedClasses}=await db.from('portal_sessions').select('id',{count:'exact',head:true}).eq('student_id',student.id).eq('attendance','present');
 let avatar_url=null;if(student.avatar_key){const signed=await db.storage.from('student-files').createSignedUrl(student.avatar_key,600);avatar_url=signed.data?.signedUrl||null;}
 return noStore({admin:!!owner,student:{...student,avatar_url},enquiry,courses: courses||[],sessions:owner?sessions||[]:(sessions||[]).map(({private_notes,...visible})=>{void private_notes;return visible;}),skills:skills||[],assignments:assignments||[],certificates:certificates||[],catalog:owner?catalog||[]:[],lessons:(lessons||[]).map(l=>({...l,course_id:visibleModules.find(m=>m.id===l.module_id)?.course_id})),completedClasses:completedClasses||0,completedLessons:completedLessons||0});
 }catch{return failure('Unable to load the student profile. Check the database setup.',503);}
}
export async function POST(request:Request){
 if(request.headers.get('origin')!==new URL(request.url).origin)return failure('Request not allowed',403);
 try{
 const {owner,user}=await actor(request);if(!user)return failure('Sign in first',401);const parsed=portalInput.safeParse(await parseJson(request));if(!parsed.success)return failure(parsed.error.issues[0]?.message||'Check the form',400);const x=parsed.data,db=adminClient();
 const studentActions=['profile','practice','recording','avatar'];if(!owner&&!studentActions.includes(x.action))return failure('Tutor access required',403);
 let studentId='';let record:Record<string,unknown>|null=null;
 if('studentId' in x)studentId=x.studentId;
 else if('recordId' in x){const r=await db.from('portal_courses').select('*').eq('id',x.recordId).maybeSingle();record=r.data;studentId=r.data?.student_id;}
 else if('assignmentId' in x){const r=await db.from('portal_assignments').select('*').eq('id',x.assignmentId).maybeSingle();record=r.data;studentId=r.data?.student_id;}
 const {data:student}=await db.from('portal_students').select('*').eq('id',studentId||'00000000-0000-0000-0000-000000000000').maybeSingle();if(!student||(!owner&&student.account_id!==user.id))return failure('Student record not found',404);
 let result:{error:unknown;data?:unknown}|undefined;
 switch(x.action){
 case 'profile':result=await db.from('portal_students').update(owner?{full_name:x.fullName,goals:x.goals,learning_level:x.level,joining_date:x.joiningDate}:{full_name:x.fullName,goals:x.goals}).eq('id',student.id);break;
 case 'link':{result=await db.rpc('portal_link_account',{student:student.id,account_email:x.email});break;}
 case 'course':{const {data:c}=await db.from('courses').select('id').eq('id',x.courseId).eq('is_active',true).maybeSingle();if(!c)return failure('Select an active course',400);result=await db.from('portal_courses').upsert({student_id:student.id,course_id:x.courseId,started_on:x.startedOn},{onConflict:'student_id,course_id',ignoreDuplicates:true});break;}
 case 'dates':{if(record?.training_status==='completed')return failure('Issued certificate dates are locked',409);result=await db.from('portal_courses').update({started_on:x.startedOn}).eq('id',x.recordId);break;}
 case 'training':{if(record?.training_status==='completed')return failure('Issued completion is locked. Contact the tutor to correct a certificate.',409);result=await db.from('portal_courses').update({training_status:x.status}).eq('id',x.recordId);break;}
 case 'access':result=await db.rpc('portal_course_access',{record:x.recordId,new_status:x.status});break;
 case 'complete':result=await db.rpc('portal_complete_course',{record:x.recordId,finish_date:x.completedOn,owner_id:owner!.id,template:certificateBrand});break;
 case 'session':if(x.date>new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Kolkata'}))return failure('Class date cannot be in the future',400);result=await db.from('portal_sessions').insert({student_id:student.id,course_record_id:x.recordId,session_date:x.date,attendance:x.attendance,feedback:x.feedback,private_notes:x.privateNotes});break;
 case 'skill':if(x.date>new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Kolkata'}))return failure('Assessment date cannot be in the future',400);result=await db.from('portal_skills').insert({student_id:student.id,course_record_id:x.recordId,skill:x.skill,level:x.level,assessed_on:x.date,feedback:x.feedback});break;
 case 'assignment':{if(x.lessonId){const {data:lesson}=await db.from('tutorial_lessons').select('module:tutorial_modules(course_id)').eq('id',x.lessonId).eq('is_published',true).maybeSingle();const m=Array.isArray(lesson?.module)?lesson.module[0]:lesson?.module;if(m?.course_id!==record?.course_id)return failure('Tutorial must belong to this course',400);}result=await db.from('portal_assignments').insert({student_id:student.id,course_record_id:x.recordId,title:x.title,instructions:x.instructions,due_on:x.dueOn||null,lesson_id:x.lessonId||null});break;}
 case 'review':result=await db.from('portal_assignments').update({feedback:x.feedback,reviewed_at:new Date().toISOString()}).eq('id',x.assignmentId);break;
 case 'practice':{if(record?.reviewed_at)return failure('This assignment has already been reviewed',409);result=await db.from('portal_assignments').update({practiced_at:new Date().toISOString()}).eq('id',x.assignmentId).is('reviewed_at',null).select('id').maybeSingle();if(!result.data&&!result.error)return failure('This assignment was just reviewed. Refresh the page.',409);break;}
 case 'recording':{if(record?.reviewed_at)return failure('This assignment has already been reviewed',409);if(!x.key.startsWith(`${student.id}/recordings/${x.assignmentId}/`)||x.key.includes('..')||!await fileExists(x.key,'video/'))return failure('Upload a valid private recording first',400);result=await db.from('portal_assignments').update({recording_key:x.key,submitted_at:new Date().toISOString()}).eq('id',x.assignmentId).is('reviewed_at',null).select('id').maybeSingle();if(!result.data&&!result.error)return failure('This assignment was just reviewed. Refresh the page.',409);break;}
 case 'avatar':{if(!x.key.startsWith(`${student.id}/avatars/`)||x.key.includes('..')||!await fileExists(x.key,'image/',5000000))return failure('Upload a valid photo first',400);result=await db.from('portal_students').update({avatar_key:x.key}).eq('id',student.id);break;}
 }
 if(result?.error){const e=result.error as {message?:string};return failure(e.message?.includes('unique')?'This account is already linked to another student profile.':e.message||'Could not save',409);}return noStore({ok:true});
 }catch{return failure('Could not save. Check your connection and database setup.',503);}
}
