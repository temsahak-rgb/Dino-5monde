create table public.learner_profiles (
    user_id uuid primary key references auth.users (id) on delete cascade,
    display_name text not null,
    avatar_key text not null default 'dino-green',
    show_saurus_suffix boolean not null default true,
    assigned_saurus text,
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now()),

    constraint learner_profiles_display_name_trimmed
        check (display_name = btrim(display_name)),
    constraint learner_profiles_display_name_length
        check (char_length(display_name) between 2 and 40),
    constraint learner_profiles_avatar_key_format
        check (avatar_key ~ '^[a-z0-9][a-z0-9-]{0,39}$'),
    constraint learner_profiles_assigned_saurus_format
        check (
            assigned_saurus is null
            or assigned_saurus ~ '^[a-z0-9][a-z0-9-]{0,39}$'
        )
);

comment on table public.learner_profiles is
    'Private learner identity and future Saurus allocation.';
comment on column public.learner_profiles.assigned_saurus is
    'Server-managed allocation. Null until product allocation rules exist.';

create function public.set_learner_profile_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
    new.updated_at = timezone('utc', now());
    return new;
end;
$$;

create trigger learner_profiles_set_updated_at
before update on public.learner_profiles
for each row
execute function public.set_learner_profile_updated_at();

alter table public.learner_profiles enable row level security;

revoke all on table public.learner_profiles from anon, authenticated;
grant select on table public.learner_profiles to authenticated;
grant insert (
    user_id,
    display_name,
    avatar_key,
    show_saurus_suffix
) on public.learner_profiles to authenticated;
grant update (
    display_name,
    avatar_key,
    show_saurus_suffix
) on public.learner_profiles to authenticated;

revoke all on function public.set_learner_profile_updated_at()
from public, anon, authenticated;

create policy "Learners read their own profile"
on public.learner_profiles
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Learners create their own profile"
on public.learner_profiles
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Learners update their own profile"
on public.learner_profiles
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
