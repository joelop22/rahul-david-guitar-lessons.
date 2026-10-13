import {notFound,redirect} from 'next/navigation';
import {adminClient,authenticatedUser,requireOwner} from '@/lib/supabase';
import {studyPeriod} from '@/lib/portal';
import {PrintCertificate} from './print';
export const dynamic='force-dynamic';export const metadata={title:'Course completion certificate',robots:{index:false,follow:false}};
export default async function Certificate({params}:{params:Promise<{id:string}>}){
 const owner=await requireOwner(),user=owner||await authenticatedUser();if(!user)redirect('/login');const {id}=await params,db=adminClient();
 const {data:c}=await db.from('portal_certificates').select('*').eq('id',id).maybeSingle();if(!c)notFound();
 if(!owner){const {data:s}=await db.from('portal_students').select('account_id').eq('id',c.student_id).maybeSingle();if(s?.account_id!==user.id)notFound();}
 const b=c.branding as {studio:string;tutor:string;location:string;signature:string;signatureEnabled:boolean};
 return <main id="main-content" className="certificate-screen"><PrintCertificate/><article className="certificate-sheet"><div className="certificate-border"><p className="certificate-brand">{b.studio}</p><p className="certificate-small">Certificate of completion</p><h1>A milestone in music.</h1><p className="certificate-small">Presented to</p><h2 style={{fontSize:c.student_name.length>80?'24px':c.student_name.length>45?'30px':undefined}}>{c.student_name}</h2><p>For completing <strong>{c.course_name}</strong><br/>with {b.tutor}.</p><div className="certificate-period">{studyPeriod(c.started_on,c.completed_on)}</div><p className="certificate-small">Study period · {c.started_on} to {c.completed_on}</p><div className="certificate-bottom"><div><strong>{new Intl.DateTimeFormat('en-IN',{dateStyle:'long',timeZone:'UTC'}).format(new Date(c.completed_on))}</strong><span>Completion date</span></div><div>{b.signatureEnabled&&b.signature?.startsWith('/images/')&&!b.signature.includes('..')&&<img src={b.signature} alt="Tutor signature" width={150} height={60}/>}<strong>{b.tutor}</strong><span>Guitar tutor · {b.location}</span></div></div><p className="certificate-number">{c.certificate_number}</p></div></article></main>;
}
