import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
export function Footer() {
  return <footer className="site-footer page-width"><div className="footer-top"><Link href="/" className="wordmark"><span>RAHUL DAVID</span><small>GUITAR LESSONS</small></Link><p>Online · Elamakkara, Kochi · Home tuition</p><a className="quiet-link" href="https://wa.me/917994357541?text=Hello%20Rahul%2C%20I%27d%20like%20to%20enquire%20about%20guitar%20lessons." target="_blank" rel="noopener noreferrer">Get in touch <ArrowUpRight size={16}/></a></div><div className="footer-bottom"><p>© {new Date().getFullYear()} Rahul David Guitar Lessons</p><nav aria-label="Footer"><Link href="/courses">Courses</Link><Link href="/admin/login">Admin</Link><Link href="/reviews">Write a review</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/refund-policy">Refund policy</Link></nav></div></footer>;
}
