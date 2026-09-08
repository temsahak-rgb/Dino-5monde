create table public.learner_exercise_attempts (
    id uuid primary key,
    user_id uuid not null references auth.users (id) on delete cascade,
    content_type text not null,
    activity_id text not null,
    exercise_id text not null,
    level text,
    correct_answers integer not null,
    total_questions integer not null,
    completed_at timestamptz not null,
    created_at timestamptz not null default timezone('utc', now()),

    constraint learner_exercise_attempts_content_type
        check (
            content_type in (
                'grammar',
                'travel',
                'vocabulary'
            )
        ),
    constraint learner_exercise_attempts_activity_id
        check (
            activity_id = btrim(activity_id)
            and char_length(activity_id) between 1 and 160
            and activity_id !~ '[[:cntrl:]]'
        ),
    constraint learner_exercise_attempts_exercise_id
        check (
            exercise_id = btrim(exercise_id)
            and char_length(exercise_id) between 1 and 160
            and exercise_id !~ '[[:cntrl:]]'
        ),
    constraint learner_exercise_attempts_level
        check (
            (
                content_type = 'vocabulary'
                and level in ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')
            )
            or (
                content_type in ('grammar', 'travel')
                and level is null
            )
        ),
    constraint learner_exercise_attempts_score
        check (
            total_questions between 1 and 200
            and correct_answers between 0 and total_questions
        ),
    constraint learner_exercise_attempts_completed_at
        check (
            completed_at >= timestamptz '2020-01-01 00:00:00+00'
        )
);

comment on table public.learner_exercise_attempts is
    'Private append-only exercise results synchronized idempotently by attempt UUID.';

create index learner_exercise_attempts_user_completed
on public.learner_exercise_attempts (
    user_id,
    completed_at desc
);

create index learner_exercise_attempts_user_activity
on public.learner_exercise_attempts (
    user_id,
    content_type,
    activity_id
);

alter table public.learner_exercise_attempts enable row level security;
alter table public.learner_exercise_attempts force row level security;

revoke all on table public.learner_exercise_attempts
from public, anon, authenticated;

grant select on table public.learner_exercise_attempts
to authenticated;

create policy "Learners read their own exercise attempts"
on public.learner_exercise_attempts
for select
to authenticated
using ((select auth.uid()) = user_id);

create function public.record_exercise_attempt(
    p_attempt_id uuid,
    p_content_type text,
    p_activity_id text,
    p_exercise_id text,
    p_level text,
    p_correct_answers integer,
    p_total_questions integer,
    p_completed_at timestamptz
)
returns table (
    attempt_id uuid,
    content_type text,
    activity_id text,
    exercise_id text,
    level text,
    correct_answers integer,
    total_questions integer,
    completed_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
    learner_id uuid := auth.uid();
    stored_user_id uuid;
    stored_content_type text;
    stored_activity_id text;
    stored_exercise_id text;
    stored_level text;
    stored_correct_answers integer;
    stored_total_questions integer;
    stored_completed_at timestamptz;
begin
    if learner_id is null then
        raise exception using
            errcode = '42501',
            message = 'authentication_required';
    end if;

    if (
        p_attempt_id is null
        or p_content_type is null
        or p_content_type not in ('grammar', 'travel', 'vocabulary')
        or p_activity_id is null
        or p_activity_id <> btrim(p_activity_id)
        or char_length(p_activity_id) not between 1 and 160
        or p_activity_id ~ '[[:cntrl:]]'
        or p_exercise_id is null
        or p_exercise_id <> btrim(p_exercise_id)
        or char_length(p_exercise_id) not between 1 and 160
        or p_exercise_id ~ '[[:cntrl:]]'
        or (
            p_content_type = 'vocabulary'
            and (
                p_level is null
                or p_level not in ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')
            )
        )
        or (
            p_content_type in ('grammar', 'travel')
            and p_level is not null
        )
        or p_total_questions is null
        or p_total_questions not between 1 and 200
        or p_correct_answers is null
        or p_correct_answers not between 0 and p_total_questions
        or p_completed_at is null
        or p_completed_at < timestamptz '2020-01-01 00:00:00+00'
        or p_completed_at > timezone('utc', now()) + interval '5 minutes'
    ) then
        raise exception using
            errcode = '22023',
            message = 'invalid_exercise_attempt';
    end if;

    insert into public.learner_exercise_attempts (
        id,
        user_id,
        content_type,
        activity_id,
        exercise_id,
        level,
        correct_answers,
        total_questions,
        completed_at
    )
    values (
        p_attempt_id,
        learner_id,
        p_content_type,
        p_activity_id,
        p_exercise_id,
        p_level,
        p_correct_answers,
        p_total_questions,
        p_completed_at
    )
    on conflict (id) do nothing;

    select
        attempts.user_id,
        attempts.content_type,
        attempts.activity_id,
        attempts.exercise_id,
        attempts.level,
        attempts.correct_answers,
        attempts.total_questions,
        attempts.completed_at
    into
        stored_user_id,
        stored_content_type,
        stored_activity_id,
        stored_exercise_id,
        stored_level,
        stored_correct_answers,
        stored_total_questions,
        stored_completed_at
    from public.learner_exercise_attempts as attempts
    where attempts.id = p_attempt_id;

    if (
        stored_user_id is null
        or stored_user_id <> learner_id
        or stored_content_type <> p_content_type
        or stored_activity_id <> p_activity_id
        or stored_exercise_id <> p_exercise_id
        or stored_level is distinct from p_level
        or stored_correct_answers <> p_correct_answers
        or stored_total_questions <> p_total_questions
        or stored_completed_at <> p_completed_at
    ) then
        raise exception using
            errcode = 'P0001',
            message = 'exercise_attempt_conflict';
    end if;

    return query
    select
        p_attempt_id,
        stored_content_type,
        stored_activity_id,
        stored_exercise_id,
        stored_level,
        stored_correct_answers,
        stored_total_questions,
        stored_completed_at;
end;
$$;

revoke all on function public.record_exercise_attempt(
    uuid,
    text,
    text,
    text,
    text,
    integer,
    integer,
    timestamptz
)
from public, anon, authenticated;

grant execute on function public.record_exercise_attempt(
    uuid,
    text,
    text,
    text,
    text,
    integer,
    integer,
    timestamptz
)
to authenticated;
