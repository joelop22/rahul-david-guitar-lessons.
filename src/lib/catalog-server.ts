import {adminClient,configured} from "@/lib/supabase";
import type {Batch,Course} from "@/lib/catalog";
export async function liveCourses():Promise<Course[]>{
 if(!configured())return [];
 const client=adminClient();
 const [{data:cs,error:ce},{data:bs,error:be}]=await Promise.all([
  client.from('courses').select('id,name,slug,level,description,is_active').eq('is_active',true).order('sort_order'),
  client.from('batches').select('id,course_id,mode,label,schedule_description,fee_paise,capacity,is_active').eq('is_active',true).order('label')
 ]);
 if(ce||be)throw new Error('Could not load courses and batches');
 return (cs??[]).map((course)=>({...course,batches:(bs??[]).filter((b)=>b.course_id===course.id) as Batch[]})) as Course[];
}
