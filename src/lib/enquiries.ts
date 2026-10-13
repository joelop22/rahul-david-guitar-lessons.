import {z} from 'zod';
const phone=z.string().trim().regex(/^[+0-9 ()-]{8,20}$/,'Enter a valid phone number.');
export const enquiryInput=z.object({
 submissionId:z.string().uuid(),studentName:z.string().trim().min(2).max(120),phone,email:z.string().trim().email().max(150),age:z.number().int().min(1).max(120),
 guardianName:z.string().trim().max(120).default(''),guardianPhone:z.string().trim().max(20).default(''),
 experienceLevel:z.enum(['beginner','intermediate','advanced']),courseSlug:z.string().trim().min(1).max(80),batchId:z.string().uuid().optional(),mode:z.enum(['online','offline','home']),
 preferredLanguage:z.enum(['malayalam','english']),preferredDays:z.string().trim().min(2,'Enter your preferred days, such as weekdays or weekends.').max(180),preferredTime:z.string().trim().min(2,'Enter your preferred time, such as 6 PM.').max(180),homeAddress:z.string().trim().max(600).default(''),musicalGoals:z.string().trim().max(1200).default(''),consent:z.literal(true),website:z.literal('').default(''),
}).strict().superRefine((input,ctx)=>{
 if(input.age<18&&(!input.guardianName||!phone.safeParse(input.guardianPhone).success))ctx.addIssue({code:'custom',path:['guardianName'],message:'Parent/guardian name and a valid phone are required for students under 18.'});
 if(input.mode==='home'&&input.homeAddress.length<10)ctx.addIssue({code:'custom',path:['homeAddress'],message:'Enter your full address for home tuition.'});
});
export type EnquiryInput=z.infer<typeof enquiryInput>;
export type EnquiryRecord={id:string;avatar_url?:string|null;student_name:string;phone:string;email:string;age:number;guardian_name:string|null;guardian_phone:string|null;experience_level:string;course_name:string;batch_label:string|null;mode:string;preferred_language:string;preferred_days:string;preferred_time:string;home_address:string|null;musical_goals:string|null;status:'enquired'|'taken';created_at:string;taken_at:string|null};
export function enquiryDetails(record:EnquiryRecord):[string,string][]{return [
 ['Student',record.student_name],['Age',String(record.age)],['Phone',record.phone],['Email',record.email],
 ...(record.age<18?[['Parent / guardian',record.guardian_name||''],['Guardian phone',record.guardian_phone||'']] as [string,string][]:[]),
 ['Course',record.course_name],['Experience',record.experience_level],['Class mode',record.mode==='home'?'Home tuition':record.mode==='offline'?'In person': 'Online'],['Class option',record.batch_label||'To be discussed'],['Preferred language',record.preferred_language],['Preferred days',record.preferred_days],['Preferred time',record.preferred_time],
 ...(record.mode==='home'?[['Home address',record.home_address||'']] as [string,string][]:[]),['Musical goals / favourite songs',record.musical_goals||'Not specified'],
];}
export function enquiryWhatsapp(record:EnquiryRecord,recipient='917994357541'){
 const lines=['Hello Rahul, I would like to enquire about guitar classes.','',`Enquiry reference: ${record.id}`,...enquiryDetails(record).map(([label,value])=>`${label}: ${value}`),'','Please let me know the available class options and next steps.'];
 return `https://wa.me/${recipient.replace(/[^0-9]/g,'')}?text=${encodeURIComponent(lines.join('\n'))}`;
}
export const enquiryStatusInput=z.object({id:z.string().uuid(),status:z.enum(['enquired','taken'])}).strict();
