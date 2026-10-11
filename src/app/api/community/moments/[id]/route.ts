import { z } from 'zod';
import { adminClient } from '@/lib/supabase';
import { communityReady } from '@/lib/community-server';
import { failure,noStore } from '@/lib/http';
export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}){
  if(!communityReady())return failure('Class moments are not available yet.',503);
  const {id}=await params;if(!z.string().uuid().safeParse(id).success)return failure('Clip not found',404);
  const db=adminClient();const {data,error}=await db.from('class_moments').select('video_key').eq('id',id).eq('is_published',true).eq('permission_confirmed',true).maybeSingle();
  if(error||!data)return failure('Clip not found',404);
  const signed=await db.storage.from('class-moments').createSignedUrl(data.video_key,300);
  if(signed.error||!signed.data)return failure('Unable to play this clip.',503);
  return noStore({url:signed.data.signedUrl});
}
