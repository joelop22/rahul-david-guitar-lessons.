import {z} from 'zod';
import {adminClient,configured,requireOwner} from '@/lib/supabase';
import {failure,noStore,parseJson} from '@/lib/http';
const schema=z.object({travelChargePaise:z.number().int().min(0).max(10000000)});
export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){
 if(!configured())return failure('Database not configured',503);
 const owner=await requireOwner();if(!owner)return failure('Owner access required',403);
 const {id}=await params;
 if(!z.string().uuid().safeParse(id).success)return failure('Invalid admission ID');
 const parsed=schema.safeParse(await parseJson(request));if(!parsed.success)return failure('Enter a valid non-negative travel charge');
 const db=adminClient();
 const {data:admission}=await db.from('admissions').select('id,status,mode_snapshot,base_fee_paise').eq('id',id).maybeSingle();
 if(!admission||admission.mode_snapshot!=='home'||admission.status!=='awaiting_quote')return failure('This admission is not awaiting a home tuition quote',409);
 const {count}=await db.from('payments').select('id',{head:true,count:'exact'}).eq('admission_id',id);
 if(count)return failure('Payment records already exist; quote cannot be changed',409);
 const {data,error}=await db.from('admissions').update({
  travel_charge_paise:parsed.data.travelChargePaise,
  amount_due_paise:admission.base_fee_paise+parsed.data.travelChargePaise,
  quote_approved_at:new Date().toISOString(),status:'pending_payment',updated_at:new Date().toISOString(),
 }).eq('id',id).eq('status','awaiting_quote').select('id,amount_due_paise,travel_charge_paise,status').maybeSingle();
 if(error||!data)return failure('Could not approve the quote; refresh and retry',409);
 return noStore({admission:data});
}
