import type { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle2, Clock3, MessageCircle, ArrowRight } from 'lucide-react';
import { authenticatedUser, adminClient, configured } from '@/lib/supabase';
import { whatsappLink } from '@/lib/whatsapp';
import { money } from '@/lib/catalog';
import { Footer } from '@/components/footer';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Admission confirmation' };

export default async function ConfirmationPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const { id } = await searchParams;
  const user = await authenticatedUser();
  if (!user) return <Centered title="Sign in to view your admission" description="This confirmation is private. Please sign in using your registration email." action="/login" actionText="Sign in"/>;
  if (!configured() || !id) return <Centered title="No admission selected" description="Return to the joining page to choose a course." action="/join" actionText="Join class"/>;

  const db = adminClient();
  const { data: admission } = await db.from('admissions').select('id,admission_number,student_name,course_name_snapshot,batch_label_snapshot,mode_snapshot,base_fee_paise,travel_charge_paise,amount_due_paise,status').eq('id', id).eq('user_id', user.id).maybeSingle();
  if (!admission) return <Centered title="Admission not found" description="We couldn't find an admission linked to your account." action="/join" actionText="Back to joining"/>;
  const { data: payment } = await db.from('payments').select('razorpay_payment_id,status').eq('admission_id', admission.id).eq('status', 'captured').limit(1).maybeSingle();
  const paid = admission.status === 'paid' && payment?.status === 'captured' && Boolean(payment.razorpay_payment_id);
  const whats = paid ? whatsappLink({ ...admission, payment_id: payment!.razorpay_payment_id! }) : null;

  const details = [
    ['Admission ID', admission.admission_number],
    ['Student', admission.student_name],
    ['Course', admission.course_name_snapshot],
    ['Batch', admission.batch_label_snapshot],
    ['Format', admission.mode_snapshot === 'home' ? 'Home tuition' : admission.mode_snapshot === 'offline' ? 'Offline · Elamakkara, Kochi' : 'Online'],
    ['Monthly tuition', money(admission.base_fee_paise)],
    ...(admission.travel_charge_paise!==null ? [['Travel charge', money(admission.travel_charge_paise)] as [string,string]] : []),
    ['Confirmed total', admission.status === 'awaiting_quote' ? 'Awaiting travel quote' : money(admission.amount_due_paise)],
    ['Status', paid ? 'Paid · Active' : admission.status==='awaiting_quote'?'Awaiting travel quote':'Pending verification'],
  ];

  return <>
    <main id="main-content" className="mx-auto max-w-2xl px-5 py-16 md:py-24">
      <div className="dark-panel rounded-xl p-6 sm:p-10">
        {paid ? <CheckCircle2 className="text-[#b7d9ba]" size={39}/> : <Clock3 className="text-[#e4cf9c]" size={39}/>}
        <p className="eyebrow mt-8">{paid ? 'Payment verified' : admission.status === 'awaiting_quote' ? 'Travel charge approval pending' : 'Payment pending verification'}</p>
        <h1 className="section-title mt-3 text-3xl sm:text-4xl">{paid ? 'Welcome to the class.' : admission.status==='awaiting_quote'?'Your home tuition quote is pending.':'We are checking your payment.'}</h1>
        <p className="body-muted mt-4 text-sm">{paid ? 'Your enrollment is active. Your paid course tutorials are ready when Rahul publishes them.' : admission.status==='awaiting_quote'?'Rahul will review the travel charge for your address. Return to the joining form after you have received and approved the full quote; do not make a payment yet.':'Please do not pay again until you verify the previous attempt failed. This page updates when the server records your payment.'}</p>
        <dl className="mt-9 divide-y divide-[#343737] border-y border-[#343737]">{details.map(([label, value]) => <div key={label} className="flex justify-between gap-5 py-3.5 text-sm"><dt className="text-[#a3a6ac]">{label}</dt><dd className="max-w-[60%] text-right font-medium">{value}</dd></div>)}</dl>
        {paid ? <div className="mt-8 grid gap-3">
          <Link href="/student/tutorials" className="button-primary w-full">Go to my tutorials <ArrowRight size={17}/></Link>
          {whats && <a href={whats} target="_blank" rel="noopener noreferrer" className="button-secondary w-full"><MessageCircle size={17}/> Open WhatsApp confirmation</a>}
          <p className="mt-2 text-xs leading-6 text-[#92969c]">WhatsApp opens a prefilled draft. You must tap Send yourself; no file is attached automatically.</p>
        </div> : <div className="mt-8 grid gap-3"><a href={`/payment/success?id=${encodeURIComponent(admission.id)}`} className="button-primary w-full">Refresh payment status</a><Link href="/join" className="mt-1 text-center text-sm text-[#edac50]">Back to joining</Link></div>}
      </div>
    </main>
    <Footer/>
  </>;
}

function Centered({title, description, action, actionText}: {title:string;description:string;action:string;actionText:string}) {
  return <><main className="mx-auto max-w-xl px-5 py-24 text-center"><h1 className="section-title text-3xl">{title}</h1><p className="body-muted mt-4 text-sm">{description}</p><Link href={action} className="button-primary mt-7">{actionText}</Link></main><Footer/></>;
}
