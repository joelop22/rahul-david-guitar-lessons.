import Link from 'next/link';

export function LegalDraft({title, children}: {title:string;children:React.ReactNode}) {
  return <main id="main-content" className="mx-auto max-w-3xl px-5 py-16 md:px-9 md:py-24">
    <p className="eyebrow">Draft · Owner approval required</p>
    <h1 className="section-title mt-5 text-4xl md:text-5xl">{title}</h1>
    <div className="status-note mt-8">These are setup notes, not approved legal policies. Rahul must review and publish the final policies before taking admission payments.</div>
    <div className="body-muted mt-8 space-y-5 text-sm [&_p]:mb-4">{children}</div>
    <Link href="/join" className="mt-10 inline-flex text-sm font-medium text-[#edac50] hover:text-white">← Back to joining</Link>
  </main>;
}
