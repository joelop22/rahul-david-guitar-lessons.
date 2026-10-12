import {EnquiryView} from '@/components/enquiry-view';
import {liveCourses} from '@/lib/catalog-server';
import {previewCourses} from '@/lib/catalog';
import {configured} from '@/lib/supabase';
export const dynamic='force-dynamic';
export const metadata={title:'Enquire about guitar classes'};
export default async function Enquire({searchParams}:{searchParams:Promise<{course?:string;mode?:string}>}){
 const params=await searchParams;const live=await liveCourses().catch(()=>[]);
 const courses=live.length?live:previewCourses.map((c,i)=>({...c,id:`preview-${i}`,is_active:true,batches:[]}));
 return <EnquiryView courses={courses} configured={configured()} preferredCourse={params.course} preferredMode={params.mode}/>;
}
