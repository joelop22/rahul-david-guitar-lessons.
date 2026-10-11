import type { Metadata } from 'next';
import { EmailLogin } from './email-login';
import { Footer } from '@/components/footer';
import { SitePhoto } from '@/components/site-photo';
export const metadata: Metadata = { title: 'Student login' };
export default function LoginPage() {
  const configured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  return <><main id="main-content" className="login-layout page-width"><div className="login-photo"><SitePhoto image="hero" priority/></div><div className="login-copy"><p className="eyebrow">Welcome back</p><h1>Your lessons.<br/>Your space.</h1><p>Sign in with your email to return to your guitar lessons and manage your admission.</p><EmailLogin configured={configured}/></div></main><Footer/></>;
}
