-- Run this in a fresh Supabase project SQL editor.
-- Be sure to keep SUPABASE_SERVICE_ROLE_KEY server-only.
create extension if not exists pgcrypto;

create table if not exists public.courses (
 id uuid primary key default gen_random_uuid(),
 name text not null, slug text not null unique, description text,
 level text not null check(level in('beginner','intermediate','advanced')),
 sort_order int not null default 0,
 is_active boolean not null default true,
 created_at timestamptz not null default now()
);
create table if not exists public.batches (
 id uuid primary key default gen_random_uuid(),
 course_id uuid not null references public.courses(id),
 mode text not null check(mode in('online','offline','home')),
 label text not null, schedule_description text,
 fee_paise integer not null check(fee_paise>0),
 capacity integer check(capacity is null or capacity>0),
 is_active boolean not null default true,
 created_at timestamptz not null default now()
);
create table if not exists public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 full_name text,
 role text not null default 'student' check(role in('student','owner')),
 created_at timestamptz not null default now()
);
create or replace function public.handle_new_auth_user() returns trigger
 language plpgsql security definer set search_path=public as $$
begin
 insert into public.profiles(id,full_name,role) values(new.id,coalesce(new.raw_user_meta_data->>'full_name',''),'student')
 on conflict(id) do nothing;
 return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_auth_user();

create table if not exists public.admissions (
 id uuid primary key default gen_random_uuid(),
 admission_number text not null unique default ('RDGL-'||to_char(now(),'YYYY')||'-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,10))),
 user_id uuid not null references auth.users(id),
 student_name text not null, phone text not null, email text not null,
 age integer check(age is null or age between 1 and 120),
 guardian_name text, guardian_phone text,
 preferred_language text not null default 'malayalam' check(preferred_language in('malayalam','english')),
 preferred_days text, preferred_time text,
 home_address text, musical_goals text,
 experience_level text not null check(experience_level in('beginner','intermediate','advanced')),
 course_id uuid not null references public.courses(id),
 batch_id uuid not null references public.batches(id),
 course_name_snapshot text not null, batch_label_snapshot text not null,
 mode_snapshot text not null check(mode_snapshot in('online','offline','home')),
 base_fee_paise integer not null check(base_fee_paise>0),
 travel_charge_paise integer check(travel_charge_paise is null or travel_charge_paise>=0),
 quote_approved_at timestamptz,
 amount_due_paise integer not null check(amount_due_paise>0),
 constraint valid_admission_total check(amount_due_paise=base_fee_paise+coalesce(travel_charge_paise,0)),
 terms_accepted_at timestamptz not null,
 status text not null default 'pending_payment' check(status in('awaiting_quote','pending_payment','paid','cancelled','refunded')),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.payments (
 id uuid primary key default gen_random_uuid(),
 admission_id uuid not null references public.admissions(id),
 razorpay_order_id text not null unique,
 razorpay_payment_id text unique,
 amount_paise integer not null check(amount_paise>0),
 currency text not null default 'INR' check(currency='INR'),
 status text not null default 'created' check(status in('created','authorized','captured','failed','refunded')),
 checkout_verified_at timestamptz, captured_at timestamptz,
 created_at timestamptz not null default now()
);
create unique index if not exists only_one_active_order_per_admission
 on public.payments(admission_id) where status in('created','authorized','captured');
create table if not exists public.enrollments (
 id uuid primary key default gen_random_uuid(),
 profile_id uuid not null references public.profiles(id),
 admission_id uuid not null unique references public.admissions(id),
 course_id uuid not null references public.courses(id),
 status text not null default 'active' check(status in('active','suspended','revoked')),
 activated_at timestamptz not null default now()
);
create table if not exists public.tutorial_modules (
 id uuid primary key default gen_random_uuid(),
 course_id uuid not null references public.courses(id),
 title text not null, description text,
 sort_order int not null default 0,
 is_published boolean not null default false,
 created_at timestamptz not null default now()
);
create table if not exists public.tutorial_lessons (
 id uuid primary key default gen_random_uuid(),
 module_id uuid not null references public.tutorial_modules(id) on delete cascade,
 title text not null, description text,
 video_key text not null, duration_seconds int,
 sort_order int not null default 0,
 is_published boolean not null default false,
 created_at timestamptz not null default now()
);
create table if not exists public.lesson_progress (
 id uuid primary key default gen_random_uuid(),
 profile_id uuid not null references public.profiles(id),
 lesson_id uuid not null references public.tutorial_lessons(id) on delete cascade,
 completed_at timestamptz,
 unique(profile_id,lesson_id)
);
create table if not exists public.webhook_events (
 id text primary key, event_type text not null, processed_at timestamptz not null default now()
);

create index if not exists ix_batches_course on public.batches(course_id,is_active);
create index if not exists ix_admissions_user on public.admissions(user_id,created_at desc);
create index if not exists ix_admissions_batch on public.admissions(batch_id,status);
create index if not exists ix_payments_admission on public.payments(admission_id);
create index if not exists ix_enrollments_profile on public.enrollments(profile_id,status);
create index if not exists ix_lessons_module on public.tutorial_lessons(module_id,is_published);

-- RLS: public course browsing, student reads of own admissions and lessons.
alter table public.courses enable row level security;
alter table public.batches enable row level security;
alter table public.profiles enable row level security;
alter table public.admissions enable row level security;
alter table public.payments enable row level security;
alter table public.enrollments enable row level security;
alter table public.tutorial_modules enable row level security;
alter table public.tutorial_lessons enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.webhook_events enable row level security;

create policy "browse active courses" on public.courses for select to anon,authenticated using(is_active);
create policy "browse active batches" on public.batches for select to anon,authenticated using(is_active);
create policy "own profile" on public.profiles for select to authenticated using(id=(select auth.uid()));
create policy "own admissions" on public.admissions for select to authenticated using(user_id=(select auth.uid()));
create policy "own payments" on public.payments for select to authenticated using(
 exists(select 1 from public.admissions a where a.id=admission_id and a.user_id=(select auth.uid())));
create policy "own enrollments" on public.enrollments for select to authenticated using(profile_id=(select auth.uid()));
create policy "active modules only" on public.tutorial_modules for select to authenticated using(
 is_published and exists(select 1 from public.enrollments e where e.course_id=course_id and e.profile_id=(select auth.uid()) and e.status='active'));
create policy "active lessons only" on public.tutorial_lessons for select to authenticated using(
 is_published and exists(select 1 from public.tutorial_modules m join public.enrollments e on e.course_id=m.course_id where m.id=module_id and m.is_published and e.profile_id=(select auth.uid()) and e.status='active'));
create policy "own progress read" on public.lesson_progress for select to authenticated using(profile_id=(select auth.uid()));
-- No browser inserts into payments/enrollments/tutorials. The server controls writes.

-- Dedicated atomic transaction to record a verified captured payment and grant access.
create or replace function public.confirm_captured_payment(p_order_id text,p_payment_id text,p_checkout_verified boolean default false)
 returns uuid language plpgsql security definer set search_path=public,pg_temp as $$
declare pay public.payments%rowtype; a public.admissions%rowtype; b public.batches%rowtype; paid_count integer;
begin
 select * into pay from public.payments where razorpay_order_id=p_order_id for update;
 if not found then raise exception 'Unknown order'; end if;
 select * into a from public.admissions where id=pay.admission_id for update;
 if not found or a.amount_due_paise<>pay.amount_paise or pay.currency<>'INR' then raise exception 'Payment mismatch'; end if;
 if pay.status='captured' then
   if pay.razorpay_payment_id<>p_payment_id then raise exception 'Payment ID mismatch'; end if;
   return a.id;
 end if;
 if pay.status not in('created','authorized') or a.status<>'pending_payment' then raise exception 'Invalid payment state'; end if;
 -- Serialise enrollment capacity checks for each batch.
 perform pg_advisory_xact_lock(hashtext(a.batch_id::text));
 select * into b from public.batches where id=a.batch_id;
 if b.capacity is not null then
  select count(*) into paid_count from public.admissions where batch_id=a.batch_id and status='paid';
  if paid_count>=b.capacity then raise exception 'Batch capacity exceeded; manual refund needed'; end if;
 end if;
 update public.payments set status='captured',razorpay_payment_id=p_payment_id,captured_at=now(),
    checkout_verified_at=case when p_checkout_verified then now() else checkout_verified_at end
  where id=pay.id;
 update public.admissions set status='paid',updated_at=now() where id=a.id;
 insert into public.enrollments(profile_id,admission_id,course_id,status)
  values(a.user_id,a.id,a.course_id,'active') on conflict(admission_id) do nothing;
 return a.id;
end $$;
revoke all on function public.confirm_captured_payment(text,text,boolean) from public,anon,authenticated;
grant execute on function public.confirm_captured_payment(text,text,boolean) to service_role;

-- Private video bucket (50MB per file, good for short lessons; long videos should use a transcoding platform).
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
 values('tutorial-videos','tutorial-videos',false,50000000,array['video/mp4','video/webm'])
 on conflict(id) do update set public=false;

insert into public.courses(name,slug,description,level,sort_order) values
 ('Beginner Guitar','beginner','Chords, strumming and your first songs.','beginner',1),
 ('Intermediate Guitar','intermediate','Timing, technique and confidence.','intermediate',2),
 ('Advanced Guitar','advanced','Musical expression and advanced technique.','advanced',3)
on conflict(slug) do nothing;
-- Confirmed monthly prices (4 lessons): online 45 min ₹1,800; offline 60 min ₹2,000;
-- home 60 min ₹2,000 plus owner-approved travel quote.
-- NO BATCHES INSERTED. Schedule options must be confirmed and published by Rahul.
-- When creating approved course options, use mode=online/offline/home with fee_paise
-- respectively 180000/200000/200000. Never publish a made-up time or seat availability.
-- IMPORTANT: Promote Rahul's Supabase Auth profile to owner manually in SQL editor:
-- update public.profiles set role='owner' where id='CONFIRMED-RAHUL-AUTH-USER-UUID';
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

-- Run once in the existing project. No passwords or existing accounts are changed.
create table if not exists public.student_usernames (
 user_id uuid primary key references auth.users(id) on delete cascade,
 username text not null unique check(username ~ '^[a-z0-9_]{3,24}$')
);
alter table public.student_usernames enable row level security;
revoke all on public.student_usernames from anon, authenticated;
grant select on public.student_usernames to authenticated;
grant all on public.student_usernames to service_role;
drop policy if exists "read own username" on public.student_usernames;
create policy "read own username" on public.student_usernames for select to authenticated using(user_id=(select auth.uid()));

create or replace function public.set_student_username(new_username text) returns void
language plpgsql security definer set search_path='' as $$
declare normalized text := lower(trim(new_username));
begin
 if auth.uid() is null then raise exception 'Sign in first'; end if;
 if not exists(select 1 from auth.users where id=auth.uid() and email_confirmed_at is not null) then raise exception 'Verify your email first'; end if;
 if normalized is null or normalized !~ '^[a-z0-9_]{3,24}$' then raise exception 'Use 3–24 letters, numbers or underscores'; end if;
 insert into public.student_usernames(user_id,username) values(auth.uid(),normalized)
 on conflict(user_id) do update set username=excluded.username;
end $$;
revoke all on function public.set_student_username(text) from public,anon;
grant execute on function public.set_student_username(text) to authenticated;

-- Only the server secret can resolve usernames; emails are never returned to visitors.
create or replace function public.student_login_email(login_username text) returns text
language sql stable security definer set search_path='' as $$
 select u.email::text from public.student_usernames n join auth.users u on u.id=n.user_id
 where n.username=lower(trim(login_username)) and u.email_confirmed_at is not null;
$$;
revoke all on function public.student_login_email(text) from public,anon,authenticated;
grant execute on function public.student_login_email(text) to service_role;
