'use client';
import { useState } from 'react';
import { supabaseBrowser } from '@/lib/browser';

type Item = { id: string; name: string };
type Module = { id: string; title: string; course_id: string };

export function AdminEditor({ courses, modules: initial }: { courses: Item[]; modules: Module[] }) {
  const [courseId, setCourseId] = useState(courses[0]?.id || '');
  const [moduleName, setModuleName] = useState('');
  const [modules, setModules] = useState(initial);
  const [moduleId, setModuleId] = useState(initial.find(m => m.course_id === courses[0]?.id)?.id || '');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [video, setVideo] = useState<File | null>(null);
  const [published, setPublished] = useState(true);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const forCourse = modules.filter(m => m.course_id === courseId);

  async function createModule(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setStatus('');
    try {
      const res = await fetch('/api/admin/modules', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({courseId, title: moduleName}) });
      const data = await res.json();
      if (!res.ok) throw Error(data.error || 'Could not create module');
      setModules(old => [...old, data.module]); setModuleId(data.module.id); setModuleName(''); setStatus('Module created.');
    } catch (caught) { setStatus(caught instanceof Error ? caught.message : 'Could not create module'); }
    finally { setBusy(false); }
  }

  async function uploadLesson(event: React.FormEvent) {
    event.preventDefault(); setStatus('');
    if (!video || !moduleId) { setStatus('Select a module and video file first.'); return; }
    setBusy(true);
    try {
      const init = await fetch('/api/admin/tutorials/upload-url', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({courseId, fileName: video.name, size: video.size, mimeType: video.type}) });
      const access = await init.json();
      if (!init.ok) throw Error(access.error || 'Upload setup failed');
      const { error: uploadError } = await supabaseBrowser().storage.from('tutorial-videos').uploadToSignedUrl(access.path, access.token, video, { contentType: video.type });
      if (uploadError) throw uploadError;
      const res = await fetch('/api/admin/tutorials', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({moduleId, title, description, videoKey: access.path, isPublished: published}) });
      const result = await res.json();
      if (!res.ok) throw Error(result.error || 'Lesson could not be saved');
      setTitle(''); setDescription(''); setVideo(null); setStatus(`Lesson "${result.lesson.title}" uploaded successfully.`);
    } catch (caught) { setStatus(caught instanceof Error ? caught.message : 'Upload failed'); }
    finally { setBusy(false); }
  }

  return <div className="mt-11 grid gap-5 md:grid-cols-2">
    <form onSubmit={createModule} className="dark-panel rounded-xl p-6 sm:p-7">
      <h2 className="font-sans text-xl font-medium tracking-tight">01 / Create a module</h2>
      <p className="mt-2 text-xs leading-6 text-[#a3a6ac]">For example: First chords or Fingerstyle basics.</p>
      <label className="field-label mt-6" htmlFor="admin-course">Course</label>
      <select id="admin-course" className="field-control" value={courseId} onChange={event => { setCourseId(event.target.value); setModuleId(modules.find(m => m.course_id === event.target.value)?.id || ''); }}>
        {courses.map(course => <option key={course.id} value={course.id}>{course.name}</option>)}
      </select>
      <label className="field-label mt-5" htmlFor="admin-module-name">Module name</label>
      <input id="admin-module-name" required className="field-control" value={moduleName} onChange={event => setModuleName(event.target.value)} placeholder="e.g. First chords"/>
      <button disabled={busy || !courseId} className="button-primary mt-6 w-full">Create module</button>
    </form>
    <form onSubmit={uploadLesson} className="dark-panel rounded-xl p-6 sm:p-7">
      <h2 className="font-sans text-xl font-medium tracking-tight">02 / Upload a lesson</h2>
      <label className="field-label mt-6" htmlFor="admin-module">Module</label>
      <select id="admin-module" required value={moduleId} onChange={event => setModuleId(event.target.value)} className="field-control"><option value="">Select module</option>{forCourse.map(module => <option key={module.id} value={module.id}>{module.title}</option>)}</select>
      <label className="field-label mt-5" htmlFor="admin-title">Lesson title</label>
      <input id="admin-title" required value={title} onChange={event => setTitle(event.target.value)} className="field-control" placeholder="e.g. Learn the C major chord"/>
      <label className="field-label mt-5" htmlFor="admin-desc">Description</label>
      <textarea id="admin-desc" value={description} onChange={event => setDescription(event.target.value)} className="field-control min-h-[108px]" rows={3} placeholder="What will students learn?"/>
      <label className="field-label mt-5" htmlFor="admin-video">Video file · MP4/WebM · up to 50 MB</label>
      <input id="admin-video" required accept="video/mp4,video/webm" type="file" onChange={event => setVideo(event.target.files?.[0] || null)} className="w-full text-xs text-[#b8c0c8] file:mr-3 file:rounded-md file:border file:border-[#42464b] file:bg-[#292c31] file:px-3 file:py-2 file:text-xs file:text-white"/>
      <label className="mt-6 flex items-center gap-3 text-sm text-[#d7d9dd]"><input type="checkbox" checked={published} onChange={event => setPublished(event.target.checked)} className="h-4 w-4 accent-[#edac50]"/> Publish after upload</label>
      <button disabled={busy || !moduleId} className="button-primary mt-6 w-full">{busy ? 'Working…' : 'Upload private lesson'}</button>
    </form>
    {status && <p role="status" className="status-note md:col-span-2">{status}</p>}
  </div>;
}
