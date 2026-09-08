create table public.learner_review_signals (
    user_id uuid not null references auth.users (id) on delete cascade,
    signal_type text not null,
    subject_id text not null,
    signal_key text not null,
    payload jsonb not null,
    active boolean not null,
    changed_at timestamptz not null,
    updated_at timestamptz not null default timezone('utc', now()),

    primary key (user_id, signal_type, subject_id, signal_key),
    constraint learner_review_signals_type
        check (signal_type in ('mistake', 'weak_word')),
    constraint learner_review_signals_subject
        check (
            subject_id = btrim(subject_id)
            and char_length(subject_id) between 1 and 200
        ),
    constraint learner_review_signals_key
        check (
            signal_key = btrim(signal_key)
            and char_length(signal_key) between 1 and 200
        ),
    constraint learner_review_signals_payload
        check (
            jsonb_typeof(payload) = 'object'
            and octet_length(payload::text) <= 16000
        )
);

comment on table public.learner_review_signals is
    'Private versioned mistakes and weak words; inactive rows are tombstones.';

alter table public.learner_review_signals enable row level security;
alter table public.learner_review_signals force row level security;

revoke all on table public.learner_review_signals
from public, anon, authenticated;

grant select on table public.learner_review_signals
to authenticated;

create policy "Learners read their own review signals"
on public.learner_review_signals
for select
to authenticated
using ((select auth.uid()) = user_id);

create function public.sync_review_signal(
    p_signal_type text,
    p_subject_id text,
    p_signal_key text,
    p_payload jsonb,
    p_active boolean,
    p_changed_at timestamptz
)
returns table (
    signal_type text,
    subject_id text,
    signal_key text,
    payload jsonb,
    active boolean,
    changed_at timestamptz,
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
        p_signal_type is null
        or p_signal_type not in ('mistake', 'weak_word')
        or p_subject_id is null
        or p_subject_id <> btrim(p_subject_id)
        or char_length(p_subject_id) not between 1 and 200
        or p_signal_key is null
        or p_signal_key <> btrim(p_signal_key)
        or char_length(p_signal_key) not between 1 and 200
        or p_payload is null
        or jsonb_typeof(p_payload) <> 'object'
        or octet_length(p_payload::text) > 16000
        or p_active is null
        or p_changed_at is null
        or p_changed_at > timezone('utc', now()) + interval '5 minutes'
        or (
            p_signal_type = 'weak_word'
            and (
                not coalesce(jsonb_typeof(p_payload -> 'word') = 'string', false)
                or p_payload ->> 'word' <> btrim(p_payload ->> 'word')
                or char_length(p_payload ->> 'word') not between 1 and 200
                or p_payload ->> 'word' <> p_signal_key
            )
        )
        or (
            p_signal_type = 'mistake'
            and (
                not coalesce(jsonb_typeof(p_payload -> 'lessonId') = 'string', false)
                or p_payload ->> 'lessonId' <> p_subject_id
                or not coalesce(jsonb_typeof(p_payload -> 'id') = 'string', false)
                or p_payload ->> 'id' <> p_signal_key
                or not coalesce(jsonb_typeof(p_payload -> 'sectionId') = 'string', false)
                or not coalesce(jsonb_typeof(p_payload -> 'questionIndex') = 'number', false)
                or not coalesce(jsonb_typeof(p_payload -> 'timestamp') = 'string', false)
            )
        )
    ) then
        raise exception using
            errcode = '22023',
            message = 'invalid_review_signal';
    end if;

    return query
    insert into public.learner_review_signals as signals (
        user_id,
        signal_type,
        subject_id,
        signal_key,
        payload,
        active,
        changed_at
    )
    values (
        learner_id,
        p_signal_type,
        p_subject_id,
        p_signal_key,
        p_payload,
        p_active,
        p_changed_at
    )
    on conflict on constraint learner_review_signals_pkey
    do update set
        active = case
            when excluded.changed_at > signals.changed_at
                then excluded.active
            when excluded.changed_at < signals.changed_at
                then signals.active
            else signals.active and excluded.active
        end,
        payload = case
            when excluded.changed_at > signals.changed_at
                then excluded.payload
            when excluded.changed_at = signals.changed_at
             and signals.active
             and not excluded.active
                then excluded.payload
            else signals.payload
        end,
        changed_at = greatest(
            signals.changed_at,
            excluded.changed_at
        ),
        updated_at = timezone('utc', now())
    returning
        signals.signal_type,
        signals.subject_id,
        signals.signal_key,
        signals.payload,
        signals.active,
        signals.changed_at,
        signals.updated_at;
end;
$$;

revoke all on function public.sync_review_signal(
    text,
    text,
    text,
    jsonb,
    boolean,
    timestamptz
)
from public, anon, authenticated;

grant execute on function public.sync_review_signal(
    text,
    text,
    text,
    jsonb,
    boolean,
    timestamptz
)
to authenticated;
