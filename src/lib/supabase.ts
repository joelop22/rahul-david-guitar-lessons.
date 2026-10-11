import {createClient} from "@supabase/supabase-js";
import {createServerClient} from "@supabase/ssr";
import {cookies} from "next/headers";

export function configured(){return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL&&process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY&&process.env.SUPABASE_SERVICE_ROLE_KEY)}
export function adminClient(){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL, key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key) throw new Error("Supabase server credentials are not configured");
 return createClient(url,key,{auth:{autoRefreshToken:false,persistSession:false}});
}
export async function userClient(){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 if(!url||!key) throw new Error("Supabase public credentials are not configured");
 const store=await cookies();
 return createServerClient(url,key,{cookies:{getAll(){return store.getAll()},setAll(toSet){try{toSet.forEach(({name,value,options})=>store.set(name,value,options))}catch{/* Server Components cannot set cookies; middleware refreshes tokens. */}}}});
}
export async function authenticatedUser(){
 if(!configured()) return null;
 const supabase=await userClient();
 const {data:{user},error}=await supabase.auth.getUser();
 return error?null:user;
}
export async function requireOwner(){
 const user=await authenticatedUser();if(!user)return null;
 const {data}=await adminClient().from('profiles').select('role').eq('id',user.id).maybeSingle();
 return data?.role==='owner'?user:null;
}
