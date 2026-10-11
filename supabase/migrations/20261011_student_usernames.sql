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
