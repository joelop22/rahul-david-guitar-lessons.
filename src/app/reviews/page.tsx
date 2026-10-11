import { Footer } from '@/components/footer';
import { ReviewForm } from './review-form';
export const metadata={title:'Share your experience'};
export default function ReviewsPage(){const enabled=Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL&&process.env.SUPABASE_SERVICE_ROLE_KEY&&process.env.COMMUNITY_ENABLED==='true');return <><main id="main-content" className="page-width"><div className="page-intro"><p className="eyebrow">Student stories</p><h1>How’s your music<br/>coming along?</h1><p>Share an honest review of your lessons with Rahul. Your public name and review will appear on the website after moderation. Your email stays private.</p></div><ReviewForm enabled={enabled}/></main><Footer/></>}
