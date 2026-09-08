alter table public.learning_reward_rules
add column required_sections text[];

with completion_rules (
    activity_id,
    required_sections
) as (
    values
        ('TR-006', array['TR-006-1', 'TR-006-2', 'TR-006-3', 'TR-006-4']::text[]),
        ('leon-1-lalphabet', array['section-1', 'section-2', 'note-1']::text[]),
        ('leon-2-les-nombres', array['section-1', 'section-2', 'section-3', 'section-4', 'section-5', 'note-1']::text[]),
        ('leon-3-petites-conversations-et-expressions-utiles', array['section-1', 'section-2', 'section-3', 'section-4', 'section-5', 'section-6', 'section-7']::text[]),
        ('leon-4-laroport-contrle-frontire', array['section-1', 'section-2', 'section-3']::text[]),
        ('leon-4-suite-wi-fi-problmes-de-bagages', array['section-1', 'section-2', 'section-3', 'note-1', 'note-2']::text[]),
        ('leon-5-transport-depuis-laroport', array['section-1', 'section-2', 'section-3', 'tip-1', 'note-1', 'note-2']::text[]),
        ('suite-leon-5-transport-depuis-laroport', array['section-1', 'section-2', 'tip-1', 'note-1']::text[]),
        ('leon-6-lhtel', array['section-1', 'section-2', 'section-3', 'section-4', 'tip-1', 'note-1']::text[]),
        ('suite-leon-6-1-utiliser-les-quipements-et-services-de-lhtel', array['section-1', 'section-2', 'section-3', 'section-4', 'tip-1', 'note-1']::text[]),
        ('suite-leon-6-2-se-renseigner-auprs-de-la-rception', array['section-1', 'section-2', 'section-3', 'section-4', 'section-5', 'tip-1', 'tip-2', 'note-1', 'note-2', 'note-3']::text[]),
        ('leon-7-banque-bureau-de-change', array['section-1', 'section-2', 'section-3', 'tip-1', 'warning-1', 'note-1']::text[]),
        ('lesson-8-telephone-internet', array['section-1', 'section-2', 'section-3', 'section-5', 'tip-1', 'tip-2', 'warning-1', 'note-1', 'note-2']::text[]),
        ('leon-9-mto-prparation-pour-sortir', array['section-1', 'section-2', 'section-3', 'tip-1', 'note-1']::text[]),
        ('leon-10-petit-djeuner-lhtel', array['section-1', 'section-2', 'section-3', 'tip-1', 'tip-2', 'note-1', 'note-2']::text[]),
        ('suite-leon-10-petit-djeuner-lhtel', array['section-1', 'section-2', 'section-3', 'section-4', 'note-1']::text[]),
        ('leon-11-restaurants-cafs', array['section-1', 'section-2', 'section-3', 'section-4', 'section-5', 'tip-1', 'note-1']::text[]),
        ('leon-12-questions-dans-la-rue', array['section-1', 'section-2', 'section-3', 'section-4', 'tip-1', 'note-1']::text[]),
        ('lesson-13-shopping', array['section-1', 'section-2', 'section-3', 'section-4', 'tip-1', 'tip-2', 'note-1', 'note-2']::text[]),
        ('suite 13 shopping', array['section-1', 'section-2', 'section-3', 'tip-1', 'tip-2', 'note-1']::text[]),
        ('suite-leon-13-2-supermarch', array['section-1', 'section-2', 'section-3', 'tip-1', 'note-1']::text[]),
        ('suite-leon-13-3-shopping-spcialis', array['section-1', 'section-2', 'section-3', 'tip-1', 'tip-2', 'note-1', 'note-2']::text[]),
        ('suite-leon-13-4-accessoires-services-de-rparation', array['section-1', 'section-2', 'tip-1', 'note-1']::text[]),
        ('suite-leon-13-vente-dobjets-personnels-et-dantiquits', array['section-1', 'section-2', 'section-3', 'section-4', 'tip-1', 'tip-2', 'note-1', 'note-2']::text[]),
        ('leon-14-visites-tourisme', array['section-1', 'section-2', 'section-3', 'section-4', 'tip-1', 'tip-2', 'note-1']::text[]),
        ('leon-15-acheter-des-cartes-postales-et-souvenirs', array['section-1', 'section-2', 'section-3', 'tip-1', 'note-1']::text[]),
        ('suite-leon-15-les-artistes-de-rue-et-lart-de-marchander', array['section-1', 'section-2', 'section-3', 'tip-1', 'note-1', 'note-2']::text[]),
        ('leon-16-problmes-scurit', array['section-1', 'section-2', 'section-3', 'section-4', 'tip-1', 'tip-2', 'note-1', 'note-2']::text[]),
        ('leon-17-sant-urgence', array['section-1', 'section-2', 'section-3', 'tip-1', 'warning-1', 'warning-2', 'note-1']::text[]),
        ('suite-leon-17-sant-urgences', array['section-1', 'section-2', 'tip-1', 'warning-1', 'warning-2', 'note-1']::text[]),
        ('leon-18-dpart-et-au-revoir', array['section-1', 'section-2', 'section-3', 'section-4', 'tip-1', 'tip-2', 'note-1']::text[])
)
update public.learning_reward_rules as rules
set required_sections = completion_rules.required_sections
from completion_rules
where rules.activity_type = 'travel_lesson'
  and rules.activity_id = completion_rules.activity_id;

do $$
begin
    if exists (
        select 1
        from public.learning_reward_rules
        where required_sections is null
    ) then
        raise exception 'missing_learning_completion_rule';
    end if;
end;
$$;

alter table public.learning_reward_rules
alter column required_sections set not null;

alter table public.learning_reward_rules
add constraint learning_reward_rules_required_sections
check (cardinality(required_sections) between 1 and 500);

comment on column public.learning_reward_rules.required_sections is
    'Server-owned section ids that must exist in synchronized progress before a reward can be claimed.';

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
        rules.required_sections
    into
        reward_amount,
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
        p_activity_type <> 'travel_lesson'
        or not exists (
            select 1
            from public.learner_lesson_progress as progress
            where progress.user_id = learner_id
              and progress.content_type = 'travel'
              and progress.lesson_id = p_activity_id
              and progress.completed_sections @> required_section_ids
        )
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
