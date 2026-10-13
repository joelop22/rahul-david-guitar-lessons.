import {z} from 'zod';
const id=z.string().uuid(),text=z.string().trim().max(2000),date=z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v=>!Number.isNaN(Date.parse(v))&&new Date(v).toISOString().slice(0,10)===v,'Enter a valid date.');
export const profileInput=z.object({action:z.literal('profile'),studentId:id,fullName:z.string().trim().min(2).max(120),goals:text,level:z.enum(['beginner','intermediate','advanced']),joiningDate:date}).strict();
export const portalInput=z.discriminatedUnion('action',[
 profileInput,
 z.object({action:z.literal('link'),studentId:id,email:z.string().trim().email().max(150)}).strict(),
 z.object({action:z.literal('course'),studentId:id,courseId:id,startedOn:date}).strict(),
 z.object({action:z.literal('dates'),recordId:id,startedOn:date}).strict(),
 z.object({action:z.literal('training'),recordId:id,status:z.enum(['active','paused'])}).strict(),
 z.object({action:z.literal('access'),recordId:id,status:z.enum(['active','suspended','revoked'])}).strict(),
 z.object({action:z.literal('complete'),recordId:id,completedOn:date,confirmed:z.literal(true)}).strict(),
 z.object({action:z.literal('session'),recordId:id,date,attendance:z.enum(['present','absent','excused']),feedback:text,privateNotes:text}).strict(),
 z.object({action:z.literal('skill'),recordId:id,skill:z.string().trim().min(2).max(80),level:z.number().int().min(0).max(3),date,feedback:text}).strict(),
 z.object({action:z.literal('assignment'),recordId:id,title:z.string().trim().min(2).max(160),instructions:text,dueOn:date.optional(),lessonId:id.optional()}).strict(),
 z.object({action:z.literal('review'),assignmentId:id,feedback:text}).strict(),
 z.object({action:z.literal('practice'),assignmentId:id}).strict(),
 z.object({action:z.literal('recording'),assignmentId:id,key:z.string().max(300)}).strict(),
 z.object({action:z.literal('avatar'),studentId:id,key:z.string().max(300)}).strict(),
]);
export const uploadInput=z.object({kind:z.enum(['avatar','recording']),studentId:id,assignmentId:id.optional(),mime:z.enum(['image/jpeg','image/png','image/webp','video/mp4','video/webm']),size:z.number().int().positive().max(50000000)}).strict();
export const skillLabels=['Not started','Practising','Improving','Confident'];
export function studyPeriod(start:string,finish:string){const a=start.slice(0,4),b=finish.slice(0,4);return a===b?a:`${a}–${b.slice(-2)}`;}
export function roundedMilestone(count:number){return Math.max(0,Math.floor(count/5)*5);}
export const certificateBrand={studio:'Rahul David Guitar Lessons',tutor:'Rahul David',location:'Elamakkara, Kochi',signature:'/images/certificate-signature.png',signatureEnabled:false};
// Keep this fixed template configuration in source. Issuance snapshots it.
export type PortalCourse={id:string;student_id:string;course_id:string;started_on:string;completed_on:string|null;training_status:string;access_status:string;course:{name:string}|null};
export type PortalData={admin:boolean;student:{id:string;account_id:string|null;full_name:string;avatar_key:string|null;avatar_url:string|null;goals:string;learning_level:string;joining_date:string};enquiry:Record<string,unknown>|null;courses:PortalCourse[];catalog:{id:string;name:string}[];sessions:Record<string,unknown>[];skills:Record<string,unknown>[];assignments:Record<string,unknown>[];certificates:Record<string,unknown>[];lessons:{id:string;title:string;course_id:string}[];completedLessons:number;completedClasses:number};
