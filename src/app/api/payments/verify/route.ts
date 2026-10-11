import {z} from 'zod';
import {authenticatedUser,adminClient,configured} from '@/lib/supabase';
import {failure,noStore,parseJson} from '@/lib/http';
import {validCheckoutSignature,razorpayReady} from '@/lib/razorpay';
import {confirmCaptured} from '@/lib/confirm-payment';
const schema=z.object({razorpay_order_id:z.string().min(4),razorpay_payment_id:z.string().min(4),razorpay_signature:z.string().min(20)});
export async function POST(request:Request){
 if(!configured()||!razorpayReady())return failure('Payment service is not configured',503);
 const user=await authenticatedUser();if(!user)return failure('Please sign in',401);
 const parsed=schema.safeParse(await parseJson(request));if(!parsed.success)return failure('Invalid payment response');const p=parsed.data;
 const {data:record}=await adminClient().from('payments').select('admission:admissions(user_id)').eq('razorpay_order_id',p.razorpay_order_id).maybeSingle();
 const adm=record?.admission as unknown as {user_id:string}|{user_id:string}[]|null;
 const owner=Array.isArray(adm)?adm[0]?.user_id:adm?.user_id;
 if(owner!==user.id)return failure('Payment order not found',404);
 if(!validCheckoutSignature(p.razorpay_order_id,p.razorpay_payment_id,p.razorpay_signature))return failure('Invalid payment signature',400);
 try{const id=await confirmCaptured(p.razorpay_order_id,p.razorpay_payment_id,true);return noStore({verified:true,admissionId:id})}
 catch{return failure('Payment could not be confirmed yet. Check its status shortly.',409)}
}
