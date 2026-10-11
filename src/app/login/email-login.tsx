'use client';

import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { supabaseBrowser } from '@/lib/browser';

export function EmailLogin({ configured = false }: { configured?: boolean }) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!configured) return;
    setBusy(true); setStatus('');
    try {
      const next = new URLSearchParams(window.location.search).get('next') || '/student/tutorials';
      const safeNext = next.startsWith('/') && !next.startsWith('//') ? next : '/student/tutorials';
      const redirect = `${window.location.origin}/auth/callback?next=${encodeURIComponent(safeNext)}`;
      const { error } = await supabaseBrowser().auth.signInWithOtp({ email, options: { emailRedirectTo: redirect, shouldCreateUser: true } });
      if (error) throw error;
      setStatus('Check your inbox for a secure sign-in link. Open it to continue.');
    } catch (caught) {
      setStatus(caught instanceof Error ? caught.message : 'Unable to send a sign-in email. Please try again later.');
    } finally {
      setBusy(false);
    }
  }

  return <form onSubmit={submit} className="login-form">
    <label htmlFor="login-email" className="field-label">Email address</label>
    <input id="login-email" className="field-control" type="email" value={email} onChange={event => setEmail(event.target.value)} required placeholder="you@example.com" autoComplete="email" />
    <button className="button-primary mt-5 w-full" disabled={busy || !configured}>{busy ? 'Sending…' : 'Send sign-in link'} <ArrowRight size={17}/></button>
    {status && <p className="status-note mt-5" role="status">{status}</p>}
    {!configured && <p className="status-note" role="status">Student sign-in is not available yet. Contact Rahul if you need help accessing your lessons.</p>}
    <p className="login-note">Access to private lessons requires a verified email and an active paid course enrollment.</p>
  </form>;
}
