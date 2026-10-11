import {adminClient,configured,userClient} from '@/lib/supabase';
import {failure,noStore,parseJson} from '@/lib/http';
import {studentLoginInput,usernameInput} from '@/lib/student-auth';
export async function POST(request:Request){
 if(request.headers.get('origin')!==new URL(request.url).origin)return failure('Request not allowed',403);
 if(!configured())return failure('Student login is temporarily unavailable.',503);
 const parsed=studentLoginInput.safeParse(await parseJson(request));
 if(!parsed.success)return failure('Enter your username or email and password.',400);
 try{
  let email=parsed.data.identifier;
  if(!email.includes('@')){
   const name=usernameInput.safeParse(email);if(!name.success)return failure('Incorrect username or password.',401);
   const {data,error}=await adminClient().rpc('student_login_email',{login_username:name.data});
   if(error)return failure('Username login is not configured yet. Use your email address.',503);
   // Still submit unknown names to Auth so failed attempts use the provider's limits.
   email=typeof data==='string'&&data?data:'unknown-student@invalid.example';
  }
  const client=await userClient();const {error}=await client.auth.signInWithPassword({email,password:parsed.data.password});
  if(error)return failure(error.status===429?'Too many attempts. Please try again later.':'Incorrect username/email or password. Verify your email before signing in.',error.status===429?429:401);
  return noStore({ok:true});
 }catch{return failure('Unable to sign in right now. Please try again later.',503);}
}
