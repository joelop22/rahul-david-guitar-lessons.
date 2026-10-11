import { z } from 'zod';
import { adminClient,requireOwner } from '@/lib/supabase';
import { communityReady } from '@/lib/community-server';
import { clipInput } from '@/lib/community';
import { failure,noStore,parseJson } from '@/lib/http';
const change=z.discriminatedUnion('kind',[
  z.object({kind:z.literal('moment'),id:z.string().uuid(),published:z.boolean()}).strict(),
  z.object({kind:z.literal('review'),id:z.string().uuid(),status:z.enum(['approved','rejected','pending']),reason:z.string().trim().min(3).max(300),updatedAt:z.string().datetime({offset:true})}).strict()
]);
export async function GET(){
  if(!await requireOwner())return failure('Owner access required',403);
  if(!communityReady())return failure('Run the community migration and enable COMMUNITY_ENABLED first.',503);
  const db=adminClient();const [r,m]=await Promise.all([db.from('site_reviews').select('id,display_name,rating,body,status,moderation_reason,updated_at').order('updated_at',{ascending:false}).limit(100),db.from('class_moments').select('id,title,caption,is_published').order('created_at',{ascending:false}).limit(100)]);
  if(r.error||m.error)return failure('Unable to load the community manager.',503);
  return noStore({reviews:r.data,moments:m.data});
}
export async function POST(request:Request){
  const owner=await requireOwner();if(!owner)return failure('Owner access required',403);
  if(!communityReady())return failure('Community is not enabled.',503);
  const input=clipInput.safeParse(await parseJson(request));if(!input.success)return failure('Add a title, an uploaded clip and permission to share it.');
  const db=adminClient();const file=await db.storage.from('class-moments').info(input.data.videoKey);
  if(file.error||!file.data)return failure('Finish uploading the video first.',409);
  const {error}=await db.from('class_moments').insert({title:input.data.title,caption:input.data.caption,video_key:input.data.videoKey,permission_confirmed:true,created_by:owner.id,is_published:false});
  if(error)return failure('Could not save the class moment.',503);
  return noStore({message:'Clip saved as a draft. Publish it when ready.'},201);
}
export async function PATCH(request:Request){
  if(!await requireOwner())return failure('Owner access required',403);
  if(!communityReady())return failure('Community is not enabled.',503);
  const input=change.safeParse(await parseJson(request));if(!input.success)return failure('Invalid update. A moderation reason is required.');
  const db=adminClient(),d=input.data;
  const result=d.kind==='moment'
    ?await db.from('class_moments').update({is_published:d.published}).eq('id',d.id).eq('permission_confirmed',true).select('id').maybeSingle()
    :await db.from('site_reviews').update({status:d.status,moderation_reason:d.reason,updated_at:new Date().toISOString()}).eq('id',d.id).eq('updated_at',d.updatedAt).eq('consent',true).select('id').maybeSingle();
  if(result.error)return failure('Could not save this change.',503);
  if(!result.data)return failure('This item changed or is unavailable. Refresh before trying again.',409);
  return noStore({message:'Saved.'});
}
