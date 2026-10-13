'use client';
import { useEffect, useState } from 'react';

export function VideoPlayer({ lessonId }: { lessonId: string }) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const response = await fetch(`/api/student/lessons/${lessonId}/playback`, { cache: 'no-store' });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Playback unavailable');
        if (active) setUrl(data.url);
      } catch (caught) {
        if (active) setError(caught instanceof Error ? caught.message : 'Playback unavailable');
      }
    }
    void load();
    return () => { active = false; };
  }, [lessonId]);

  return <div className="mt-10 overflow-hidden rounded-xl border border-[#343737] bg-[#1c1e1e]">
    {url ? <video controls controlsList="nodownload" playsInline src={url} className="aspect-video w-full bg-black">Your browser does not support video playback.</video>
      : <div className="flex aspect-video items-center justify-center p-8 text-center text-sm text-[#c0c5cb]">{error || 'Preparing private video playback…'}</div>}
    <p className="p-5 text-xs leading-6 text-[#8e959c]">Lesson playback is linked to your active course access. Video links expire automatically. Please don’t share course content.</p>
  </div>;
}
