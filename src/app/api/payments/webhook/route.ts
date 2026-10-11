import {adminClient,configured} from '@/lib/supabase';
import {failure,noStore} from '@/lib/http';
import {validWebhookSignature,razorpayReady} from '@/lib/razorpay';
import {confirmCaptured} from '@/lib/confirm-payment';
export async function POST(request:Request){
 if(!configured()||!razorpayReady()||!process.env.RAZORPAY_WEBHOOK_SECRET)return failure('Webhook is not configured',503);
 const raw=await request.text();if(raw.length>1_000_000)return failure('Event too large',413);
 const signature=request.headers.get('x-razorpay-signature')||'';
 if(!validWebhookSignature(raw,signature))return failure('Invalid webhook signature',401);
 const eventId=request.headers.get('x-razorpay-event-id')||'';
 if(!eventId)return failure('Missing event identifier');
 const db=adminClient();const {data:processed}=await db.from('webhook_events').select('id').eq('id',eventId).maybeSingle();if(processed)return noStore({ok:true,duplicate:true});
 let event:{event?:string,payload?:{payment?:{entity?:{id?:string,order_id?:string}}}};
 try{event=JSON.parse(raw)}catch{return failure('Invalid event JSON')}
 try{
  if(event.event==='payment.captured'){
   const p=event.payload?.payment?.entity;
   if(!p?.id||!p.order_id)throw new Error('Missing payment data');
   await confirmCaptured(p.order_id,p.id,false);
  }
  // Record after successful processing so failed events can be retried by Razorpay.
  const {error}=await db.from('webhook_events').insert({id:eventId,event_type:event.event||'unknown'});
  if(error&&!error.message.includes('duplicate'))throw error;
  return noStore({ok:true});
 }catch{return failure('Webhook processing failed; please retry',500)}
}
