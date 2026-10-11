import nextEnv from '@next/env';
const {loadEnvConfig}=nextEnv;
import {createClient} from '@supabase/supabase-js';
import {createInterface} from 'node:readline/promises';
import {Writable} from 'node:stream';
import {readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
loadEnvConfig(process.cwd());
const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
if(!url||!key){console.error('First fill the Supabase URL and server secret in .env.local.');process.exit(1)}
if(!process.stdin.isTTY){console.error('Run this setup in an interactive terminal. Passwords are entered privately.');process.exit(1)}
let hidden=false;
const output=new Writable({write(chunk,encoding,done){if(!hidden)process.stdout.write(chunk,encoding);done()}});
output.isTTY=true;output.columns=process.stdout.columns||80;
const rl=createInterface({input:process.stdin,output,terminal:true});
async function secret(label){process.stdout.write(label);hidden=true;try{return await rl.question('')}finally{hidden=false;process.stdout.write('\n')}}
try{
 console.log('Create the separate admin account. No email login link is needed.\n');
 const userId=(await rl.question(`Admin user ID [${process.env.ADMIN_USER_ID||'rahuladmin'}]: `)).trim()||process.env.ADMIN_USER_ID||'rahuladmin';
 if(!/^[a-zA-Z0-9._-]{3,64}$/.test(userId))throw Error('Use 3–64 letters, numbers, dots, hyphens or underscores for the user ID.');
 const email=(await rl.question(`Owner email${process.env.ADMIN_AUTH_EMAIL?' ['+process.env.ADMIN_AUTH_EMAIL+']':''}: `)).trim()||process.env.ADMIN_AUTH_EMAIL||'';
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw Error('Enter a valid owner email. This stays server-side and is not the login user ID.');
 const password=await secret('New admin password (at least 12 characters; typing is hidden): ');
 if(password.length<12||password.length>128)throw Error('Choose a password between 12 and 128 characters.');
 if(password!==await secret('Confirm password: '))throw Error('Passwords do not match.');
 const db=createClient(url,key,{auth:{autoRefreshToken:false,persistSession:false}});
 let existing=null;
 for(let page=1;page<=100;page++){
  const {data,error}=await db.auth.admin.listUsers({page,perPage:1000});if(error)throw Error('Cannot access Supabase accounts. Check your server secret.');
  existing=data.users.find(u=>u.email?.toLowerCase()===email.toLowerCase());if(existing||data.users.length<1000)break;
 }
 let id;
 if(existing){
  const {data:profile,error}=await db.from('profiles').select('role').eq('id',existing.id).maybeSingle();
  if(error)throw Error('Run supabase/schema.sql first on a fresh project.');
  if(profile?.role!=='owner')throw Error('That email belongs to a non-owner account. Use a separate admin email, or first promote your verified owner account in Supabase.');
  const {error:updateError}=await db.auth.admin.updateUserById(existing.id,{password,email_confirm:true});if(updateError)throw Error('Could not update the admin password. Check Supabase Auth settings.');
  id=existing.id;
 }else{
  // Verify the schema before creating an Auth user.
  const check=await db.from('profiles').select('id').limit(1);if(check.error)throw Error('Run supabase/schema.sql first on a fresh project.');
  const {data,error}=await db.auth.admin.createUser({email,password,email_confirm:true,user_metadata:{full_name:'Rahul David Admin'}});
  if(error||!data.user)throw Error('Could not create the admin account. Check Supabase Auth settings and password rules.');id=data.user.id;
 }
 const profile=await db.from('profiles').upsert({id,role:'owner',full_name:'Rahul David Admin'});if(profile.error)throw Error('Account created, but owner role could not be saved. Check the profiles table.');
 const file=path.join(process.cwd(),'.env.local');let env='';try{env=await readFile(file,'utf8')}catch{/* Create a local config if needed. */}
 for(const [name,value] of Object.entries({ADMIN_USER_ID:userId,ADMIN_AUTH_EMAIL:email,ADMIN_AUTH_USER_ID:id})){
  const line=`${name}=${JSON.stringify(value)}`;const regex=new RegExp(`^${name}=.*$`,'m');env=regex.test(env)?env.replace(regex,line):env.trimEnd()+'\n'+line+'\n';
 }
 await writeFile(file,env,{mode:0o600});
 console.log(`\nAdmin ready. User ID: ${userId}\nYour password was saved by Supabase, not in the source files.\nRestart npm run dev, then open http://localhost:3000/admin/login.\nFor hosting, copy ADMIN_USER_ID, ADMIN_AUTH_EMAIL and ADMIN_AUTH_USER_ID from .env.local into your hosting environment.`);
}catch(e){console.error('\nSetup failed: '+(e instanceof Error?e.message:'Unknown error'));process.exitCode=1}finally{rl.close()}
