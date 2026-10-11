-- Public classroom clips are separate from paid tutorial videos.
create table if not exists public.class_moments (
 id uuid primary key default gen_random_uuid(),
 title text not null check(char_length(title) between 2 and 100),
 caption text not null default '' check(char_length(caption)<=400),
 video_key text not null unique check(video_key ~ '^moments/[a-f0-9-]{36}\.(mp4|webm)$'),
 permission_confirmed boolean not null default false,
 is_published boolean not null default false,
 created_by uuid references auth.users(id) on delete set null,
 created_at timestamptz not null default now(),
 check(not is_published or permission_confirmed)
);
create table if not exists public.site_reviews (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null unique references auth.users(id) on delete cascade,
 display_name text not null check(char_length(display_name) between 2 and 60),
 rating integer not null check(rating between 1 and 5),
 body text not null check(char_length(body) between 20 and 1200),
 consent boolean not null default false,
 status text not null default 'pending' check(status in('pending','approved','rejected')),
 moderation_reason text check(char_length(moderation_reason)<=300),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 check(status<>'approved' or consent)
);
alter table public.class_moments enable row level security;
alter table public.site_reviews enable row level security;
-- All reads and writes pass through server routes: never expose user IDs to visitors.
revoke all on public.class_moments,public.site_reviews from anon,authenticated;
grant all on public.class_moments,public.site_reviews to service_role;
create index if not exists ix_moments_published on public.class_moments(is_published,created_at desc);
create index if not exists ix_reviews_status on public.site_reviews(status,created_at desc);
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
 values('class-moments','class-moments',false,50000000,array['video/mp4','video/webm'])
 on conflict(id) do update set public=false,file_size_limit=50000000,allowed_mime_types=array['video/mp4','video/webm'];
-- No public storage policies: published clips use short-lived signed playback URLs.
