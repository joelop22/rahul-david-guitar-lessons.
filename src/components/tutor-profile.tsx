import {ArrowUpRight,Check,MapPin} from 'lucide-react';
import {tutorProfile as tutor} from '@/lib/tutor-profile';
export function TutorProfile(){
 return <section id="about" className="about-section section-space tutor-section" aria-labelledby="tutor-title">
  <div className="about-photo tutor-portrait">{tutor.portrait?<img src={tutor.portrait} alt={`${tutor.name}, guitar tutor`} width={800} height={1000} loading="lazy" decoding="async" style={{objectPosition:tutor.portraitPosition}}/>:<div className="tutor-monogram" aria-label={tutor.name}><span aria-hidden="true">RD</span></div>}<div className="photo-caption tutor-photo-caption"><strong>{tutor.name}</strong><span>{tutor.role}</span></div></div>
  <div className="about-copy"><p className="eyebrow">Meet your tutor</p><h2 id="tutor-title">{tutor.name}</h2><p className="tutor-role">{tutor.role}</p><p>{tutor.biography}</p><div className="tutor-location"><MapPin size={16}/><span>{tutor.location}</span></div><p>{tutor.formats}</p><ul className="about-list"><li><Check size={17}/>Beginner, intermediate &amp; advanced lessons</li><li><Check size={17}/>Malayalam &amp; English song practice</li><li><Check size={17}/>Private tutorials for enrolled students</li></ul><a className="button-secondary" href="https://wa.me/917994357541?text=Hello%20Rahul%2C%20I%27d%20like%20to%20ask%20about%20guitar%20lessons." target="_blank" rel="noopener noreferrer">Talk to Rahul <ArrowUpRight size={18}/></a></div>
 </section>;
}
