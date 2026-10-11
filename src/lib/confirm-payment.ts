import {adminClient} from "@/lib/supabase";
import {razorpayRequest,type RazorpayPayment} from "@/lib/razorpay";
export async function confirmCaptured(orderId:string,paymentId:string,checkoutSignatureVerified:boolean){
 const db=adminClient();
 const {data:stored,error:lookupError}=await db.from('payments').select('id,admission_id,amount_paise,currency,status,razorpay_payment_id').eq('razorpay_order_id',orderId).maybeSingle();
 if(lookupError||!stored)throw new Error('Unknown payment order');
 if(stored.status==='captured'&&stored.razorpay_payment_id===paymentId)return stored.admission_id as string;
 const payment=await razorpayRequest<RazorpayPayment>(`/payments/${encodeURIComponent(paymentId)}`);
 if(payment.order_id!==orderId||payment.amount!==stored.amount_paise||payment.currency!==stored.currency||payment.status!=='captured')throw new Error('Payment has not been captured or does not match the order');
 const {data,error}=await db.rpc('confirm_captured_payment',{p_order_id:orderId,p_payment_id:paymentId,p_checkout_verified:checkoutSignatureVerified});
 if(error||!data)throw new Error('Unable to record verified payment');
 return data as string;
}
