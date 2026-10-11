import {z} from 'zod';
export const usernameInput=z.string().trim().toLowerCase().regex(/^[a-z0-9_]{3,24}$/,'Use 3–24 letters, numbers or underscores.');
export const studentLoginInput=z.object({identifier:z.string().trim().min(3).max(254),password:z.string().min(1).max(256)}).strict();
export function studentNext(value:string|null|undefined){
 if(!value||!value.startsWith('/')||value.startsWith('//')||/[\\\u0000-\u0020]/.test(value))return '/student/tutorials';
 try{const url=new URL(value,'https://local.invalid');if(url.origin!=='https://local.invalid'||/^\/(admin|api|auth|login)(\/|$)/.test(url.pathname))return '/student/tutorials';return url.pathname+url.search+url.hash;}catch{return '/student/tutorials';}
}
export function accountNext(next:string){return `/student/account?next=${encodeURIComponent(studentNext(next))}`;}
