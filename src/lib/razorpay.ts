import {createHmac,timingSafeEqual} from "node:crypto";
const API="https://api.razorpay.com/v1";
export function razorpayReady(){return Boolean(process.env.RAZORPAY_KEY_ID&&process.env.RAZORPAY_KEY_SECRET)}
function basic(){const key=process.env.RAZORPAY_KEY_ID,secret=process.env.RAZORPAY_KEY_SECRET;if(!key||!secret)throw new Error("Razorpay is not configured");return 'Basic '+Buffer.from(`${key}:${secret}`).toString('base64')}
export async function razorpayRequest<T>(path:string,init:RequestInit={}):Promise<T>{
 const res=await fetch(`${API}${path}`,{...init,headers:{Authorization:basic(),...(init.body?{'Content-Type':'application/json'}:{}),...(init.headers||{})},cache:'no-store'});
 const data=await res.json().catch(()=>null);
 if(!res.ok)throw new Error(`Razorpay API error (${res.status}): ${data?.error?.description||'request failed'}`);
 return data as T;
}
export type RazorpayOrder={id:string,amount:number,currency:string,status:string};
export type RazorpayPayment={id:string,order_id:string,amount:number,currency:string,status:string};
export function secureCompare(expected:string,actual:string){
 const a=Buffer.from(expected,'utf8'),b=Buffer.from(actual,'utf8');return a.length===b.length&&timingSafeEqual(a,b);
}
export function validCheckoutSignature(orderId:string,paymentId:string,signature:string){
 const secret=process.env.RAZORPAY_KEY_SECRET;if(!secret)return false;
 const expected=createHmac('sha256',secret).update(`${orderId}|${paymentId}`).digest('hex');return secureCompare(expected,signature);
}
export function validWebhookSignature(body:string,signature:string){
 const secret=process.env.RAZORPAY_WEBHOOK_SECRET;if(!secret)return false;
 return secureCompare(createHmac('sha256',secret).update(body).digest('hex'),signature);
}
