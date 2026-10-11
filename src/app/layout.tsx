import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Header } from '@/components/header';

export const metadata: Metadata = {
  title: { default: 'Rahul David Guitar Lessons | Elamakkara, Kochi', template: '%s | Rahul David Guitar Lessons' },
  description: 'Learn guitar with Rahul David. Beginner, intermediate and advanced guitar lessons, online and in Elamakkara, Kochi.',
};
export const viewport: Viewport = { themeColor: '#131515', width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body><Header/>{children}</body></html>;
}
