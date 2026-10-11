import { adminClient, authenticatedUser } from '@/lib/supabase';
import { communityReady } from '@/lib/community-server';
import { reviewInput } from '@/lib/community';
import { failure,noStore,parseJson } from '@/lib/http';
export async function GET(){
  if(!communityReady())return failure('Website reviews are not open yet.',503);
  const user=await authenticatedUser();if(!user)return noStore({signedIn:false,review:null});
  const {data,error}=await adminClient().from('site_reviews').select('display_name,rating,body,status,moderation_reason').eq('user_id',user.id).maybeSingle();
  if(error)return failure('Unable to load your review.',503);
  return noStore({signedIn:Boolean(user.email_confirmed_at),review:data});
}
export async function POST(request:Request){
  if(!communityReady())return failure('Website reviews are not open yet.',503);
  const user=await authenticatedUser();if(!user?.email_confirmed_at)return failure('Sign in with a verified email to leave a review.',401);
  const input=reviewInput.safeParse(await parseJson(request));if(!input.success)return failure('Add your name, a 1–5 rating, 20–1200 characters and permission to publish.');
  const {displayName,rating,body}=input.data;
  const {error}=await adminClient().from('site_reviews').upsert({user_id:user.id,display_name:displayName,rating,body,consent:true,status:'pending',moderation_reason:null,updated_at:new Date().toISOString()},{onConflict:'user_id'});
  if(error)return failure('Your review could not be saved. Please try again.',503);
  return noStore({message:'Thank you. Your review is saved and awaiting moderation.'});
}
