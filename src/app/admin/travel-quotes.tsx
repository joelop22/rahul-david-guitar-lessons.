'use client';
import {useState} from 'react';
import {money} from '@/lib/catalog';
type PendingQuote={id:string;admission_number:string;student_name:string;phone:string;home_address:string|null;preferred_days:string|null;preferred_time:string|null;course_name_snapshot:string;base_fee_paise:number};
export function TravelQuotes({quotes:initial}:{quotes:PendingQuote[]}){
 const [quotes,setQuotes]=useState(initial);
 const [charges,setCharges]=useState<Record<string,string>>({});
 const [active,setActive]=useState<string|null>(null);
 const [result,setResult]=useState('');
 async function approve(id:string){
  const value=charges[id]?.trim();
  if(!value||!/^(0|[1-9]\d*)(\.\d{1,2})?$/.test(value)){setResult('Enter the travel amount in rupees (0 is allowed), then confirm it with the student before approving.');return}
  const paise=Math.round(Number(value)*100);
  if(!Number.isSafeInteger(paise)||paise>10000000){setResult('Travel charge is outside the allowed range.');return}
  setActive(id);setResult('');
  try{
   const response=await fetch(`/api/admin/admissions/${id}/travel-quote`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({travelChargePaise:paise})});
   const data=await response.json();if(!response.ok)throw Error(data.error||'Unable to approve quote');
   setQuotes(old=>old.filter(q=>q.id!==id));setResult(`Quote approved. Final amount: ${money(data.admission.amount_due_paise)}. Inform the student to return, review and pay.`);
  }catch(e){setResult(e instanceof Error?e.message:'Quote approval failed')}
  finally{setActive(null)}
 }
 return <section className="mt-12 border-t border-[#343830] pt-8">
  <h2 className="text-xl font-medium">Home tuition · travel quotes</h2>
  <p className="body-muted mt-2 text-sm">Only admissions awaiting your travel-charge approval appear below. Agree on availability and any travel fee with the student before approving. The payment button remains locked until the approved total is shown to the student.</p>
  {quotes.length===0?<p className="status-note mt-5">No home-tuition admissions are currently waiting for a quote.</p>:<div className="mt-6 grid gap-4 md:grid-cols-2">{quotes.map(q=><article key={q.id} className="dark-panel p-5">
   <p className="eyebrow">{q.admission_number}</p><h3 className="mt-2 text-lg">{q.student_name}</h3>
   <p className="mt-2 text-sm text-[#a3a6ac]">{q.course_name_snapshot} · {q.phone}</p>
   <p className="mt-3 break-words text-sm">Address: {q.home_address||'Missing address'}</p>
   <p className="mt-3 text-xs text-[#a3a6ac]">Preferred: {q.preferred_days||'Not provided'} · {q.preferred_time||'Not provided'}</p>
   <p className="mt-4 text-sm">Base monthly tuition: {money(q.base_fee_paise)}</p>
   <label className="field-label mt-5" htmlFor={`travel-${q.id}`}>Travel charge for the month (₹)</label>
   <input id={`travel-${q.id}`} className="field-control" inputMode="decimal" value={charges[q.id]||''} onChange={e=>setCharges(old=>({...old,[q.id]:e.target.value}))} placeholder="Enter approved amount e.g. 200.00"/>
   <button type="button" disabled={active===q.id} onClick={()=>void approve(q.id)} className="button-primary mt-5 w-full">{active===q.id?'Saving…':'Approve final total'}</button>
  </article>)}</div>}
  {result&&<p role="status" className="status-note mt-5">{result}</p>}
 </section>
}
