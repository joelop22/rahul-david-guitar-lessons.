import {adminClient,configured} from '@/lib/supabase';
import {noStore} from '@/lib/http';
import {roundedMilestone} from '@/lib/portal';
export async function GET(){if(!configured())return noStore({milestone:0});try{const {data,error}=await adminClient().rpc('portal_learning_milestone');return noStore({milestone:error?0:roundedMilestone(Number(data)||0)});}catch{return noStore({milestone:0});}}
