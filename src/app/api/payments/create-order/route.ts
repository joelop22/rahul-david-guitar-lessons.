import {z} from 'zod';
import {adminClient,authenticatedUser,configured} from '@/lib/supabase';
import {failure,noStore,parseJson} from '@/lib/http';
import {razorpayReady,razorpayRequest,type RazorpayOrder} from '@/lib/razorpay';
import {classModes,isClassMode} from '@/lib/class-modes';
const schema=z.object({admissionId:z.string().uuid()});
export async function POST(request:Request){
 if(!configured()||!razorpayReady()||process.env.ADMISSIONS_ENABLED!=='true')return failure('Admission payments are not enabled',503);
 const user=await authenticatedUser();if(!user)return failure('Please sign in',401);
 const parsed=schema.safeParse(await parseJson(request));if(!parsed.success)return failure('Invalid admission ID');
 const db=adminClient();const {data:a}=await db.from('admissions').select('id,user_id,batch_id,mode_snapshot,base_fee_paise,travel_charge_paise,quote_approved_at,amount_due_paise,status').eq('id',parsed.data.admissionId).eq('user_id',user.id).maybeSingle();
 if(!a)return failure('Admission not found',404);if(a.status!=='pending_payment')return failure(a.status==='awaiting_quote'?'Rahul must approve the home tuition travel charge before payment':'This admission is not awaiting payment',409);
 if(!isClassMode(a.mode_snapshot)||a.base_fee_paise!==classModes[a.mode_snapshot].feePaise)return failure('Fee configuration mismatch',409);
 if(a.mode_snapshot==='home'&&(!a.quote_approved_at||a.travel_charge_paise===null))return failure('Home travel quote must be approved before payment',409);
 if(a.mode_snapshot!=='home'&&a.travel_charge_paise!==null)return failure('Unexpected extra charges',409);
 const expected=a.base_fee_paise+(a.travel_charge_paise??0);
 if(a.amount_due_paise!==expected)return failure('Payment total does not match approved charges',409);
 const {data:b}=await db.from('batches').select('id,is_active,capacity').eq('id',a.batch_id).maybeSingle();if(!b?.is_active)return failure('Batch is no longer available',409);
 if(b.capacity!==null){const {count}=await db.from('admissions').select('id',{count:'exact',head:true}).eq('batch_id',b.id).eq('status','paid');if((count||0)>=b.capacity)return failure('This batch is full',409)}
 const {data:prior}=await db.from('payments').select('razorpay_order_id,amount_paise,status').eq('admission_id',a.id).in('status',['created','authorized','captured']).limit(1).maybeSingle();
 if(prior)return noStore({orderId:prior.razorpay_order_id,amount:prior.amount_paise,currency:'INR',keyId:process.env.RAZORPAY_KEY_ID});
 let order:RazorpayOrder;
 try{order=await razorpayRequest<RazorpayOrder>('/orders',{method:'POST',body:JSON.stringify({amount:a.amount_due_paise,currency:'INR',receipt:a.id.replaceAll('-','').slice(0,32),notes:{admission_id:a.id}})})}catch{return failure('Unable to start payment. Please try again.',502)}
 if(order.amount!==a.amount_due_paise||order.currency!=='INR')return failure('Payment amount mismatch',502);
 const {error}=await db.from('payments').insert({admission_id:a.id,razorpay_order_id:order.id,amount_paise:order.amount,currency:'INR',status:'created'});
 if(error){const {data:stored}=await db.from('payments').select('razorpay_order_id,amount_paise').eq('admission_id',a.id).in('status',['created','authorized','captured']).limit(1).maybeSingle();if(stored)return noStore({orderId:stored.razorpay_order_id,amount:stored.amount_paise,currency:'INR',keyId:process.env.RAZORPAY_KEY_ID});return failure('Payment order could not be saved',500)}
 return noStore({orderId:order.id,amount:order.amount,currency:'INR',keyId:process.env.RAZORPAY_KEY_ID});
}
