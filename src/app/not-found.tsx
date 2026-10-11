import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Footer } from '@/components/footer';
export default function NotFound() {
  return <><main id="main-content" className="page-width page-intro"><div className="dark-panel p-8 sm:p-14"><p className="eyebrow">404 · A little off track</p><h1 className="section-title max-w-2xl text-4xl sm:text-6xl">Let’s find your way back.</h1><p className="body-muted mt-6 max-w-lg text-sm">This page isn’t here. Head back to the studio or explore a guitar course.</p><div className="mt-8 flex flex-wrap gap-3"><Link className="button-primary" href="/"><ArrowLeft size={17}/> Back to home</Link><Link className="button-secondary" href="/courses">Explore courses <ArrowRight size={17}/></Link></div></div></main><Footer/></>;
}
