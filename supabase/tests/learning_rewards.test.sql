begin;

create extension if not exists pgtap
with schema extensions;

select plan(26);

select has_table(
    'public',
    'learning_reward_rules',
    'the server-owned learning reward catalogue exists'
);
select has_table(
    'public',
    'learner_activity_rewards',
    'durable learner reward claims exist'
);
select has_function(
    'public',
    'claim_learning_reward',
    array['text', 'text'],
    'the atomic reward function exists'
);
select is(
    (
        select count(*)
        from public.learning_reward_rules
        where activity_type = 'travel_lesson'
          and active
          and reward_credits = 5
    ),
    31::bigint,
    'all launch Travel rewards are active and server-priced'
);

insert into auth.users (
    id,
    aud,
    role,
    email,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at
)
values
    (
        '33333333-3333-4333-8333-333333333333',
        'authenticated',
        'authenticated',
        'reward-first@example.test',
        '{}'::jsonb,
        '{}'::jsonb,
        now(),
        now()
    ),
    (
        '44444444-4444-4444-8444-444444444444',
        'authenticated',
        'authenticated',
        'reward-second@example.test',
        '{}'::jsonb,
        '{}'::jsonb,
        now(),
        now()
    );

select is(
    (
        select credits
        from public.learner_wallets
        where user_id = '33333333-3333-4333-8333-333333333333'
    ),
    100,
    'a reward learner starts with the normal wallet balance'
);

set local role anon;

select is(
    (
        select count(*)
        from public.learning_reward_rules
    ),
    31::bigint,
    'anonymous visitors may read active reward rules'
);
select throws_ok(
    $$
        select *
        from public.claim_learning_reward(
            'travel_lesson',
            'TR-006'
        )
    $$,
    '42501',
    'permission denied for function claim_learning_reward',
    'anonymous visitors cannot execute reward claims'
);

reset role;
set local role authenticated;
set local "request.jwt.claim.sub" =
    '33333333-3333-4333-8333-333333333333';

select is(
    (
        select count(*)
        from public.learner_activity_rewards
    ),
    0::bigint,
    'a learner initially sees no reward claim'
);
select results_eq(
    $$
        select
            activity_type,
            activity_id,
            credits_awarded,
            credits_remaining,
            awarded
        from public.claim_learning_reward(
            'travel_lesson',
            'TR-006'
        )
    $$,
    $$
        values (
            'travel_lesson'::text,
            'TR-006'::text,
            5,
            105,
            true
        )
    $$,
    'the first claim atomically returns the award and new balance'
);
select is(
    (
        select credits
        from public.learner_wallets
    ),
    105,
    'the first claim credits the wallet'
);
select is(
    (
        select count(*)
        from public.learner_activity_rewards
        where activity_type = 'travel_lesson'
          and activity_id = 'TR-006'
          and credits_awarded = 5
    ),
    1::bigint,
    'the first claim creates one immutable reward proof'
);
select is(
    (
        select count(*)
        from public.learner_credit_transactions
        where reason = 'learning_reward'
          and reference_id = 'travel_lesson:TR-006'
          and delta = 5
          and balance_after = 105
    ),
    1::bigint,
    'the first claim creates one positive audit entry'
);
select results_eq(
    $$
        select
            activity_type,
            activity_id,
            credits_awarded,
            credits_remaining,
            awarded
        from public.claim_learning_reward(
            'travel_lesson',
            'TR-006'
        )
    $$,
    $$
        values (
            'travel_lesson'::text,
            'TR-006'::text,
            5,
            105,
            false
        )
    $$,
    'a repeated claim is idempotent'
);
select is(
    (
        select credits
        from public.learner_wallets
    ),
    105,
    'a repeated claim does not credit the wallet twice'
);
select is(
    (
        select count(*)
        from public.learner_credit_transactions
        where reason = 'learning_reward'
    ),
    1::bigint,
    'a repeated claim keeps one reward ledger entry'
);
select throws_ok(
    $$
        select *
        from public.claim_learning_reward(
            'travel_lesson',
            'missing-travel-lesson'
        )
    $$,
    'P0002',
    'learning_reward_not_found',
    'unknown activities cannot earn credits'
);
select throws_ok(
    $$
        select *
        from public.claim_learning_reward(
            ' travel_lesson',
            'TR-006'
        )
    $$,
    '22023',
    'invalid_learning_activity',
    'malformed activity identifiers are rejected'
);
select throws_ok(
    $$
        insert into public.learner_activity_rewards (
            user_id,
            activity_type,
            activity_id,
            credits_awarded
        )
        values (
            '33333333-3333-4333-8333-333333333333',
            'travel_lesson',
            'leon-1-lalphabet',
            99
        )
    $$,
    '42501',
    'permission denied for table learner_activity_rewards',
    'browser roles cannot forge reward claims'
);
select throws_ok(
    $$
        update public.learner_activity_rewards
        set credits_awarded = 99
    $$,
    '42501',
    'permission denied for table learner_activity_rewards',
    'browser roles cannot rewrite reward claims'
);

reset role;

select throws_ok(
    $$
        update public.learner_activity_rewards
        set credits_awarded = 99
        where user_id = '33333333-3333-4333-8333-333333333333'
    $$,
    '55000',
    'activity_rewards_are_append_only',
    'reward proofs remain append-only for privileged writes'
);
select throws_ok(
    $$
        insert into public.learner_credit_transactions (
            user_id,
            delta,
            balance_after,
            reason,
            reference_id
        )
        values (
            '33333333-3333-4333-8333-333333333333',
            -5,
            100,
            'learning_reward',
            'travel_lesson:leon-1-lalphabet'
        )
    $$,
    '23514',
    'new row for relation "learner_credit_transactions" violates check constraint "learner_credit_transactions_delta_direction"',
    'a learning reward can never debit the wallet'
);

set local role authenticated;
set local "request.jwt.claim.sub" =
    '44444444-4444-4444-8444-444444444444';

select is(
    (
        select count(*)
        from public.learner_activity_rewards
    ),
    0::bigint,
    'RLS hides another learner reward history'
);

reset role;

update public.learning_reward_rules
set active = false
where activity_type = 'travel_lesson'
  and activity_id = 'leon-1-lalphabet';

set local role authenticated;
set local "request.jwt.claim.sub" =
    '44444444-4444-4444-8444-444444444444';

select throws_ok(
    $$
        select *
        from public.claim_learning_reward(
            'travel_lesson',
            'leon-1-lalphabet'
        )
    $$,
    'P0002',
    'learning_reward_not_found',
    'inactive rewards cannot be claimed'
);

reset role;

delete from auth.users
where id = '33333333-3333-4333-8333-333333333333';

select is(
    (
        select count(*)
        from public.learner_activity_rewards
        where user_id = '33333333-3333-4333-8333-333333333333'
    ),
    0::bigint,
    'deleting an account removes its private reward claims'
);
select is(
    (
        select count(*)
        from public.learner_credit_transactions
        where user_id = '33333333-3333-4333-8333-333333333333'
    ),
    0::bigint,
    'deleting an account removes its reward audit entries'
);
select is(
    (
        select count(*)
        from public.learner_wallets
        where user_id = '33333333-3333-4333-8333-333333333333'
    ),
    0::bigint,
    'deleting an account removes its rewarded wallet'
);

select * from finish();

rollback;
