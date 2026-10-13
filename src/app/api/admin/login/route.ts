import {z} from 'zod';
import {adminLoginConfigured} from '@/lib/admin-config';
import {ownerSessionClient,requireOwner} from '@/lib/supabase';
import {failure,noStore,parseJson} from '@/lib/http';
const input=z.object({userId:z.string().trim().min(3).max(64),password:z.string().min(1).max(256)}).strict();
export async function POST(request:Request){
 if(request.headers.get('origin')!==new URL(request.url).origin)return failure('Request not allowed',403);
 if(!adminLoginConfigured())return failure('Admin sign-in is not configured. Run npm run setup:admin on your computer.',503);
 const parsed=input.safeParse(await parseJson(request));
 if(!parsed.success||parsed.data.userId!==process.env.ADMIN_USER_ID)return failure('Incorrect user ID or password.',401);
 try{
  const client=await ownerSessionClient();
  const result=await client.auth.signInWithPassword({email:process.env.ADMIN_AUTH_EMAIL!,password:parsed.data.password});
  if(result.error){if(result.error.status===429)return failure('Too many attempts. Please try again later.',429);return failure('Incorrect user ID or password.',401);}
  // Password success is not enough: enforce configured identity AND owner role.
  if(!await requireOwner()){await client.auth.signOut({scope:'local'});return failure('This account does not have admin access.',403);}
  return noStore({redirect:'/admin/students'});
 }catch{return failure('Unable to sign in. Check the Supabase connection and try again.',503);}
}
