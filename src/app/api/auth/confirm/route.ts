import {userClient} from '@/lib/supabase';
import {emailConfirmationInput} from '@/lib/email-auth';
import {failure,noStore,parseJson} from '@/lib/http';
export async function POST(request:Request){if(request.headers.get('origin')!==new URL(request.url).origin)return failure('Request not allowed',403);const parsed=emailConfirmationInput.safeParse(await parseJson(request));if(!parsed.success)return failure('Invalid email link. Request a fresh email.',400);try{const {error}=await(await userClient()).auth.verifyOtp({token_hash:parsed.data.tokenHash,type:parsed.data.type});if(error)return failure('This email link expired or was already used. Request a fresh email.',400);return noStore({ok:true});}catch{return failure('Email confirmation is temporarily unavailable.',503);}}
