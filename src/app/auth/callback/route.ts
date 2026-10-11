import {NextRequest,NextResponse} from 'next/server';
import {userClient} from '@/lib/supabase';
export async function GET(request:NextRequest){
 const url=new URL(request.url),code=url.searchParams.get('code'),next=url.searchParams.get('next')||'/student/tutorials';
 const safe=next.startsWith('/')&&!next.startsWith('//')?next:'/student/tutorials';
 if(!code)return NextResponse.redirect(new URL('/login?error=missing_code',url.origin));
 try{const supabase=await userClient();const {error}=await supabase.auth.exchangeCodeForSession(code);if(error)throw error;return NextResponse.redirect(new URL(safe,url.origin))}
 catch{return NextResponse.redirect(new URL('/login?error=auth_failed',url.origin))}
}
