/** Server-only owner session. Never reuse the student's auth cookie. */
export const ADMIN_COOKIE_NAME = 'rdgl-owner-auth';
export function adminCookieOptions(){return {name:ADMIN_COOKIE_NAME,httpOnly:true,sameSite:'lax' as const,secure:process.env.NODE_ENV==='production',path:'/'};}
export function adminLoginConfigured(){return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL&&process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY&&process.env.SUPABASE_SERVICE_ROLE_KEY&&process.env.ADMIN_USER_ID&&process.env.ADMIN_AUTH_EMAIL&&process.env.ADMIN_AUTH_USER_ID);}
