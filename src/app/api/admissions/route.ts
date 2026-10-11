import {z} from 'zod';
import {authenticatedUser,adminClient,configured} from '@/lib/supabase';
import {failure,noStore,parseJson} from '@/lib/http';
import {classModes,isClassMode} from '@/lib/class-modes';
const schema=z.object({
 studentName:z.string().trim().min(2).max(120),
 phone:z.string().trim().regex(/^[+0-9 ()-]{8,20}$/),
 email:z.string().email().max(150),
 age:z.number().int().min(1).max(120),
 guardianName:z.string().trim().max(120).optional(),
 guardianPhone:z.string().trim().max(20).optional(),
 experienceLevel:z.enum(['beginner','intermediate','advanced']),
 courseId:z.string().uuid(), batchId:z.string().uuid(),
 preferredLanguage:z.enum(['malayalam','english']),
 preferredDays:z.string().trim().min(2).max(180),
 preferredTime:z.string().trim().min(2).max(180),
 homeAddress:z.string().trim().max(600).optional(),
 musicalGoals:z.string().trim().max(1200).optional(),
 termsAccepted:z.literal(true),
}).superRefine((input,ctx)=>{
 if(input.age<18&&(!input.guardianName||!input.guardianPhone||!/^[+0-9 ()-]{8,20}$/.test(input.guardianPhone)))
  ctx.addIssue({code:'custom',path:['guardianName'],message:'Parent or guardian name and phone are required for minors'});
});
export async function POST(request:Request){
 if(!configured()||process.env.ADMISSIONS_ENABLED!=='true')return failure('Admissions are not enabled yet',503);
 const user=await authenticatedUser();if(!user)return failure('Sign in to join a class',401);
 const parsed=schema.safeParse(await parseJson(request));if(!parsed.success)return failure(parsed.error.issues[0]?.message||'Please complete all required fields',400);
 const input=parsed.data;
 if(user.email?.toLowerCase()!==input.email.toLowerCase())return failure('Use your verified account email for admission',403);
 const db=adminClient();
 const {data:batch,error:be}=await db.from('batches').select('id,course_id,mode,label,fee_paise,is_active,capacity,course:courses(id,name,is_active)').eq('id',input.batchId).maybeSingle();
 if(be||!batch||!batch.is_active||batch.course_id!==input.courseId||!isClassMode(batch.mode))return failure('This class option is not available',409);
 const course=Array.isArray(batch.course)?batch.course[0]:batch.course;
 if(!course||!course.is_active)return failure('This course is not accepting registrations',409);
 if(batch.fee_paise!==classModes[batch.mode].feePaise)return failure('Fee configuration needs owner review before checkout',409);
 if(batch.mode==='home'&&(!input.homeAddress||input.homeAddress.length<10))return failure('A full home address is required for home tuition');
 if(batch.capacity!==null){const {count}=await db.from('admissions').select('id',{count:'exact',head:true}).eq('batch_id',batch.id).eq('status','paid');if((count||0)>=batch.capacity)return failure('This class option is full',409)}
 // Reusing an admission makes a second visit possible after a home tuition quote is approved.
 const {data:existing}=await db.from('admissions').select('id,admission_number,amount_due_paise,status,travel_charge_paise').eq('user_id',user.id).eq('batch_id',batch.id).in('status',['awaiting_quote','pending_payment','paid']).order('created_at',{ascending:false}).limit(1).maybeSingle();
 if(existing)return noStore({admissionId:existing.id,admissionNumber:existing.admission_number,amountPaise:existing.amount_due_paise,travelChargePaise:existing.travel_charge_paise,status:existing.status});
 const status=batch.mode==='home'?'awaiting_quote':'pending_payment';
 const {data,error}=await db.from('admissions').insert({
  user_id:user.id,student_name:input.studentName,phone:input.phone,email:input.email,
  age:input.age,guardian_name:input.age<18?input.guardianName:null,guardian_phone:input.age<18?input.guardianPhone:null,
  experience_level:input.experienceLevel,preferred_language:input.preferredLanguage,
  preferred_days:input.preferredDays,preferred_time:input.preferredTime,
  home_address:batch.mode==='home'?input.homeAddress:null,musical_goals:input.musicalGoals||null,
  course_id:course.id,batch_id:batch.id,course_name_snapshot:course.name,batch_label_snapshot:batch.label,
  mode_snapshot:batch.mode,base_fee_paise:batch.fee_paise,amount_due_paise:batch.fee_paise,
  status,terms_accepted_at:new Date().toISOString(),
 }).select('id,admission_number,amount_due_paise,travel_charge_paise,status').single();
 if(error||!data)return failure('Could not save the registration. Please try again.',500);
 return noStore({admissionId:data.id,admissionNumber:data.admission_number,amountPaise:data.amount_due_paise,travelChargePaise:data.travel_charge_paise,status:data.status},201);
}
