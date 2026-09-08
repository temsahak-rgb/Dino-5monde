alter table public.learning_reward_rules
drop constraint learning_reward_rules_activity_type;

alter table public.learning_reward_rules
add constraint learning_reward_rules_activity_type
check (
    activity_type in (
        'travel_lesson',
        'hangman_game',
        'word_search_game',
        'crossword_game'
    )
);

alter table public.learning_reward_rules
add column completion_kind text not null default 'lesson_sections';

alter table public.learning_reward_rules
add constraint learning_reward_rules_completion_kind
check (completion_kind in ('lesson_sections', 'game_attempt'));

alter table public.learning_reward_rules
alter column required_sections drop not null;

alter table public.learning_reward_rules
drop constraint learning_reward_rules_required_sections;

alter table public.learning_reward_rules
add constraint learning_reward_rules_completion_requirements
check (
    (
        completion_kind = 'lesson_sections'
        and required_sections is not null
        and cardinality(required_sections) between 1 and 500
    )
    or (
        completion_kind = 'game_attempt'
        and required_sections is null
    )
);

insert into public.learning_reward_rules (
    activity_type,
    activity_id,
    reward_credits,
    completion_kind,
    required_sections
)
values
    ('hangman_game', 'A1', 1, 'game_attempt', null),
    ('hangman_game', 'A2', 1, 'game_attempt', null),
    ('hangman_game', 'B1', 1, 'game_attempt', null),
    ('hangman_game', 'B2', 1, 'game_attempt', null),
    ('hangman_game', 'C1', 1, 'game_attempt', null),
    ('hangman_game', 'C2', 1, 'game_attempt', null),
    ('word_search_game', 'A1', 3, 'game_attempt', null),
    ('word_search_game', 'A2', 3, 'game_attempt', null),
    ('word_search_game', 'B1', 3, 'game_attempt', null),
    ('word_search_game', 'B2', 3, 'game_attempt', null),
    ('word_search_game', 'C1', 3, 'game_attempt', null),
    ('word_search_game', 'C2', 3, 'game_attempt', null),
    ('crossword_game', 'A1', 5, 'game_attempt', null),
    ('crossword_game', 'A2', 5, 'game_attempt', null),
    ('crossword_game', 'B1', 5, 'game_attempt', null),
    ('crossword_game', 'B2', 5, 'game_attempt', null),
    ('crossword_game', 'C1', 5, 'game_attempt', null),
    ('crossword_game', 'C2', 5, 'game_attempt', null);

create table public.learner_game_attempts (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users (id) on delete cascade,
    activity_type text not null,
    activity_id text not null,
    pack_id text not null,
    started_at timestamptz not null default timezone('utc', now()),
    completed_at timestamptz,

    foreign key (activity_type, activity_id)
        references public.learning_reward_rules (activity_type, activity_id),
    constraint learner_game_attempts_activity_type
        check (
            activity_type in (
                'hangman_game',
                'word_search_game',
                'crossword_game'
            )
        ),
    constraint learner_game_attempts_level
        check (activity_id in ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
    constraint learner_game_attempts_pack
        check (
            pack_id = btrim(pack_id)
            and char_length(pack_id) between 1 and 160
        ),
    constraint learner_game_attempts_completion_time
        check (completed_at is null or completed_at >= started_at)
);

comment on table public.learner_game_attempts is
    'Private server-issued game attempts used as bounded reward eligibility proofs.';

create unique index learner_game_attempts_one_open_attempt
on public.learner_game_attempts (
    user_id,
    activity_type,
    activity_id
)
where completed_at is null;

alter table public.learner_game_attempts enable row level security;
alter table public.learner_game_attempts force row level security;

revoke all on table public.learner_game_attempts
from public, anon, authenticated;

grant select on table public.learner_game_attempts
to authenticated;

create policy "Learners read their own game attempts"
on public.learner_game_attempts
for select
to authenticated
using ((select auth.uid()) = user_id);

create function public.start_learning_game(
    p_activity_type text,
    p_activity_id text,
    p_pack_id text
)
returns table (
    attempt_id uuid,
    activity_type text,
    activity_id text,
    pack_id text,
    started_at timestamptz,
    completed_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
    learner_id uuid := auth.uid();
    game_attempt_id uuid;
    game_pack_id text;
    game_started_at timestamptz;
    game_completed_at timestamptz;
begin
    if learner_id is null then
        raise exception using
            errcode = '42501',
            message = 'authentication_required';
    end if;

    if (
        p_activity_type is null
        or p_activity_type not in (
            'hangman_game',
            'word_search_game',
            'crossword_game'
        )
        or p_activity_id is null
        or p_activity_id not in ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')
        or p_pack_id is null
        or p_pack_id <> btrim(p_pack_id)
        or char_length(p_pack_id) not between 1 and 160
    ) then
        raise exception using
            errcode = '22023',
            message = 'invalid_learning_game';
    end if;

    perform pg_catalog.pg_advisory_xact_lock(
        pg_catalog.hashtextextended(
            learner_id::text
            || ':'
            || p_activity_type
            || ':'
            || p_activity_id,
            0
        )
    );

    if not exists (
        select 1
        from public.learning_reward_rules as rules
        where rules.activity_type = p_activity_type
          and rules.activity_id = p_activity_id
          and rules.completion_kind = 'game_attempt'
          and rules.active
    ) then
        raise exception using
            errcode = 'P0002',
            message = 'learning_reward_not_found';
    end if;

    if exists (
        select 1
        from public.learner_activity_rewards as rewards
        where rewards.user_id = learner_id
          and rewards.activity_type = p_activity_type
          and rewards.activity_id = p_activity_id
    ) then
        raise exception using
            errcode = 'P0001',
            message = 'learning_reward_already_awarded';
    end if;

    select
        attempts.id,
        attempts.pack_id,
        attempts.started_at,
        attempts.completed_at
    into
        game_attempt_id,
        game_pack_id,
        game_started_at,
        game_completed_at
    from public.learner_game_attempts as attempts
    where attempts.user_id = learner_id
      and attempts.activity_type = p_activity_type
      and attempts.activity_id = p_activity_id
    order by
        (attempts.completed_at is not null) desc,
        attempts.started_at desc
    limit 1;

    if found then
        return query
        select
            game_attempt_id,
            p_activity_type,
            p_activity_id,
            game_pack_id,
            game_started_at,
            game_completed_at;
        return;
    end if;

    insert into public.learner_game_attempts as attempts (
        user_id,
        activity_type,
        activity_id,
        pack_id
    )
    values (
        learner_id,
        p_activity_type,
        p_activity_id,
        p_pack_id
    )
    returning
        attempts.id,
        attempts.pack_id,
        attempts.started_at,
        attempts.completed_at
    into
        game_attempt_id,
        game_pack_id,
        game_started_at,
        game_completed_at;

    return query
    select
        game_attempt_id,
        p_activity_type,
        p_activity_id,
        game_pack_id,
        game_started_at,
        game_completed_at;
end;
$$;

create function public.complete_learning_game(
    p_attempt_id uuid
)
returns table (
    attempt_id uuid,
    activity_type text,
    activity_id text,
    pack_id text,
    started_at timestamptz,
    completed_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
    learner_id uuid := auth.uid();
    game_activity_type text;
    game_activity_id text;
    game_pack_id text;
    game_started_at timestamptz;
    game_completed_at timestamptz;
begin
    if learner_id is null then
        raise exception using
            errcode = '42501',
            message = 'authentication_required';
    end if;

    if p_attempt_id is null then
        raise exception using
            errcode = '22023',
            message = 'invalid_learning_game_attempt';
    end if;

    select
        attempts.activity_type,
        attempts.activity_id,
        attempts.pack_id,
        attempts.started_at,
        attempts.completed_at
    into
        game_activity_type,
        game_activity_id,
        game_pack_id,
        game_started_at,
        game_completed_at
    from public.learner_game_attempts as attempts
    where attempts.id = p_attempt_id
      and attempts.user_id = learner_id
    for update;

    if not found then
        raise exception using
            errcode = 'P0002',
            message = 'learning_game_attempt_not_found';
    end if;

    if game_completed_at is null then
        update public.learner_game_attempts as attempts
        set completed_at = timezone('utc', now())
        where attempts.id = p_attempt_id
        returning attempts.completed_at
        into game_completed_at;
    end if;

    return query
    select
        p_attempt_id,
        game_activity_type,
        game_activity_id,
        game_pack_id,
        game_started_at,
        game_completed_at;
end;
$$;

create or replace function public.claim_learning_reward(
    p_activity_type text,
    p_activity_id text
)
returns table (
    activity_type text,
    activity_id text,
    credits_awarded integer,
    credits_remaining integer,
    awarded_at timestamptz,
    awarded boolean
)
language plpgsql
security definer
set search_path = ''
as $$
declare
    learner_id uuid := auth.uid();
    reward_amount integer;
    completion_rule text;
    required_section_ids text[];
    existing_reward_amount integer;
    reward_awarded_at timestamptz;
    wallet_credits integer;
    reward_reference text;
begin
    if learner_id is null then
        raise exception using
            errcode = '42501',
            message = 'authentication_required';
    end if;

    if (
        p_activity_type is null
        or p_activity_type <> btrim(p_activity_type)
        or char_length(p_activity_type) not between 1 and 40
        or p_activity_id is null
        or p_activity_id <> btrim(p_activity_id)
        or char_length(p_activity_id) not between 1 and 160
    ) then
        raise exception using
            errcode = '22023',
            message = 'invalid_learning_activity';
    end if;

    select
        rules.reward_credits,
        rules.completion_kind,
        rules.required_sections
    into
        reward_amount,
        completion_rule,
        required_section_ids
    from public.learning_reward_rules as rules
    where rules.activity_type = p_activity_type
      and rules.activity_id = p_activity_id
      and rules.active;

    if reward_amount is null then
        raise exception using
            errcode = 'P0002',
            message = 'learning_reward_not_found';
    end if;

    select wallets.credits
    into wallet_credits
    from public.learner_wallets as wallets
    where wallets.user_id = learner_id
    for update;

    if wallet_credits is null then
        raise exception using
            errcode = 'P0002',
            message = 'learner_wallet_not_found';
    end if;

    select
        rewards.credits_awarded,
        rewards.awarded_at
    into
        existing_reward_amount,
        reward_awarded_at
    from public.learner_activity_rewards as rewards
    where rewards.user_id = learner_id
      and rewards.activity_type = p_activity_type
      and rewards.activity_id = p_activity_id;

    if found then
        return query
        select
            p_activity_type,
            p_activity_id,
            existing_reward_amount,
            wallet_credits,
            reward_awarded_at,
            false;
        return;
    end if;

    if (
        completion_rule = 'lesson_sections'
        and (
            p_activity_type <> 'travel_lesson'
            or not exists (
                select 1
                from public.learner_lesson_progress as progress
                where progress.user_id = learner_id
                  and progress.content_type = 'travel'
                  and progress.lesson_id = p_activity_id
                  and progress.completed_sections @> required_section_ids
            )
        )
    ) or (
        completion_rule = 'game_attempt'
        and not exists (
            select 1
            from public.learner_game_attempts as attempts
            where attempts.user_id = learner_id
              and attempts.activity_type = p_activity_type
              and attempts.activity_id = p_activity_id
              and attempts.completed_at is not null
        )
    ) or completion_rule not in (
        'lesson_sections',
        'game_attempt'
    ) then
        raise exception using
            errcode = 'P0001',
            message = 'learning_activity_incomplete';
    end if;

    insert into public.learner_activity_rewards (
        user_id,
        activity_type,
        activity_id,
        credits_awarded
    )
    values (
        learner_id,
        p_activity_type,
        p_activity_id,
        reward_amount
    )
    returning learner_activity_rewards.awarded_at
    into reward_awarded_at;

    update public.learner_wallets
    set credits = credits + reward_amount
    where user_id = learner_id
    returning credits into wallet_credits;

    reward_reference =
        p_activity_type
        || ':'
        || p_activity_id;

    insert into public.learner_credit_transactions (
        user_id,
        delta,
        balance_after,
        reason,
        reference_id
    )
    values (
        learner_id,
        reward_amount,
        wallet_credits,
        'learning_reward',
        reward_reference
    );

    return query
    select
        p_activity_type,
        p_activity_id,
        reward_amount,
        wallet_credits,
        reward_awarded_at,
        true;
end;
$$;

revoke all on function public.start_learning_game(text, text, text)
from public, anon, authenticated;
revoke all on function public.complete_learning_game(uuid)
from public, anon, authenticated;

grant execute on function public.start_learning_game(text, text, text)
to authenticated;
grant execute on function public.complete_learning_game(uuid)
to authenticated;
