'use client';
import {useEffect,useState} from 'react';
import {ArrowRight,Eye,EyeOff} from 'lucide-react';
import {supabaseBrowser} from '@/lib/browser';
import {accountNext,studentNext} from '@/lib/student-auth';
type Mode='login'|'signup'|'reset'|'link';
export function EmailLogin({configured=false,googleEnabled=false}:{configured?:boolean;googleEnabled?:boolean}){
 const [mode,setMode]=useState<Mode>('login'),[identifier,setIdentifier]=useState(''),[password,setPassword]=useState(''),[confirm,setConfirm]=useState(''),[show,setShow]=useState(false),[busy,setBusy]=useState(false),[status,setStatus]=useState('');
 useEffect(()=>{if(new URLSearchParams(window.location.search).has('error'))setStatus('Sign-in could not be completed. Please try again.');},[]);
 function destination(){return studentNext(new URLSearchParams(window.location.search).get('next')||'/student/dashboard');}
 function callback(next:string){return `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;}
 function change(next:Mode){setMode(next);setStatus('');setPassword('');setConfirm('');}
 async function submit(event:React.FormEvent<HTMLFormElement>){
  event.preventDefault();if(!configured||busy)return;setBusy(true);setStatus('');
  try{
   if(mode==='login'){
    const response=await fetch('/api/student/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({identifier,password})});const data=await response.json();if(!response.ok)throw Error(data.error||'Unable to sign in');window.location.assign(destination());return;
   }
   const client=supabaseBrowser();const next=accountNext(destination());
   if(mode==='signup'){
    if(password!==confirm)throw Error('Passwords do not match.');
    const {data,error}=await client.auth.signUp({email:identifier.trim(),password,options:{emailRedirectTo:callback(next)}});if(error)throw error;
    if(data.session){window.location.assign(next);return;}setStatus('Check your email to confirm your account. You can choose your username after confirmation.');
   }else if(mode==='reset'){
    const {error}=await client.auth.resetPasswordForEmail(identifier.trim(),{redirectTo:callback(next)});if(error)throw error;setStatus('If this email has an account, a password reset link will arrive shortly.');
   }else{
    const {error}=await client.auth.signInWithOtp({email:identifier.trim(),options:{emailRedirectTo:callback(next),shouldCreateUser:false}});if(error)throw error;setStatus('Check your email for a sign-in link. You can then set a username and password.');
   }
  }catch(error){setStatus(error instanceof Error?error.message:'Unable to continue. Please try again.');}finally{setBusy(false);}
 }
 async function google(){if(!configured||!googleEnabled||busy)return;setBusy(true);setStatus('');try{const {error}=await supabaseBrowser().auth.signInWithOAuth({provider:'google',options:{redirectTo:callback(accountNext(destination()))}});if(error)throw error;}catch(error){setStatus(error instanceof Error?error.message:'Google sign-in could not start.');setBusy(false);}}
 return <div className="student-auth">
  <div className="auth-tabs"><button type="button" disabled={busy} aria-pressed={mode!=='signup'} onClick={()=>change('login')}>Sign in</button><button type="button" disabled={busy} aria-pressed={mode==='signup'} onClick={()=>change('signup')}>Create account</button></div>
  {googleEnabled&&<><button type="button" className="button-secondary auth-google" disabled={!configured||busy} onClick={google}><svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.39-.18-2.05H12v3.88h5.38a4.6 4.6 0 0 1-2 3.02v2.51h3.23c1.89-1.74 2.99-4.3 2.99-7.36Z"/><path fill="#34A853" d="M12 22c2.7 0 4.96-.9 6.61-2.41l-3.23-2.51c-.9.6-2.05.96-3.38.96-2.6 0-4.8-1.76-5.59-4.12H3.07v2.59A10 10 0 0 0 12 22Z"/><path fill="#FBBC05" d="M6.41 13.92a6 6 0 0 1 0-3.84V7.49H3.07a10 10 0 0 0 0 9.02l3.34-2.59Z"/><path fill="#EA4335" d="M12 5.96c1.47 0 2.79.51 3.82 1.51l2.87-2.87A9.6 9.6 0 0 0 12 2a10 10 0 0 0-8.93 5.49l3.34 2.59C7.2 7.72 9.4 5.96 12 5.96Z"/></svg>Continue with Google</button><div className="auth-divider"><span>or</span></div></>}
  <form onSubmit={submit} className="login-form">
   <label htmlFor="student-identifier" className="field-label">{mode==='login'?'Username or email':'Email address'}</label>
   <input id="student-identifier" className="field-control" type={mode==='login'?'text':'email'} required maxLength={254} autoComplete={mode==='login'?'username':'email'} value={identifier} onChange={event=>setIdentifier(event.target.value)} placeholder={mode==='login'?'Your username or email':'you@example.com'}/>
   {(mode==='login'||mode==='signup')&&<><label htmlFor="student-password" className="field-label mt-5">Password</label><div className="auth-password"><input id="student-password" className="field-control" type={show?'text':'password'} required minLength={mode==='signup'?12:1} maxLength={256} autoComplete={mode==='signup'?'new-password':'current-password'} value={password} onChange={event=>setPassword(event.target.value)}/><button type="button" aria-label={show?'Hide password':'Show password'} aria-pressed={show} onClick={()=>setShow(!show)}>{show?<EyeOff size={18}/>:<Eye size={18}/>}</button></div></>}
   {mode==='signup'&&<><label htmlFor="student-confirm" className="field-label mt-5">Confirm password</label><input id="student-confirm" className="field-control" type={show?'text':'password'} required minLength={12} maxLength={256} autoComplete="new-password" value={confirm} onChange={event=>setConfirm(event.target.value)}/><p className="login-note">Use at least 12 characters. Choose your username after verifying your email.</p></>}
   <button className="button-primary mt-5 w-full" disabled={busy||!configured}>{busy?'Please wait…':mode==='login'?'Sign in':mode==='signup'?'Create account':mode==='reset'?'Send reset link':'Send sign-in link'}<ArrowRight size={17}/></button>
  </form>
  <div className="auth-help"><button type="button" disabled={busy} onClick={()=>change('reset')}>Forgot password?</button><button type="button" disabled={busy} onClick={()=>change('link')}>Existing student? Use email link</button></div>
  {status&&<p className="status-note mt-5" role="status">{status}</p>}
  {!configured&&<p className="status-note">Student sign-in is not connected in this preview.</p>}
  <p className="login-note">A student account lets you apply and leave reviews. Private tutorials require an active paid enrollment.</p>
 </div>;
}
