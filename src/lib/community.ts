import { z } from 'zod';
export const reviewInput = z.object({displayName:z.string().trim().min(2).max(60),rating:z.number().int().min(1).max(5),body:z.string().trim().min(20).max(1200),consent:z.literal(true)}).strict();
export const clipInput = z.object({title:z.string().trim().min(2).max(100),caption:z.string().trim().max(400),videoKey:z.string().regex(/^moments\/[a-f0-9-]{36}\.(mp4|webm)$/),permissionConfirmed:z.literal(true)}).strict();
export type PublicReview = {id:string;display_name:string;rating:number;body:string;created_at:string};
export type PublicMoment = {id:string;title:string;caption:string};
export function googleLink(value:string | undefined) {
  if (!value) return '';
  try { const u = new URL(value); return u.protocol === 'https:' && ['google.com','www.google.com','maps.google.com','google.co.in','www.google.co.in','g.page','maps.app.goo.gl','share.google'].includes(u.hostname) ? u.href : ''; } catch { return ''; }
}
export const googleMapsUrl = googleLink(process.env.NEXT_PUBLIC_GOOGLE_MAPS_URL);
export const googleReviewUrl = googleLink(process.env.NEXT_PUBLIC_GOOGLE_REVIEW_URL);
