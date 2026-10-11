import { configured } from './supabase';
export function communityReady(){return configured() && process.env.COMMUNITY_ENABLED === 'true';}
