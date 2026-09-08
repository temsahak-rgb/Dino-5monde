create table public.learning_reward_rules (
    activity_type text not null,
    activity_id text not null,
    reward_credits integer not null,
    active boolean not null default true,
    created_at timestamptz not null default timezone('utc', now()),

    primary key (activity_type, activity_id),
    constraint learning_reward_rules_activity_type
        check (activity_type in ('travel_lesson')),
    constraint learning_reward_rules_activity_id
        check (
            activity_id = btrim(activity_id)
            and char_length(activity_id) between 1 and 160
        ),
    constraint learning_reward_rules_reward_credits
        check (reward_credits between 1 and 100)
);

comment on table public.learning_reward_rules is
    'Server-owned allowlist and credit value for learning activities.';

create table public.learner_activity_rewards (
    user_id uuid not null references auth.users (id) on delete cascade,
    activity_type text not null,
    activity_id text not null,
    credits_awarded integer not null,
    awarded_at timestamptz not null default timezone('utc', now()),

    primary key (user_id, activity_type, activity_id),
    foreign key (activity_type, activity_id)
        references public.learning_reward_rules (activity_type, activity_id),
    constraint learner_activity_rewards_credits_awarded
        check (credits_awarded between 1 and 100)
);

comment on table public.learner_activity_rewards is
    'Private, immutable proof that one learner received one activity reward.';

insert into public.learning_reward_rules (
    activity_type,
    activity_id,
    reward_credits
)
values
    ('travel_lesson', 'TR-006', 5),
    ('travel_lesson', 'leon-1-lalphabet', 5),
    ('travel_lesson', 'leon-2-les-nombres', 5),
    ('travel_lesson', 'leon-3-petites-conversations-et-expressions-utiles', 5),
    ('travel_lesson', 'leon-4-laroport-contrle-frontire', 5),
    ('travel_lesson', 'leon-4-suite-wi-fi-problmes-de-bagages', 5),
    ('travel_lesson', 'leon-5-transport-depuis-laroport', 5),
    ('travel_lesson', 'suite-leon-5-transport-depuis-laroport', 5),
    ('travel_lesson', 'leon-6-lhtel', 5),
    ('travel_lesson', 'suite-leon-6-1-utiliser-les-quipements-et-services-de-lhtel', 5),
    ('travel_lesson', 'suite-leon-6-2-se-renseigner-auprs-de-la-rception', 5),
    ('travel_lesson', 'leon-7-banque-bureau-de-change', 5),
    ('travel_lesson', 'lesson-8-telephone-internet', 5),
    ('travel_lesson', 'leon-9-mto-prparation-pour-sortir', 5),
    ('travel_lesson', 'leon-10-petit-djeuner-lhtel', 5),
    ('travel_lesson', 'suite-leon-10-petit-djeuner-lhtel', 5),
    ('travel_lesson', 'leon-11-restaurants-cafs', 5),
    ('travel_lesson', 'leon-12-questions-dans-la-rue', 5),
    ('travel_lesson', 'lesson-13-shopping', 5),
    ('travel_lesson', 'suite 13 shopping', 5),
    ('travel_lesson', 'suite-leon-13-2-supermarch', 5),
    ('travel_lesson', 'suite-leon-13-3-shopping-spcialis', 5),
    ('travel_lesson', 'suite-leon-13-4-accessoires-services-de-rparation', 5),
    ('travel_lesson', 'suite-leon-13-vente-dobjets-personnels-et-dantiquits', 5),
    ('travel_lesson', 'leon-14-visites-tourisme', 5),
    ('travel_lesson', 'leon-15-acheter-des-cartes-postales-et-souvenirs', 5),
    ('travel_lesson', 'suite-leon-15-les-artistes-de-rue-et-lart-de-marchander', 5),
    ('travel_lesson', 'leon-16-problmes-scurit', 5),
    ('travel_lesson', 'leon-17-sant-urgence', 5),
    ('travel_lesson', 'suite-leon-17-sant-urgences', 5),
    ('travel_lesson', 'leon-18-dpart-et-au-revoir', 5);

alter table public.learner_credit_transactions
drop constraint if exists learner_credit_transactions_reference_id_fkey;

alter table public.learner_credit_transactions
drop constraint learner_credit_transactions_reason;

alter table public.learner_credit_transactions
add constraint learner_credit_transactions_reason
check (
    reason in (
        'starter_grant',
        'lesson_purchase',
        'learning_reward'
    )
);

alter table public.learner_credit_transactions
drop constraint learner_credit_transactions_reference;

alter table public.learner_credit_transactions
add constraint learner_credit_transactions_reference
check (
    (reason = 'starter_grant' and reference_id is null)
    or (
        reason in ('lesson_purchase', 'learning_reward')
        and reference_id is not null
        and reference_id = btrim(reference_id)
        and char_length(reference_id) between 1 and 220
    )
);

alter table public.learner_credit_transactions
drop constraint learner_credit_transactions_delta_direction;

alter table public.learner_credit_transactions
add constraint learner_credit_transactions_delta_direction
check (
    (reason = 'starter_grant' and delta > 0)
    or (reason = 'lesson_purchase' and delta < 0)
    or (reason = 'learning_reward' and delta > 0)
);

comment on column public.learner_credit_transactions.reference_id is
    'Stable audit reference. Purchases use a Shop id; rewards use activity_type:activity_id.';

create unique index learner_credit_transactions_one_learning_reward
on public.learner_credit_transactions (user_id, reference_id)
where reason = 'learning_reward';

create function public.prevent_activity_reward_mutation()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
    raise exception using
        errcode = '55000',
        message = 'activity_rewards_are_append_only';
end;
$$;

create trigger learner_activity_rewards_append_only
before update on public.learner_activity_rewards
for each row
execute function public.prevent_activity_reward_mutation();

alter table public.learning_reward_rules enable row level security;
alter table public.learning_reward_rules force row level security;
alter table public.learner_activity_rewards enable row level security;
alter table public.learner_activity_rewards force row level security;

revoke all on table public.learning_reward_rules
from public, anon, authenticated;
revoke all on table public.learner_activity_rewards
from public, anon, authenticated;

grant select on table public.learning_reward_rules
to anon, authenticated;
grant select on table public.learner_activity_rewards
to authenticated;

create policy "Active learning reward rules are public"
on public.learning_reward_rules
for select
to anon, authenticated
using (active);

create policy "Learners read their own activity rewards"
on public.learner_activity_rewards
for select
to authenticated
using ((select auth.uid()) = user_id);

create function public.claim_learning_reward(
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

    select rules.reward_credits
    into reward_amount
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
        reward_amount,
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
            reward_amount,
            wallet_credits,
            reward_awarded_at,
            false;
        return;
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

revoke all on function public.prevent_activity_reward_mutation()
from public, anon, authenticated;
revoke all on function public.claim_learning_reward(text, text)
from public, anon, authenticated;
grant execute on function public.claim_learning_reward(text, text)
to authenticated;
