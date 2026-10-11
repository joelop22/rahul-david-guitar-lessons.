import { cp, mkdir, readFile, writeFile, rm, symlink } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

// Export the shared UI to a private, static review site. The original Next.js
// routes, payment handlers and auth guards stay in src for the configured app.
const root = process.cwd();
const preview = path.join(root, '.openai/ui-preview');
await rm(preview, { recursive: true, force: true });
await mkdir(preview, { recursive: true });
for (const file of ['src', 'public', 'tsconfig.json', 'postcss.config.mjs']) {
  await cp(path.join(root, file), path.join(preview, file), { recursive: true });
}
const pkg = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
await writeFile(path.join(preview, 'package.json'), JSON.stringify({ ...pkg, scripts: { build: 'next build' } }, null, 2));
await symlink(path.join(root, 'node_modules'), path.join(preview, 'node_modules'), 'dir');
for (const route of ['api', 'auth', 'admin', 'payment', 'student']) await rm(path.join(preview, 'src/app', route), { recursive: true, force: true });
await rm(path.join(preview, 'src/middleware.ts'), { force: true });
await writeFile(path.join(preview, 'next.config.mjs'), `export default { output: 'export', trailingSlash: true, poweredByHeader: false, images: { unoptimized: true }, eslint: { ignoreDuringBuilds: true }, experimental: { cpus: 2 } };\n`);
await writeFile(path.join(preview, 'src/app/courses/page.tsx'), `
import { CoursesView } from '@/components/courses-view';
import { previewCourses } from '@/lib/catalog';
export const metadata = { title: 'Guitar courses' };
export default function CoursesPage() { return <CoursesView courses={previewCourses.map((course,index) => ({ ...course, id: 'preview-'+index, is_active: true, batches: [] }))}/>; }
`);
await writeFile(path.join(preview, 'src/app/join/preview-join.tsx'), `
'use client';
import { useSearchParams } from 'next/navigation';
import { AdmissionsView } from '@/components/admissions-view';
import { previewCourses } from '@/lib/catalog';
export function PreviewJoin() {
  const params = useSearchParams();
  return <AdmissionsView courses={previewCourses.map((course,index) => ({ ...course, id: 'preview-'+index, is_active: true, batches: [] }))} preferredCourse={params.get('course') || ''} preferredMode={params.get('mode') || 'online'} configured={false}/>;
}
`);
await writeFile(path.join(preview, 'src/app/join/page.tsx'), `
import { Suspense } from 'react';
import { PreviewJoin } from './preview-join';
export const metadata = { title: 'Apply for admission' };
export default function JoinPage() { return <Suspense fallback={<main id="main-content" className="page-width page-intro"><h1>Apply for admission</h1><p>Opening your admission form…</p></main>}><PreviewJoin/></Suspense>; }
`);
await mkdir(path.join(preview, 'src/app/student/tutorials'), { recursive: true });
await writeFile(path.join(preview, 'src/app/student/tutorials/page.tsx'), `export { default, metadata } from '../../login/page';\n`);
// A public preview must never send authentication emails, admit students or
// start a checkout, even if the local developer has configured credentials.
const env = { ...process.env, NEXT_PUBLIC_SUPABASE_URL: '', NEXT_PUBLIC_SUPABASE_ANON_KEY: '', SUPABASE_SERVICE_ROLE_KEY: '', RAZORPAY_KEY_ID: '', RAZORPAY_KEY_SECRET: '', ADMISSIONS_ENABLED: 'false', COMMUNITY_ENABLED: 'false', NEXT_TELEMETRY_DISABLED: '1' };
const result = spawnSync(process.execPath, [path.join(root, 'node_modules/next/dist/bin/next'), 'build'], { cwd: preview, env, stdio: 'inherit' });
if (result.status !== 0) process.exit(result.status || 1);
await rm(path.join(root, 'dist'), { recursive: true, force: true });
await cp(path.join(preview, 'out'), path.join(root, 'dist'), { recursive: true });
console.log('Private UI preview exported to dist. Application source and backend routes preserved.');
