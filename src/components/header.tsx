'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Menu, X } from 'lucide-react';
export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false), [scrolled, setScrolled] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  const home = pathname === '/';
  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    const scroll = () => setScrolled(window.scrollY > 64);
    const close = (e: KeyboardEvent) => { if (e.key === 'Escape') { setOpen(false); toggle.current?.focus(); } };
    scroll(); window.addEventListener('scroll', scroll, { passive: true }); window.addEventListener('keydown', close);
    return () => { window.removeEventListener('scroll', scroll); window.removeEventListener('keydown', close); };
  }, []);
  const links = [['Courses','/courses'],['Class moments','/#moments'],['Reviews','/#reviews'],['About','/#about']];
  return <><a className="skip-link" href="#main-content">Skip to content</a><header className={`site-header ${scrolled ? 'is-scrolled' : ''} ${home ? 'on-hero' : ''} ${open ? 'menu-open' : ''}`}>
    <nav className="site-nav page-width" aria-label="Main navigation"><Link className="wordmark" href="/" onClick={() => setOpen(false)} aria-label="Rahul David Guitar Lessons home"><span>Rahul David</span><small>Guitar Lessons</small></Link><div className="desktop-nav">{links.map(([label,href]) => <Link key={label} href={href}>{label}</Link>)}<Link href="/login" className="login-link">Student login <ArrowUpRight size={15}/></Link></div><button ref={toggle} className="menu-toggle" type="button" aria-expanded={open} aria-controls="mobile-site-nav" aria-label={open ? 'Close menu' : 'Open menu'} onClick={() => setOpen(!open)}>{open ? <X size={21}/> : <Menu size={21}/>}</button></nav>
    {open && <nav id="mobile-site-nav" aria-label="Mobile navigation" className="mobile-nav"><p className="eyebrow">Make a little room for music</p>{[...links,['Student login','/login']].map(([label,href],i) => <Link key={label} href={href} onClick={() => setOpen(false)}><span><small>0{i+1}</small>{label}</span><ArrowUpRight size={20}/></Link>)}<Link className="button-primary" href="/join" onClick={() => setOpen(false)}>Let’s start playing <ArrowUpRight size={18}/></Link></nav>}
  </header>{!home && <div className="header-spacer"/>}</>;
}
