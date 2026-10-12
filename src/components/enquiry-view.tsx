'use client';
import Link from 'next/link';
import {useRef,useState} from 'react';
import {ArrowUpRight,CheckCircle2} from 'lucide-react';
import type {Course} from '@/lib/catalog';
import {SitePhoto} from './site-photo';
import {Footer} from './footer';
import {enquiryInput} from '@/lib/enquiries';
type Form={studentName:string;age:string;phone:string;email:string;guardianName:string;guardianPhone:string;experienceLevel:'beginner'|'intermediate'|'advanced';preferredLanguage:'malayalam'|'english';preferredDays:string;preferredTime:string;homeAddress:string;musicalGoals:string;consent:boolean;website:string};
export function EnquiryView({courses,configured=false,preferredCourse='',preferredMode='online'}:{courses:Course[];configured?:boolean;preferredCourse?:string;preferredMode?:string}){
 const [courseSlug,setCourseSlug]=useState(courses.find(c=>c.slug===preferredCourse)?.slug||courses[0]?.slug||''),[mode,setMode]=useState(['online','offline','home'].includes(preferredMode)?preferredMode:'online'),[batchId,setBatchId]=useState('');
 const [form,setForm]=useState<Form>({studentName:'',age:'',phone:'',email:'',guardianName:'',guardianPhone:'',experienceLevel:'beginner',preferredLanguage:'malayalam',preferredDays:'',preferredTime:'',homeAddress:'',musicalGoals:'',consent:false,website:''});
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[saved,setSaved]=useState<{id:string;whatsapp:string}|null>(null);
 const submissionId=useRef<string|null>(null),lock=useRef(false);
 const course=courses.find(c=>c.slug===courseSlug),batches=(course?.batches||[]).filter(b=>b.mode===mode&&b.is_active),minor=!!form.age&&Number(form.age)<18;
 function update<K extends keyof Form>(key:K,value:Form[K]){setForm(old=>({...old,[key]:value}));submissionId.current=null;}
 async function submit(event:React.FormEvent<HTMLFormElement>){event.preventDefault();if(!configured||lock.current||saved)return;lock.current=true;setError('');setBusy(true);
  try{
   submissionId.current ||= crypto.randomUUID();
   const parsed=enquiryInput.safeParse({...form,age:Number(form.age),submissionId:submissionId.current,courseSlug,mode,batchId:batchId||undefined});
   if(!parsed.success)throw Error(parsed.error.issues[0].message);
   const response=await fetch('/api/enquiries',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(parsed.data)});
   const data=await response.json();if(!response.ok)throw Error(data.error||'Your enquiry could not be saved.');setSaved(data);
   // Save first, then navigate in this tab: avoids pop-up blockers after an async request.
   window.location.assign(data.whatsapp);
  }catch(error){setError(error instanceof Error?error.message:'Could not save your enquiry. Please try again.');}finally{lock.current=false;setBusy(false);}
 }
 return <><main id="main-content" className="admission-layout page-width"><div className="admission-intro"><p className="eyebrow">Class enquiry</p><h1>Let’s find your<br/>first chord.</h1><p>Tell Rahul about yourself, the lessons you’re interested in and a time that works for you.</p><div className="admission-photo"><SitePhoto image="beginner"/></div><ol className="admission-steps"><li><span>01</span>Choose a course and class format.</li><li><span>02</span>Share your details and preferences.</li><li><span>03</span>Submit, then send your enquiry on WhatsApp.</li></ol><p className="login-note">No payment or student login is required. Your preferred timing is a request, not a confirmed booking.</p></div>
 <div className="dark-panel registration-panel p-5 sm:p-7 md:p-9"><p className="eyebrow">Your enquiry</p><h2 className="mt-2 mb-7 text-2xl">Enquire about classes</h2>
 {saved?<div role="status"><CheckCircle2 className="text-[#edac50]"/><h3 className="mt-4 text-xl">Your enquiry is saved.</h3><p className="body-muted mt-3">Rahul can see your details. Open WhatsApp below and tap Send to share your message.</p><p className="login-note">Reference: {saved.id}</p><a className="button-primary mt-5" href={saved.whatsapp}>Continue to WhatsApp <ArrowUpRight size={17}/></a><Link className="text-link mt-5" href="/">Back to the studio</Link></div>:<form onSubmit={submit}>
 {!configured&&<p className="status-note mb-7">This preview does not save enquiries. The form becomes available once connected to the student enquiry database.</p>}
 <h3 className="mb-4 text-sm font-semibold">Personal details</h3><div className="grid gap-5 sm:grid-cols-2">
 <Field label="Student name" value={form.studentName} onChange={v=>update('studentName',v)} max={120} autoComplete="name"/>
 <Field label="Age" value={form.age} onChange={v=>update('age',v)} type="number"/>
 <Field label="Phone number" value={form.phone} onChange={v=>update('phone',v)} type="tel" max={20} autoComplete="tel"/>
 <Field label="Email address" value={form.email} onChange={v=>update('email',v)} type="email" max={150} autoComplete="email"/>
 </div>
 {minor&&<div className="grid gap-5 sm:grid-cols-2 mt-6"><Field label="Parent / guardian name" value={form.guardianName} onChange={v=>update('guardianName',v)} max={120}/><Field label="Guardian phone" value={form.guardianPhone} onChange={v=>update('guardianPhone',v)} type="tel" max={20}/></div>}
 <h3 className="mt-9 mb-4 text-sm font-semibold">Your guitar lessons</h3><div className="grid gap-5 sm:grid-cols-2">
 <label><span className="field-label">Course *</span><select className="field-control" required value={courseSlug} onChange={e=>{setCourseSlug(e.target.value);setBatchId('');submissionId.current=null;}}>{courses.map(c=><option value={c.slug} key={c.slug}>{c.name}</option>)}</select></label>
 <label><span className="field-label">Current experience *</span><select className="field-control" value={form.experienceLevel} onChange={e=>update('experienceLevel',e.target.value as Form['experienceLevel'])}><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></select></label>
 <label><span className="field-label">Class mode *</span><select className="field-control" value={mode} onChange={e=>{setMode(e.target.value);setBatchId('');submissionId.current=null;}}><option value="online">Online</option><option value="offline">In person · Elamakkara, Kochi</option><option value="home">Home tuition</option></select></label>
 <label><span className="field-label">Class option</span><select className="field-control" value={batchId} onChange={e=>{setBatchId(e.target.value);submissionId.current=null;}}><option value="">To be discussed with Rahul</option>{batches.map(b=><option key={b.id} value={b.id}>{b.label}</option>)}</select></label>
 <label><span className="field-label">Preferred language *</span><select className="field-control" value={form.preferredLanguage} onChange={e=>update('preferredLanguage',e.target.value as Form['preferredLanguage'])}><option value="malayalam">Malayalam</option><option value="english">English</option></select></label>
 <Field label="Preferred days" value={form.preferredDays} onChange={v=>update('preferredDays',v)} max={180} placeholder="e.g. weekends"/>
 <div className="sm:col-span-2"><Field label="Preferred time" value={form.preferredTime} onChange={v=>update('preferredTime',v)} max={180} placeholder="Your preferred time window"/></div></div>
 {mode==='home'&&<label className="block mt-6"><span className="field-label">Full address for home tuition *</span><textarea className="field-control min-h-[110px]" value={form.homeAddress} onChange={e=>update('homeAddress',e.target.value)} required minLength={10} maxLength={600} placeholder="House, street, area, PIN code"/></label>}
 <label className="block mt-6"><span className="field-label">Musical goals / favourite songs (optional)</span><textarea className="field-control min-h-[110px]" value={form.musicalGoals} onChange={e=>update('musicalGoals',e.target.value)} maxLength={1200} placeholder="What would you like to learn?"/></label>
 <div className="enquiry-honeypot" aria-hidden="true"><label>Website<input tabIndex={-1} autoComplete="off" value={form.website} onChange={e=>update('website',e.target.value)}/></label></div>
 <label className="mt-6 flex items-start gap-3 text-xs leading-6 body-muted"><input type="checkbox" className="mt-1 shrink-0 accent-[#edac50]" required checked={form.consent} onChange={e=>update('consent',e.target.checked)}/><span>I consent to my details being saved so Rahul can contact me about classes, and shared with WhatsApp when I continue. I have read the <Link href="/privacy" target="_blank" className="underline">privacy policy</Link>. For students under 18, a parent or guardian must consent.</span></label>
 {error&&<p className="status-error mt-5" role="alert">{error}</p>}
 <button className="button-primary mt-7 w-full" disabled={busy||!configured}>{busy?'Saving your enquiry…':'Submit & continue to WhatsApp'}<ArrowUpRight size={17}/></button><p className="login-note">Your enquiry saves first. WhatsApp opens with your details—tap Send there to send the message.</p>
 </form>}</div></main><Footer/></>;
}
function Field({label,value,onChange,type='text',max=180,placeholder='',autoComplete}:{label:string;value:string;onChange:(value:string)=>void;type?:string;max?:number;placeholder?:string;autoComplete?:string}){return <label><span className="field-label">{label} *</span><input className="field-control" type={type} value={value} onChange={e=>onChange(e.target.value)} required placeholder={placeholder} maxLength={type==='number'?undefined:max} min={type==='number'?1:undefined} max={type==='number'?120:undefined} autoComplete={autoComplete}/></label>;}
