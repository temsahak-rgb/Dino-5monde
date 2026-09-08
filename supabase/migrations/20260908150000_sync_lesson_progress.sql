create table public.learner_lesson_progress (
    user_id uuid not null references auth.users (id) on delete cascade,
    content_type text not null,
    lesson_id text not null,
    status text not null,
    completed_sections text[] not null default '{}',
    current_section integer not null default 0,
    last_accessed timestamptz not null,
    updated_at timestamptz not null default timezone('utc', now()),

    primary key (user_id, content_type, lesson_id),
    constraint learner_lesson_progress_content_type
        check (content_type in ('grammar', 'travel')),
    constraint learner_lesson_progress_lesson_id
        check (
            lesson_id = btrim(lesson_id)
            and char_length(lesson_id) between 1 and 160
        ),
    constraint learner_lesson_progress_status
        check (status in ('not_started', 'in_progress', 'completed')),
    constraint learner_lesson_progress_current_section
        check (current_section between 0 and 10000),
    constraint learner_lesson_progress_sections
        check (cardinality(completed_sections) <= 500)
);

comment on table public.learner_lesson_progress is
    'Private monotonic lesson progress shared across a learner devices.';

alter table public.learner_lesson_progress enable row level security;
alter table public.learner_lesson_progress force row level security;

revoke all on table public.learner_lesson_progress
from public, anon, authenticated;

grant select on table public.learner_lesson_progress
to authenticated;

create policy "Learners read their own lesson progress"
on public.learner_lesson_progress
for select
to authenticated
using ((select auth.uid()) = user_id);

create function public.sync_lesson_progress(
    p_content_type text,
    p_lesson_id text,
    p_status text,
    p_completed_sections text[],
    p_current_section integer,
    p_last_accessed timestamptz
)
returns table (
    content_type text,
    lesson_id text,
    status text,
    completed_sections text[],
    current_section integer,
    last_accessed timestamptz,
    updated_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
    learner_id uuid := auth.uid();
begin
    if learner_id is null then
        raise exception using
            errcode = '42501',
            message = 'authentication_required';
    end if;

    if (
        p_content_type is null
        or p_content_type not in ('grammar', 'travel')
        or p_lesson_id is null
        or p_lesson_id <> btrim(p_lesson_id)
        or char_length(p_lesson_id) not between 1 and 160
        or p_status is null
        or p_status not in ('not_started', 'in_progress', 'completed')
        or p_completed_sections is null
        or cardinality(p_completed_sections) > 500
        or exists (
            select 1
            from unnest(p_completed_sections) as section_id
            where section_id is null
               or section_id <> btrim(section_id)
               or char_length(section_id) not between 1 and 160
        )
        or p_current_section is null
        or p_current_section not between 0 and 10000
        or p_last_accessed is null
        or p_last_accessed > timezone('utc', now()) + interval '5 minutes'
    ) then
        raise exception using
            errcode = '22023',
            message = 'invalid_lesson_progress';
    end if;

    return query
    insert into public.learner_lesson_progress as progress (
        user_id,
        content_type,
        lesson_id,
        status,
        completed_sections,
        current_section,
        last_accessed
    )
    values (
        learner_id,
        p_content_type,
        p_lesson_id,
        p_status,
        array(
            select distinct section_id
            from unnest(p_completed_sections) as section_id
            order by section_id
        ),
        p_current_section,
        p_last_accessed
    )
    on conflict on constraint learner_lesson_progress_pkey
    do update set
        status = case
            when progress.status = 'completed'
              or excluded.status = 'completed'
                then 'completed'
            when progress.status = 'in_progress'
              or excluded.status = 'in_progress'
                then 'in_progress'
            else 'not_started'
        end,
        completed_sections = array(
            select distinct section_id
            from unnest(
                progress.completed_sections
                || excluded.completed_sections
            ) as section_id
            order by section_id
        ),
        current_section = greatest(
            progress.current_section,
            excluded.current_section
        ),
        last_accessed = greatest(
            progress.last_accessed,
            excluded.last_accessed
        ),
        updated_at = timezone('utc', now())
    returning
        progress.content_type,
        progress.lesson_id,
        progress.status,
        progress.completed_sections,
        progress.current_section,
        progress.last_accessed,
        progress.updated_at;
end;
$$;

revoke all on function public.sync_lesson_progress(
    text,
    text,
    text,
    text[],
    integer,
    timestamptz
)
from public, anon, authenticated;

grant execute on function public.sync_lesson_progress(
    text,
    text,
    text,
    text[],
    integer,
    timestamptz
)
to authenticated;
