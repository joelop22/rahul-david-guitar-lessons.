-- Apply after 20261012_enquiries.sql. Existing admissions/payments remain intact.
create table if not exists public.portal_students (
 id uuid primary key references public.student_enquiries(id),
 account_id uuid unique references public.profiles(id),full_name text not null,
 avatar_key text,goals text not null default '',learning_level text not null default 'beginner',
 joining_date date not null default current_date,created_at timestamptz not null default now()
);
create table if not exists public.portal_courses (
 id uuid primary key default gen_random_uuid(),student_id uuid not null references public.portal_students(id),course_id uuid not null references public.courses(id),
 started_on date not null,completed_on date,
 training_status text not null default 'active' check(training_status in('active','paused','completed')),
 access_status text not null default 'revoked' check(access_status in('active','suspended','revoked')),
 unique(student_id,course_id),check(completed_on is null or completed_on>=started_on)
);
create table if not exists public.portal_sessions (
 id uuid primary key default gen_random_uuid(),student_id uuid not null references public.portal_students(id),course_record_id uuid not null references public.portal_courses(id),
 session_date date not null,attendance text not null check(attendance in('present','absent','excused')),
 feedback text not null default '',private_notes text not null default '',created_at timestamptz not null default now()
);
create table if not exists public.portal_skills (
 id uuid primary key default gen_random_uuid(),student_id uuid not null references public.portal_students(id),course_record_id uuid not null references public.portal_courses(id),
 skill text not null,level integer not null check(level between 0 and 3),assessed_on date not null,feedback text not null default '',created_at timestamptz not null default now()
);
create table if not exists public.portal_assignments (
 id uuid primary key default gen_random_uuid(),student_id uuid not null references public.portal_students(id),course_record_id uuid not null references public.portal_courses(id),
 title text not null,instructions text not null default '',due_on date,lesson_id uuid references public.tutorial_lessons(id),
 practiced_at timestamptz,recording_key text,submitted_at timestamptz,reviewed_at timestamptz,feedback text not null default '',created_at timestamptz not null default now()
);
create table if not exists public.portal_certificates (
 id uuid primary key default gen_random_uuid(),course_record_id uuid not null unique references public.portal_courses(id),student_id uuid not null references public.portal_students(id),
 certificate_number text not null unique default ('RDGL-'||to_char(now(),'YYYY')||'-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,12))),
 student_name text not null,course_name text not null,started_on date not null,completed_on date not null,
 branding jsonb not null,issued_at timestamptz not null default now(),issued_by uuid not null references auth.users(id)
);
do $$ declare t text;begin foreach t in array array['portal_students','portal_courses','portal_sessions','portal_skills','portal_assignments','portal_certificates'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('revoke all on public.%I from anon,authenticated',t);
 execute format('grant all on public.%I to service_role',t);
end loop;end $$;
create index if not exists portal_sessions_student on public.portal_sessions(student_id,session_date desc);
create index if not exists portal_skills_student on public.portal_skills(student_id,assessed_on desc);
create index if not exists portal_assignments_student on public.portal_assignments(student_id,created_at desc);

create or replace function public.portal_link_account(student uuid,account_email text) returns uuid
language plpgsql security definer set search_path='' as $$
declare target uuid;begin
 select u.id into target from auth.users u join public.profiles p on p.id=u.id where lower(u.email)=lower(trim(account_email)) and u.email_confirmed_at is not null and p.role='student';
 if target is null then raise exception 'Student must register and verify this email first';end if;
 if exists(select 1 from public.portal_students where id=student and account_id=target) then return target;end if;
 if exists(select 1 from public.portal_students where id=student and account_id is not null and account_id<>target) then raise exception 'This profile is already linked. Account reassignment requires a reviewed correction.';end if;
 if exists(select 1 from public.portal_courses where student_id=student and access_status='active') then raise exception 'Suspend access before changing the linked account';end if;
 update public.portal_students set account_id=target where id=student;
 if not found then raise exception 'Student profile not found';end if;return target;
end $$;

create or replace function public.portal_course_access(record uuid,new_status text) returns void
language plpgsql security definer set search_path='' as $$
declare p public.portal_courses%rowtype;account uuid;begin
 if new_status not in('active','suspended','revoked') then raise exception 'Invalid access status';end if;
 select * into p from public.portal_courses where id=record for update;if not found then raise exception 'Course not found';end if;
 select account_id into account from public.portal_students where id=p.student_id;
 if account is null then raise exception 'Link the student account first';end if;
 update public.portal_courses set access_status=new_status where id=record;
 update public.enrollments set status=case when new_status='active' then 'active' when new_status='suspended' then 'suspended' else 'revoked' end where profile_id=account and course_id=p.course_id;
end $$;

create or replace function public.portal_complete_course(record uuid,finish_date date,owner_id uuid,template jsonb) returns uuid
language plpgsql security definer set search_path='' as $$
declare p public.portal_courses%rowtype;certificate uuid;student text;course text;begin
 if not exists(select 1 from public.profiles where id=owner_id and role='owner') then raise exception 'Tutor confirmation required';end if;
 select * into p from public.portal_courses where id=record for update;if not found then raise exception 'Course not found';end if;
 select id into certificate from public.portal_certificates where course_record_id=record;if certificate is not null then return certificate;end if;
 if finish_date is null or finish_date<p.started_on or finish_date>(now() at time zone 'Asia/Kolkata')::date then raise exception 'Completion date must be between start date and today';end if;
 select full_name into student from public.portal_students where id=p.student_id;
 select name into course from public.courses where id=p.course_id;
 update public.portal_courses set training_status='completed',completed_on=finish_date where id=record;
 insert into public.portal_certificates(course_record_id,student_id,student_name,course_name,started_on,completed_on,issued_by,branding)
 values(record,p.student_id,student,course,p.started_on,finish_date,owner_id,template) returning id into certificate;
 return certificate;
end $$;

create or replace function public.portal_learning_milestone() returns integer
language sql stable security definer set search_path='' as $$
 select (count(distinct lower(trim(coalesce(u.email,e.email))))/5*5)::integer
 from public.portal_students s join public.student_enquiries e on e.id=s.id left join auth.users u on u.id=s.account_id join public.portal_courses c on c.student_id=s.id where c.training_status='active' and c.started_on<=(now() at time zone 'Asia/Kolkata')::date;
$$;
revoke all on function public.portal_link_account(uuid,text),public.portal_course_access(uuid,text),public.portal_complete_course(uuid,date,uuid,jsonb),public.portal_learning_milestone() from public,anon,authenticated;
grant execute on function public.portal_link_account(uuid,text),public.portal_course_access(uuid,text),public.portal_complete_course(uuid,date,uuid,jsonb),public.portal_learning_milestone() to service_role;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
 values('student-files','student-files',false,50000000,array['image/jpeg','image/png','image/webp','video/mp4','video/webm'])
 on conflict(id) do update set public=false;
