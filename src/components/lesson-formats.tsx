'use client';
import Link from 'next/link';
import { useState } from 'react';
import { ArrowRight, Check, Clock3, House, MapPin, Monitor } from 'lucide-react';
import { classModes, type ClassMode } from '@/lib/class-modes';
import { money } from '@/lib/catalog';
const modes = Object.keys(classModes) as ClassMode[];
const details = {
  online: { icon: Monitor, title: 'Your guitar. Your space.', location: 'Live online lessons', text: 'Build a regular practice habit from wherever you feel at home. Learn your favourite Malayalam and English songs, one lesson at a time.' },
  offline: { icon: MapPin, title: 'Learn together, in person.', location: 'Elamakkara, Kochi', text: 'Meet Rahul at his teaching location for a focused guitar session. Bring your questions, work on your technique and keep making music.' },
  home: { icon: House, title: 'Lessons that come to you.', location: 'At your home', text: 'One-to-one guitar tuition in your own space. Share your address with Rahul so availability and any travel charge can be agreed before payment.' },
};
export function LessonFormats() {
  const [mode, setMode] = useState<ClassMode>('online');
  const info = classModes[mode]; const detail = details[mode]; const Icon = detail.icon;
  function move(event: React.KeyboardEvent<HTMLButtonElement>) {
    const index = modes.indexOf(mode);
    const next = event.key === 'ArrowRight' ? modes[(index + 1) % 3] : event.key === 'ArrowLeft' ? modes[(index + 2) % 3] : event.key === 'Home' ? modes[0] : event.key === 'End' ? modes[2] : null;
    if (next) { event.preventDefault(); setMode(next); document.getElementById(`mode-${next}`)?.focus(); }
  }
  return <section id="lesson-formats" className="formats-section section-space">
    <div className="section-heading"><div><p className="eyebrow">Make room for music</p><h2>Learn your way.</h2></div><p className="section-aside">The same next step.<br />A space that works for you.</p></div>
    <div className="format-panel"><div className="format-tabs" role="tablist" aria-label="Lesson format">{modes.map(item => <button id={`mode-${item}`} key={item} type="button" role="tab" aria-selected={mode === item} aria-controls="format-content" tabIndex={mode === item ? 0 : -1} onKeyDown={move} onClick={() => setMode(item)}>{classModes[item].short}</button>)}</div>
      <div className="format-content" id="format-content" role="tabpanel" aria-labelledby={`mode-${mode}`} tabIndex={0}>
        <div className="format-description"><span className="location-label"><Icon size={16} />{detail.location}</span><h3>{detail.title}</h3><p>{detail.text}</p><div className="format-facts"><span><Clock3 size={16} />{info.lessons} lessons · {info.minutesPerLesson} minutes each</span><span><Check size={16} />Beginner to advanced</span></div></div>
        <div className="format-price"><p className="price"><strong>{money(info.feePaise)}</strong><span>/ month</span></p><p className="price-note">4 lessons, paid in advance.{mode === 'home' && <><br/>Travel charges may apply.</>}</p><Link href={`/join?mode=${mode}`} className="button-primary">Choose {info.short.toLowerCase()} <ArrowRight size={17}/></Link><p className="availability-note">Days and times confirmed with Rahul.</p></div>
      </div>
    </div>
  </section>;
}
