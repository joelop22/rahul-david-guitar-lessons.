"use client";
import {createBrowserClient} from "@supabase/ssr";
export function supabaseBrowser(){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 if(!url||!key) throw new Error("Supabase is not configured. Add the NEXT_PUBLIC_SUPABASE_ variables.");
 return createBrowserClient(url,key);
}
