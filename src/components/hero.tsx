'use client';
import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { ArrowDown, ArrowUpRight } from 'lucide-react';
import { SitePhoto } from './site-photo';
export function Hero() {
  const root = useRef<HTMLElement>(null);
  useEffect(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0;
    const update = () => {
      frame = 0;
      const el = root.current; if (!el) return;
      const progress = motion.matches ? 0 : Math.min(1, Math.max(0, -el.getBoundingClientRect().top / el.offsetHeight));
      el.style.setProperty('--hero-opacity', String(1 - progress));
      el.style.setProperty('--hero-copy-opacity', String(Math.max(0, 1 - progress * 1.8)));
      el.style.setProperty('--hero-shift', `${progress * 90}px`);
    };
    const scroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    update(); window.addEventListener('scroll', scroll, { passive: true }); motion.addEventListener('change', update);
    return () => { cancelAnimationFrame(frame); window.removeEventListener('scroll', scroll); motion.removeEventListener('change', update); };
  }, []);
  return <section ref={root} className="cinema-hero" aria-labelledby="hero-title">
    <div className="cinema-image"><SitePhoto image="hero" priority/></div><div className="cinema-shade"/>
    <div className="cinema-content page-width"><p className="eyebrow">Guitar lessons with Rahul David · Kochi</p><h1 id="hero-title">Find your<br/><span>sound.</span></h1><p className="cinema-subtitle">A chord. A rhythm. A song that’s yours.</p><div className="hero-actions"><a href="#courses" className="button-primary">Explore courses <ArrowUpRight size={20}/></a><Link href="/join" className="hero-admission">Apply for admission <ArrowUpRight size={17}/></Link></div></div>
    <div className="hero-bottom page-width"><span>Online · In person · At home</span><a href="#courses" aria-label="Scroll to courses"><ArrowDown size={17}/> Scroll to explore</a></div>
  </section>;
}
