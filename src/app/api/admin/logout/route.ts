import {ownerSessionClient} from '@/lib/supabase';
import {failure,noStore} from '@/lib/http';
export async function POST(request:Request){
 if(request.headers.get('origin')!==new URL(request.url).origin)return failure('Request not allowed',403);
 try{const client=await ownerSessionClient();const {error}=await client.auth.signOut({scope:'local'});if(error)return failure('Unable to sign out. Please try again.',503);return noStore({redirect:'/admin/login'});}catch{return failure('Unable to sign out.',503);}
}
