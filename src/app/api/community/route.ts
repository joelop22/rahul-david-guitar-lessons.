import { adminClient } from '@/lib/supabase';
import { communityReady } from '@/lib/community-server';
import { failure,noStore } from '@/lib/http';
export async function GET(){
  if(!communityReady())return failure('Class moments and reviews are not available yet.',503);
  const db=adminClient();
  const [reviews,moments]=await Promise.all([
    db.from('site_reviews').select('id,display_name,rating,body,created_at').eq('status','approved').eq('consent',true).order('created_at',{ascending:false}).limit(12),
    db.from('class_moments').select('id,title,caption').eq('is_published',true).eq('permission_confirmed',true).order('created_at',{ascending:false}).limit(12)
  ]);
  if(reviews.error||moments.error)return failure('Unable to load class moments and reviews.',503);
  return noStore({reviews:reviews.data,moments:moments.data});
}
