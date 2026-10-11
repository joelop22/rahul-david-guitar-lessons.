import {adminCookieOptions,adminLoginConfigured} from './admin-config';
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
export async function ownerSessionClient(){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 if(!url||!key)throw new Error('Supabase is not configured');
 const store=await cookies();
 return createServerClient(url,key,{cookieOptions:adminCookieOptions(),cookies:{
  getAll(){return store.getAll()},
  setAll(toSet){try{toSet.forEach(({name,value,options})=>store.set(name,value,options))}catch{/* Middleware refreshes server-component sessions. */}}
 }});
}
export async function requireOwner(){
 if(!adminLoginConfigured())return null;
 const supabase=await ownerSessionClient();
 const {data:{user},error}=await supabase.auth.getUser();
 if(error||!user||user.id!==process.env.ADMIN_AUTH_USER_ID||user.email?.toLowerCase()!==process.env.ADMIN_AUTH_EMAIL?.toLowerCase())return null;
 const {data,error:profileError}=await adminClient().from('profiles').select('role').eq('id',user.id).maybeSingle();
 return !profileError&&data?.role==='owner'?user:null;
}
