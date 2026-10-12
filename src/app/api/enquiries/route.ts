import {createHash} from 'node:crypto';
import {adminClient,configured} from '@/lib/supabase';
import {enquiryInput,enquiryWhatsapp,type EnquiryRecord} from '@/lib/enquiries';
import {previewCourses} from '@/lib/catalog';
import {failure,noStore,parseJson} from '@/lib/http';
export async function POST(request:Request){
 if(request.headers.get('origin')!==new URL(request.url).origin)return failure('Request not allowed',403);
 if(!configured())return failure('Enquiries are temporarily unavailable. Please contact Rahul directly.',503);
 const parsed=enquiryInput.safeParse(await parseJson(request));if(!parsed.success)return failure(parsed.error.issues[0]?.message||'Please check your details.',400);
 const input=parsed.data;
 try{
  const db=adminClient();
  const ip=(request.headers.get('x-vercel-forwarded-for')||request.headers.get('x-real-ip')||request.headers.get('x-forwarded-for')||'local').split(',')[0].trim();
  const requestKey=createHash('sha256').update(`${process.env.SUPABASE_SERVICE_ROLE_KEY}|${ip}`).digest('hex');
  const {data:allowed,error:limitError}=await db.rpc('allow_student_enquiry',{request_key:requestKey});
  if(limitError)return failure('Enquiry setup is not complete yet. Please contact Rahul directly.',503);
  if(!allowed)return failure('Too many enquiries. Please try again later or contact Rahul directly.',429);
  const {data:course,error:courseError}=await db.from('courses').select('id,name,is_active').eq('slug',input.courseSlug).maybeSingle();
  if(courseError)return failure('Could not confirm your selected course. Please try again.',503);
  if(course&&!course.is_active)return failure('This course is not accepting enquiries right now.',409);
  const fallback=previewCourses.find(c=>c.slug===input.courseSlug);if(!course&&!fallback)return failure('Select an available course.',400);
  let batch:{id:string;label:string}|null=null;
  if(input.batchId){
   const {data,error}=await db.from('batches').select('id,label,course_id,mode,is_active').eq('id',input.batchId).maybeSingle();
   if(error||!data||!data.is_active||data.course_id!==course?.id||data.mode!==input.mode)return failure('The class option has changed. Please select it again or choose To be discussed.',409);batch=data;
  }
  const record={submission_id:input.submissionId,student_name:input.studentName,phone:input.phone,email:input.email,age:input.age,guardian_name:input.age<18?input.guardianName:null,guardian_phone:input.age<18?input.guardianPhone:null,experience_level:input.experienceLevel,course_name:course?.name||fallback!.name,course_id:course?.id||null,batch_id:batch?.id||null,batch_label:batch?.label||null,mode:input.mode,preferred_language:input.preferredLanguage,preferred_days:input.preferredDays,preferred_time:input.preferredTime,home_address:input.mode==='home'?input.homeAddress:null,musical_goals:input.musicalGoals||null,consent_at:new Date().toISOString()};
  const {data,error}=await db.from('student_enquiries').upsert(record,{onConflict:'submission_id',ignoreDuplicates:true}).select('id').maybeSingle();
  if(error)return failure('Could not save your enquiry. Your details have not been sent to WhatsApp. Please try again.',503);
  let id=data?.id;if(!id){const previous=await db.from('student_enquiries').select('id').eq('submission_id',input.submissionId).single();if(previous.error||!previous.data)return failure('Could not confirm the saved enquiry. Please try again.',503);id=previous.data.id;}
  const whatsapp=enquiryWhatsapp({...record,id,status:'enquired',created_at:'',taken_at:null} as EnquiryRecord,process.env.WHATSAPP_OWNER_NUMBER||'917994357541');
  return noStore({id,whatsapp},201);
 }catch{return failure('Could not save your enquiry. Please try again later.',503);}
}
