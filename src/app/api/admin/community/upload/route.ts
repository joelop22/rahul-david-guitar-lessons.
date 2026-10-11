import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { adminClient,requireOwner } from '@/lib/supabase';
import { communityReady } from '@/lib/community-server';
import { failure,noStore,parseJson } from '@/lib/http';
const upload=z.object({mimeType:z.enum(['video/mp4','video/webm']),size:z.number().int().positive().max(50_000_000)}).strict();
export async function POST(request:Request){
  if(!await requireOwner())return failure('Owner access required',403);
  if(!communityReady())return failure('Run the community migration and enable COMMUNITY_ENABLED first.',503);
  const input=upload.safeParse(await parseJson(request));if(!input.success)return failure('Use MP4 or WebM up to 50 MB.');
  const path=`moments/${randomUUID()}.${input.data.mimeType==='video/mp4'?'mp4':'webm'}`;
  const {data,error}=await adminClient().storage.from('class-moments').createSignedUploadUrl(path);
  if(error||!data)return failure('Unable to prepare upload.',503);
  return noStore({path:data.path,token:data.token});
}
