export const previewCourses=[
 {slug:"beginner",name:"Beginner Guitar",level:"beginner",description:"Your first chords, smooth transitions, strumming and favourite songs."},
 {slug:"intermediate",name:"Intermediate Guitar",level:"intermediate",description:"More control, rhythm, music theory and confident playing."},
 {slug:"advanced",name:"Advanced Guitar",level:"advanced",description:"Technique, phrasing, musical expression and your own sound."}
] as const;
export type Batch = {id:string,course_id:string,mode:"online"|"offline"|"home",label:string,schedule_description:string|null,fee_paise:number,capacity:number|null,is_active:boolean};
export type Course = {id:string,slug:string,name:string,level:string,description:string|null,is_active:boolean,batches?:Batch[]};
export const money=(paise:number)=>new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(paise/100);
