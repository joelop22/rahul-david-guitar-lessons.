'use client';

import Link from 'next/link';
import {useCallback, useEffect, useState} from 'react';
import {useRouter} from 'next/navigation';
import {AlertCircle, ArrowLeft, ArrowRight, CheckCircle2, LockKeyhole} from 'lucide-react';
import type {Course} from '@/lib/catalog';
import {money} from '@/lib/catalog';
import {classModes, isClassMode, type ClassMode} from '@/lib/class-modes';
import {supabaseBrowser} from '@/lib/browser';

type RazorpayInstance={open:()=>void};
type CheckoutResponse={razorpay_order_id:string;razorpay_payment_id:string;razorpay_signature:string};
type RazorpayOptions={key:string;amount:number;currency:string;order_id:string;name:string;description:string;handler:(result:CheckoutResponse)=>void;modal:{ondismiss:()=>void};prefill:{name:string;email:string;contact:string}};
declare global {interface Window {Razorpay?:new(options:RazorpayOptions)=>RazorpayInstance}}
function loadCheckout():Promise<void>{
 return new Promise((resolve,reject)=>{
  if(window.Razorpay){resolve();return}
  const script=document.createElement('script');script.src='https://checkout.razorpay.com/v1/checkout.js';
  script.onload=()=>resolve();script.onerror=()=>reject(new Error('Razorpay Checkout could not be loaded'));
  document.body.appendChild(script);
 });
}

type FormState={
 studentName:string;phone:string;age:string;email:string;guardianName:string;guardianPhone:string;
 experienceLevel:'beginner'|'intermediate'|'advanced';preferredLanguage:'malayalam'|'english';
 preferredDays:string;preferredTime:string;homeAddress:string;musicalGoals:string;termsAccepted:boolean;
};
type Admission={admissionId:string;admissionNumber:string;amountPaise:number;travelChargePaise:number|null;status:'awaiting_quote'|'pending_payment'|'paid'};

export function JoinFlow({courses,preferredCourse,preferredMode,configured}:{courses:Course[];preferredCourse:string;preferredMode:string;configured:boolean}){
 const router=useRouter();
 const [userEmail,setUserEmail]=useState<string|null>(null);
 const [authLoaded,setAuthLoaded]=useState(false);
 const [courseId,setCourseId]=useState(courses.find(c=>c.slug===preferredCourse)?.id||courses[0]?.id||'');
 const [mode,setMode]=useState<ClassMode>(isClassMode(preferredMode)?preferredMode:'online');
 const [batchId,setBatchId]=useState('');
 const [form,setForm]=useState<FormState>({studentName:'',phone:'',age:'',email:'',guardianName:'',guardianPhone:'',experienceLevel:'beginner',preferredLanguage:'malayalam',preferredDays:'',preferredTime:'',homeAddress:'',musicalGoals:'',termsAccepted:false});
 const [review,setReview]=useState(false);
 const [admission,setAdmission]=useState<Admission|null>(null);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 const [message,setMessage]=useState('');
 const course=courses.find(c=>c.id===courseId);
 const batches=(course?.batches||[]).filter(b=>b.mode===mode && b.is_active);
 const batch=batches.find(b=>b.id===batchId);
 const modeInfo=classModes[mode];
 const minor=Boolean(form.age&&Number(form.age)<18);
 const ready=configured&&authLoaded&&Boolean(userEmail)&&Boolean(batch)&&!busy;
 const quoted=admission?.status==='pending_payment'&&mode==='home';
 const update=<K extends keyof FormState>(key:K,value:FormState[K])=>{setForm(old=>({...old,[key]:value}));setAdmission(null)};
 const resetSelection=()=>{setReview(false);setAdmission(null);setError('');setMessage('')};
 const refreshAuth=useCallback(async()=>{
  if(!process.env.NEXT_PUBLIC_SUPABASE_URL||!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY){setAuthLoaded(true);return}
  try{
   const {data:{user}}=await supabaseBrowser().auth.getUser();
   setUserEmail(user?.email||null);
   if(user?.email)setForm(old=>({...old,email:user.email||''}));
  }catch{/* Leave sign-in notice visible. */}
  finally{setAuthLoaded(true)}
 },[]);
 useEffect(()=>{void refreshAuth()},[refreshAuth]);
 useEffect(()=>{setBatchId('')},[courseId,mode]);

 async function saveAdmission():Promise<Admission>{
  const res=await fetch('/api/admissions',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
   studentName:form.studentName,phone:form.phone,email:form.email,age:Number(form.age),
   guardianName:form.guardianName||undefined,guardianPhone:form.guardianPhone||undefined,
   experienceLevel:form.experienceLevel,preferredLanguage:form.preferredLanguage,
   preferredDays:form.preferredDays,preferredTime:form.preferredTime,homeAddress:mode==='home'?form.homeAddress:undefined,
   musicalGoals:form.musicalGoals,courseId,batchId,termsAccepted:form.termsAccepted,
  })});
  const data=await res.json();if(!res.ok)throw new Error(data.error||'Could not save admission');
  return data as Admission;
 }

 async function startPayment(record:Admission){
  await loadCheckout();
  const response=await fetch('/api/payments/create-order',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({admissionId:record.admissionId})});
  const order=await response.json();if(!response.ok)throw new Error(order.error||'Could not create payment order');
  if(!window.Razorpay)throw new Error('Checkout is unavailable');
  const checkout=new window.Razorpay({
   key:order.keyId,amount:order.amount,currency:order.currency,order_id:order.orderId,
   name:'Rahul David Guitar Lessons',description:`First month · ${course?.name||'Guitar lessons'} · ${modeInfo.short}`,
   prefill:{name:form.studentName,email:form.email,contact:form.phone},
   modal:{ondismiss:()=>{setBusy(false);setMessage('Checkout was closed. Your admission is not confirmed until payment is verified.')}},
   handler:async result=>{
    setMessage('Checking captured payment status…');
    try{
     const res=await fetch('/api/payments/verify',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(result)});
     const verification=await res.json();
     if(res.ok&&verification.verified)router.push(`/payment/success?id=${encodeURIComponent(verification.admissionId)}`);
     else router.push(`/payment/success?id=${encodeURIComponent(record.admissionId)}`);
    }catch{router.push(`/payment/success?id=${encodeURIComponent(record.admissionId)}`)}
   }
  });
  checkout.open();
 }

 async function finish(){
  if(!ready||!batch)return;
  setError('');setMessage('');setBusy(true);
  try{
   const record=admission||await saveAdmission();setAdmission(record);
   if(record.status==='paid'){router.push(`/payment/success?id=${encodeURIComponent(record.admissionId)}`);return}
   if(record.status==='awaiting_quote'){
    setMessage(`Registration ${record.admissionNumber} saved. Rahul must confirm the travel cost for your address. No payment has been taken. Return here after receiving the final quote.`);
    return;
   }
   if(mode==='home'&&!admission){
    // First present the owner-approved total; students must explicitly accept it.
    setMessage('Rahul has approved the travel charge. Review the complete total shown below, then select Confirm quote and pay.');
    return;
   }
   await startPayment(record);
  }catch(caught){setError(caught instanceof Error?caught.message:'An unexpected error occurred')}
  finally{setBusy(false)}
 }

 return <div className="dark-panel registration-panel p-5 sm:p-7 md:p-9">
  <div className="mb-8 flex items-start justify-between gap-4">
   <div><p className="eyebrow">Registration</p><h2 className="mt-2 text-2xl font-medium tracking-tight">{review?'Review your registration':'Join a guitar class'}</h2></div>
   <span className="step-label border border-[#4a493f] px-3 py-2 text-[10px] font-semibold uppercase tracking-[.13em] text-[#cab68e]">{review?'Step 2 / 2':'Step 1 / 2'}</span>
  </div>
  {!configured&&<p role="status" className="status-note mb-7">Online admission is not open yet. You can explore the form below and contact Rahul to confirm availability. This form will not submit your details or take payment.</p>}
  {configured&&authLoaded&&!userEmail&&<div className="status-note mb-7"><p className="flex items-center gap-2 font-semibold"><LockKeyhole size={16}/> Student login required</p><p className="mt-2">Sign in using your email so paid tutorial access is linked to your own account.</p><Link href="/login?next=/join" className="button-secondary mt-4">Sign in <ArrowRight size={16}/></Link></div>}

  {!review?<form onSubmit={event=>{event.preventDefault();if(ready){setError('');setMessage('');setAdmission(null);setReview(true)}}}>
   <h3 className="mb-4 text-sm font-semibold text-[#eeeae1]">Personal details</h3>
   <div className="grid gap-5 sm:grid-cols-2">
    <Field label="Student name" value={form.studentName} onChange={v=>update('studentName',v)} required placeholder="Full name"/>
    <Field label="Age" value={form.age} onChange={v=>update('age',v)} required type="number" placeholder="Age"/>
    <Field label="Phone number" value={form.phone} onChange={v=>update('phone',v)} required type="tel" placeholder="Phone number"/>
    <Field label="Email" value={form.email} onChange={v=>update('email',v)} required type="email" disabled={Boolean(userEmail)} placeholder="you@example.com"/>
   </div>
   {minor&&<div className="mt-6 grid gap-5 border-l-2 border-[#b89b70] pl-4 sm:grid-cols-2"><Field label="Parent / guardian name" value={form.guardianName} onChange={v=>update('guardianName',v)} required placeholder="Guardian name"/><Field label="Guardian phone" value={form.guardianPhone} onChange={v=>update('guardianPhone',v)} required type="tel" placeholder="Guardian phone"/></div>}

   <h3 className="mb-4 mt-9 text-sm font-semibold text-[#eeeae1]">Your guitar lessons</h3>
   <div className="grid gap-5 sm:grid-cols-2">
    <div><label htmlFor="course" className="field-label">Course</label><select id="course" className="field-control" value={courseId} required disabled={!courses.length} onChange={e=>{setCourseId(e.target.value);resetSelection()}}>{!courses.length&&<option value="">Courses will be listed soon</option>}{courses.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
    <div><label htmlFor="experience" className="field-label">Current experience</label><select id="experience" className="field-control" value={form.experienceLevel} onChange={e=>update('experienceLevel',e.target.value as FormState['experienceLevel'])}><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></select></div>
   </div>
   <div className="mt-7"><span className="field-label">Class mode</span><div className="grid gap-3 sm:grid-cols-3" role="group" aria-label="Class mode">{(Object.keys(classModes) as ClassMode[]).map(value=><button key={value} type="button" aria-pressed={mode===value} onClick={()=>{setMode(value);resetSelection()}} className={`mode-choice min-h-[58px] rounded-lg border px-3 py-3 text-left text-sm transition ${mode===value?'border-[#c6a372] bg-[#2e2a22] text-[#ffe5bd]':'border-[#343737] bg-[#141616] text-[#c0c3bf] hover:border-[#6b675e]'}`}>{classModes[value].short}</button>)}</div></div>
   <p className="mt-3 text-xs leading-6 text-[#a3aaa5]">{modeInfo.description}</p>
   <div className="mt-6"><label htmlFor="batch" className="field-label">Available class option</label><select id="batch" className="field-control" value={batchId} onChange={e=>{setBatchId(e.target.value);resetSelection()}} required disabled={!batches.length}><option value="">{batches.length?'Select an available option':'Schedule / availability not published yet'}</option>{batches.map(b=><option key={b.id} value={b.id}>{b.label}</option>)}</select><p className="mt-2 text-xs leading-5 text-[#919893]">Specific days and times must be agreed before payment. Your preferences do not reserve a class.</p>
    {!batches.length&&<a className="mt-3 inline-flex text-sm font-medium text-[#edac50] underline underline-offset-4" target="_blank" rel="noopener noreferrer" href={`https://wa.me/917994357541?text=${encodeURIComponent(`Hello Rahul, I'd like to enquire about ${course?.name||'guitar lessons'} (${modeInfo.title}). Could you share your available class options?`)}`}>Ask about availability on WhatsApp ↗</a>}</div>
   <div className="mt-6 grid gap-5 sm:grid-cols-2">
    <div><label htmlFor="language" className="field-label">Preferred language</label><select id="language" value={form.preferredLanguage} onChange={e=>update('preferredLanguage',e.target.value as FormState['preferredLanguage'])} className="field-control"><option value="malayalam">Malayalam</option><option value="english">English</option></select></div>
    <Field label="Preferred days" value={form.preferredDays} onChange={v=>update('preferredDays',v)} required placeholder="e.g. weekends"/>
    <div className="sm:col-span-2"><Field label="Preferred time" value={form.preferredTime} onChange={v=>update('preferredTime',v)} required placeholder="Your preferred time window (not a booking)"/></div>
   </div>
   {mode==='home'&&<div className="mt-6"><label htmlFor="home-address" className="field-label">Full address for home tuition *</label><textarea id="home-address" required minLength={10} maxLength={600} value={form.homeAddress} onChange={e=>update('homeAddress',e.target.value)} className="field-control min-h-[110px]" placeholder="House, street, area, PIN code"/><p className="mt-2 text-xs leading-5 text-[#c9b99c]">Rahul will calculate any travel charge from this address and share the exact payable total for approval before checkout.</p></div>}
   <div className="mt-6"><label htmlFor="goals" className="field-label">Musical goals / favourite songs (optional)</label><textarea id="goals" maxLength={1200} value={form.musicalGoals} onChange={e=>update('musicalGoals',e.target.value)} className="field-control min-h-[104px]" placeholder="What would you like to learn?"/></div>
   <div className="mt-8 border-y border-[#343737] py-5"><div className="flex items-center justify-between gap-3"><span className="text-sm text-[#b5b7b4]">Monthly tuition · {modeInfo.lessons} classes × {modeInfo.minutesPerLesson} min</span><strong className="text-xl text-[#edac50]">{money(modeInfo.feePaise)}</strong></div>{mode==='home'&&<p className="mt-3 text-xs text-[#c9b99c]">+ travel charge (to be quoted and approved; not yet payable)</p>}<p className="mt-2 text-xs text-[#8f9891]">Monthly fee is paid in advance. Published class availability is required before checkout.</p></div>
   <label className="mt-6 flex items-start gap-3 text-xs leading-6 text-[#a3a6ac]"><input type="checkbox" required checked={form.termsAccepted} onChange={e=>update('termsAccepted',e.target.checked)} className="mt-1 h-4 w-4 shrink-0 accent-[#c6a372]"/><span>I agree to the <Link href="/terms" target="_blank" className="underline">joining terms</Link>, <Link href="/privacy" target="_blank" className="underline">privacy policy</Link> and <Link href="/refund-policy" target="_blank" className="underline">refund policy</Link>.</span></label>
   <button disabled={!ready} className="button-primary mt-8 w-full">Review registration <ArrowRight size={17}/></button>
   <p className="mt-3 text-center text-xs text-[#939a93]">No payment is taken on this screen.</p>
  </form>:<div>
   <dl className="divide-y divide-[#343737] border-y border-[#343737] text-sm">{[
    ['Student',form.studentName],['Course',course?.name||''],['Experience',form.experienceLevel],
    ['Format',modeInfo.title],['Class option',batch?.label||''],['Language',form.preferredLanguage],
    ['Preferred days',form.preferredDays],['Preferred time',form.preferredTime],
    ...(mode==='home'?[['Home address',form.homeAddress]]:[]),
   ].map(([label,value])=><div key={label} className="flex items-start justify-between gap-5 py-3.5"><dt className="text-[#a3a6ac]">{label}</dt><dd className="max-w-[62%] text-right">{value}</dd></div>)}</dl>
   <div className="mt-6 rounded-2xl border border-[#4a493f] bg-[#1f211d] p-5">
    <h3 className="text-sm font-semibold">First-month amount</h3>
    <div className="mt-4 flex justify-between text-sm"><span>4 lessons × {modeInfo.minutesPerLesson} minutes</span><strong>{money(modeInfo.feePaise)}</strong></div>
    {mode==='home'&&<div className="mt-3 flex justify-between gap-3 text-sm"><span>Approved travel charges</span><strong>{quoted&&admission?.travelChargePaise!==null?money(admission!.travelChargePaise!):'Awaiting quote'}</strong></div>}
    <div className="mt-4 flex justify-between gap-3 border-t border-[#44473e] pt-4"><strong>Total</strong><strong className="text-xl text-[#edac50]">{mode==='home'&&!quoted?'Pending approval':money(admission?.amountPaise??modeInfo.feePaise)}</strong></div>
    <p className="mt-3 text-xs leading-6 text-[#b5b7b4]">Fees are paid in advance. Preferred timing is a request, not an automatic booking. Confirmed class availability and, for home tuition, your approved travel charge are required before paying.</p>
   </div>
   {error&&<p role="alert" className="status-error mt-5 flex gap-2"><AlertCircle size={17}/>{error}</p>}
   {message&&<p role="status" className="status-note mt-5 flex gap-2"><CheckCircle2 size={17}/>{message}</p>}
   <div className="mt-7 grid gap-3 sm:grid-cols-2">
    <button type="button" disabled={busy} onClick={()=>{setReview(false);setAdmission(null);setMessage('')}} className="button-secondary"><ArrowLeft size={16}/> Edit details</button>
    <button type="button" disabled={!ready||admission?.status==='awaiting_quote'} onClick={()=>void finish()} className="button-primary">{busy?'Processing…':mode==='home'?(quoted?'Approve total & pay':'Request travel quote'):'Confirm & pay'} <ArrowRight size={16}/></button>
   </div>
   {mode==='home'&&admission?.status==='awaiting_quote'&&<p className="mt-4 text-xs leading-6 text-[#c9b99c]">Quote requested. Once Rahul confirms the travel fee, return to this page, select the same class option and review the final amount before payment. Your saved admission will be reused.</p>}
  </div>}
 </div>;
}
function Field({label,value,onChange,required=false,placeholder,type='text',disabled=false}:{label:string;value:string;onChange:(value:string)=>void;required?:boolean;placeholder:string;type?:string;disabled?:boolean}){
 return <label className="block"><span className="field-label">{label}{required?' *':''}</span><input value={value} onChange={e=>onChange(e.target.value)} required={required} placeholder={placeholder} type={type} disabled={disabled} min={type==='number'?1:undefined} max={type==='number'?120:undefined} className="field-control"/></label>;
}
