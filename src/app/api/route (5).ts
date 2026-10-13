import {adminClient,requireOwner} from '@/lib/supabase';
import {enquiryStatusInput} from '@/lib/enquiries';
import {failure,noStore,parseJson} from '@/lib/http';
export async function GET(request:Request){
 if(!await requireOwner())return failure('Admin access required',403);
 const params=new URL(request.url).searchParams,status=params.get('status')||'enquired',page=Number(params.get('page')||0);
 if(!['enquired','taken'].includes(status)||!Number.isInteger(page)||page<0||page>10000)return failure('Invalid student list request',400);
 const search=(params.get('search')||'').slice(0,120).replace(/[,%_().]/g,'');
 const db=adminClient();
 const {data:matching}=search&&status==='taken'?await db.from('portal_students').select('id').ilike('full_name',`%${search}%`).limit(500):{data:[]};
 let query=db.from('student_enquiries').select('*',{count:'exact'}).eq('status',status);if(search)query=matching?.length?query.or(`student_name.ilike.%${search}%,id.in.(${matching.map(p=>p.id).join(',')})`):query.ilike('student_name',`%${search}%`);
 const {data,error,count}=await query.order('created_at',{ascending:false}).order('id').range(page*25,page*25+24);
 if(error)return failure('Students could not be loaded. Apply the enquiry migration if this is a new setup.',503);
 let students=data||[];
 if(status==='taken'&&students.length){const {data:profiles}=await db.from('portal_students').select('id,full_name,avatar_key').in('id',students.map(s=>s.id));students=await Promise.all(students.map(async s=>{const p=profiles?.find(p=>p.id===s.id);let avatar_url=null;if(p?.avatar_key){const signed=await db.storage.from('student-files').createSignedUrl(p.avatar_key,600);avatar_url=signed.data?.signedUrl||null;}return {...s,student_name:p?.full_name||s.student_name,avatar_url};}));}
 return noStore({students,total:count||0,page});
}
export async function PATCH(request:Request){
 if(request.headers.get('origin')!==new URL(request.url).origin)return failure('Request not allowed',403);
 if(!await requireOwner())return failure('Admin access required',403);
 const parsed=enquiryStatusInput.safeParse(await parseJson(request));if(!parsed.success)return failure('Invalid student status',400);
 const {id,status}=parsed.data;
 const {data,error}=await adminClient().from('student_enquiries').update({status,taken_at:status==='taken'?new Date().toISOString():null,updated_at:new Date().toISOString()}).eq('id',id).select('id,status').maybeSingle();
 if(error)return failure('Could not update student status',503);if(!data)return failure('Student enquiry not found',404);return noStore(data);
}
