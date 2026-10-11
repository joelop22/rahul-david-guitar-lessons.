'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, ArrowUpRight, Film, Pause, Play, Quote, Star } from 'lucide-react';
import { googleMapsUrl, googleReviewUrl, type PublicMoment, type PublicReview } from '@/lib/community';
function Moment({moment}:{moment:PublicMoment}) {
  const [url,setUrl]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');
  async function play(){setBusy(true);setError('');try {const r=await fetch(`/api/community/moments/${moment.id}`);const d=await r.json();if(!r.ok)throw Error(d.error||'Unable to load clip');setUrl(d.url);}catch(e){setError(e instanceof Error?e.message:'Unable to load clip');}finally{setBusy(false);}}
  return <article className="moment-card"><div className="moment-screen">{url ? <video controls autoPlay playsInline preload="none" src={url} aria-label={moment.title} onError={()=>{setUrl('');setError('Playback failed. Tap to try again.');}}/> : <button onClick={play} disabled={busy} aria-label={`Play ${moment.title}`}><span className="play-orb"><Play size={25}/></span><span>{busy?'Opening…':'Watch moment'}</span></button>}<span className="moment-tag">From the classroom</span></div><div className="moment-copy"><h3>{moment.title}</h3><p>{moment.caption}</p>{error&&<p role="alert">{error}</p>}</div></article>;
}
function MomentsCarousel({moments}:{moments:PublicMoment[]}) {
  const rail=useRef<HTMLDivElement>(null);
  const [edges,setEdges]=useState({start:true,end:false});
  useEffect(()=>{
    const element=rail.current;if(!element)return;
    function update(){if(element)setEdges({start:element.scrollLeft<=2,end:element.scrollLeft+element.clientWidth>=element.scrollWidth-2});}
    const resize=new ResizeObserver(update);resize.observe(element);
    element.addEventListener('scroll',update,{passive:true});update();
    const observer=new IntersectionObserver(entries=>{for(const entry of entries)if(!entry.isIntersecting)entry.target.querySelector('video')?.pause();},{root:element,threshold:0.5});
    element.querySelectorAll('.moment-card').forEach(card=>observer.observe(card));
    return()=>{resize.disconnect();observer.disconnect();element.removeEventListener('scroll',update);};
  },[moments]);
  function move(direction:number){const element=rail.current;if(!element)return;const card=element.querySelector('.moment-card');const gap=parseFloat(getComputedStyle(element).columnGap)||0;const distance=(card?.getBoundingClientRect().width||element.clientWidth)+gap;element.scrollBy({left:direction*distance,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});}
  return <div className="moments-carousel">
    <div ref={rail} id="class-moments-rail" className="moments-rail" tabIndex={0} aria-label="Class videos. Swipe horizontally or use the arrow keys."
      onKeyDown={event=>{if(event.target!==event.currentTarget)return;if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();move(event.key==='ArrowLeft'?-1:1);}}}
      onPlayCapture={event=>{rail.current?.querySelectorAll('video').forEach(video=>{if(video!==event.target)video.pause();});}}>
      {moments.map(moment=><Moment key={moment.id} moment={moment}/>)}</div>
    <div className="moments-navigation"><span>Swipe to see more moments</span><div className="review-controls"><button disabled={edges.start} aria-label="Previous class video" aria-controls="class-moments-rail" onClick={()=>move(-1)}><ArrowLeft size={18}/></button><button disabled={edges.end} aria-label="Next class video" aria-controls="class-moments-rail" onClick={()=>move(1)}><ArrowRight size={18}/></button></div></div>
  </div>;
}
function ReviewCard({review}:{review:PublicReview}) {return <article className="review-card"><div className="review-stars" aria-label={`${review.rating} out of 5 stars`}>{Array.from({length:5},(_,i)=><Star key={i} size={14} fill={i<review.rating?'currentColor':'none'}/>)}</div><p className="review-body">“{review.body}”</p><div className="review-author"><span className="review-avatar" aria-hidden="true">{review.display_name.slice(0,1)}</span><div><strong>{review.display_name}</strong><small>Website review</small></div><Quote size={22}/></div></article>}
export function Community({enabled=false}:{enabled?:boolean}) {
  const [reviews,setReviews]=useState<PublicReview[]>([]),[moments,setMoments]=useState<PublicMoment[]>([]),[error,setError]=useState(''),[loading,setLoading]=useState(enabled),[paused,setPaused]=useState(false),[reverse,setReverse]=useState(false);
  useEffect(()=>{if(!enabled)return;const c=new AbortController();fetch('/api/community',{signal:c.signal}).then(async r=>{if(!r.ok)throw Error('Class moments and reviews are temporarily unavailable.');return r.json()}).then(d=>{setReviews(d.reviews);setMoments(d.moments)}).catch(e=>{if(e.name!=='AbortError')setError(e.message)}).finally(()=>setLoading(false));return()=>c.abort()},[enabled]);
  return <>
    <section id="moments" className="section-space moments-section"><div className="section-heading"><div><p className="eyebrow">A little life from class</p><h2>Small moments.<br/>Real progress.</h2></div><p className="section-aside">Practice, first songs and shared smiles.<br/>A look inside lessons with Rahul.</p></div>
    {moments.length ? <MomentsCarousel moments={moments}/> : <div className="community-empty moment-empty"><span className="empty-icon"><Film size={28}/></span><div><h3>{loading?'Opening the classroom…':'The classroom, up close.'}</h3><p>{error||'Short clips of practice, student performances and everyday class moments will appear here soon.'}</p></div><span className="coming-soon">Clips coming soon</span></div>}
    </section>
    <section id="reviews" className="section-space reviews-section"><div className="section-heading"><div><p className="eyebrow">In their own words</p><h2>Every student has a story.</h2></div>{reviews.length>1&&<div className="review-controls"><button aria-label={reverse?'Scroll reviews left':'Scroll reviews right'} title="Change scroll direction" onClick={()=>setReverse(!reverse)}>{reverse?<ArrowLeft size={18}/>:<ArrowRight size={18}/>}</button><button aria-label={paused?'Resume review scrolling':'Pause review scrolling'} aria-pressed={paused} onClick={()=>setPaused(!paused)}>{paused?<Play size={18}/>:<Pause size={18}/>}</button></div>}</div>
    {reviews.length ? <div className={`review-window ${reviews.length>1?'moving':''} ${paused?'paused':''} ${reverse?'reverse':''}`} tabIndex={0} aria-label="Student reviews. Automatic scrolling pauses on hover or focus."><div className="review-track"><div className="review-group">{reviews.map(r=><ReviewCard key={r.id} review={r}/>)}</div>{reviews.length>1&&<div className="review-group review-clone" aria-hidden="true">{reviews.map(r=><ReviewCard key={r.id} review={r}/>)}</div>}</div></div> : <div className="community-empty review-empty"><Quote size={30}/><div><h3>{loading?'Loading student stories…':'Your experience belongs here.'}</h3><p>{error||'Learning with Rahul? Tell us how it’s going. Student reviews will appear here once published.'}</p></div></div>}
    <div className="review-actions"><Link href="/reviews" className="button-secondary">Write a website review <ArrowUpRight size={17}/></Link>{!googleReviewUrl&&<span className="quiet-link" aria-label="Google review link not connected">Google reviews · link coming soon</span>}{googleReviewUrl&&<a className="text-link" href={googleReviewUrl} target="_blank" rel="noopener noreferrer">Review on Google <ArrowUpRight size={16}/></a>}{googleMapsUrl&&<a className="quiet-link" href={googleMapsUrl} target="_blank" rel="noopener noreferrer">Read Google reviews <ArrowUpRight size={16}/></a>}</div><p className="review-note">Website and Google reviews are separate. All honest feedback is welcome.</p>
    </section>
  </>;
}
