begin;

create extension if not exists pgtap
with schema extensions;

select plan(26);

select has_table(
    'public',
    'learner_game_attempts',
    'private game attempts exist'
);
select has_function(
    'public',
    'start_learning_game',
    array['text', 'text', 'text'],
    'the game attempt start function exists'
);
select has_function(
    'public',
    'complete_learning_game',
    array['uuid'],
    'the game attempt completion function exists'
);
select is(
    (
        select count(*)
        from public.learning_reward_rules
        where completion_kind = 'game_attempt'
          and active
    ),
    18::bigint,
    'six levels are rewarded for each of the three games'
);
select results_eq(
    $$
        select activity_type, reward_credits
        from public.learning_reward_rules
        where completion_kind = 'game_attempt'
          and activity_id = 'A1'
        order by reward_credits
    $$,
    $$
        values
            ('hangman_game'::text, 1),
            ('word_search_game'::text, 3),
            ('crossword_game'::text, 5)
    $$,
    'game rewards reflect their relative completion effort'
);

insert into auth.users (
    id, aud, role, email, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at
)
values
    (
        '99999999-9999-4999-8999-999999999999',
        'authenticated', 'authenticated', 'game-one@example.test',
        '{}'::jsonb, '{}'::jsonb, now(), now()
    ),
    (
        'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        'authenticated', 'authenticated', 'game-two@example.test',
        '{}'::jsonb, '{}'::jsonb, now(), now()
    );

set local role anon;

select throws_ok(
    $$
        select *
        from public.start_learning_game(
            'hangman_game',
            'A1',
            'salutations_expressions_quotidiennes'
        )
    $$,
    '42501',
    'permission denied for function start_learning_game',
    'anonymous visitors cannot start rewarded attempts'
);

reset role;
set local role authenticated;
set local "request.jwt.claim.sub" =
    '99999999-9999-4999-8999-999999999999';

select is(
    (select count(*) from public.learner_game_attempts),
    0::bigint,
    'a learner starts without game attempts'
);
select results_eq(
    $$
        select
            activity_type,
            activity_id,
            pack_id,
            completed_at is null
        from public.start_learning_game(
            'hangman_game',
            'A1',
            'salutations_expressions_quotidiennes'
        )
    $$,
    $$
        values (
            'hangman_game'::text,
            'A1'::text,
            'salutations_expressions_quotidiennes'::text,
            true
        )
    $$,
    'a signed-in learner receives a private open attempt'
);
select is(
    (select count(*) from public.learner_game_attempts),
    1::bigint,
    'starting creates one attempt'
);
select lives_ok(
    $$
        select *
        from public.start_learning_game(
            'hangman_game',
            'A1',
            'another_a1_pack'
        )
    $$,
    'starting the same game and level reuses its open attempt'
);
select is(
    (select count(*) from public.learner_game_attempts),
    1::bigint,
    'repeated starts keep one open attempt'
);
select throws_ok(
    $$
        select *
        from public.claim_learning_reward(
            'hangman_game',
            'A1'
        )
    $$,
    'P0001',
    'learning_activity_incomplete',
    'an open attempt cannot earn credits before completion'
);
select ok(
    (
        select completed_at is not null
        from public.complete_learning_game(
            (
                select id
                from public.learner_game_attempts
                limit 1
            )
        )
    ),
    'completing the owned attempt stores its server timestamp'
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
            'hangman_game',
            'A1'
        )
    $$,
    $$
        values (
            'hangman_game'::text,
            'A1'::text,
            1,
            101,
            true
        )
    $$,
    'the completed attempt awards its server-owned amount'
);
select results_eq(
    $$
        select credits_remaining, awarded
        from public.claim_learning_reward(
            'hangman_game',
            'A1'
        )
    $$,
    $$ values (101, false) $$,
    'a repeated game claim is idempotent'
);
select is(
    (
        select count(*)
        from public.learner_activity_rewards
        where activity_type = 'hangman_game'
          and activity_id = 'A1'
    ),
    1::bigint,
    'one immutable game reward proof is stored'
);
select is(
    (
        select count(*)
        from public.learner_credit_transactions
        where reason = 'learning_reward'
          and reference_id = 'hangman_game:A1'
    ),
    1::bigint,
    'one game reward ledger entry is stored'
);
select throws_ok(
    $$
        select *
        from public.start_learning_game(
            'hangman_game',
            'A1',
            'salutations_expressions_quotidiennes'
        )
    $$,
    'P0001',
    'learning_reward_already_awarded',
    'an awarded game and level cannot create another attempt'
);
select throws_ok(
    $$
        insert into public.learner_game_attempts (
            user_id,
            activity_type,
            activity_id,
            pack_id
        )
        values (
            '99999999-9999-4999-8999-999999999999',
            'crossword_game',
            'C2',
            'forged-pack'
        )
    $$,
    '42501',
    'permission denied for table learner_game_attempts',
    'browser roles cannot forge completed attempts'
);
select throws_ok(
    $$
        select *
        from public.start_learning_game(
            'unknown_game',
            'A1',
            'valid-pack'
        )
    $$,
    '22023',
    'invalid_learning_game',
    'unknown game types are rejected'
);
select throws_ok(
    $$
        select *
        from public.start_learning_game(
            'hangman_game',
            'A0',
            'valid-pack'
        )
    $$,
    '22023',
    'invalid_learning_game',
    'unknown levels are rejected'
);
select throws_ok(
    $$
        select *
        from public.start_learning_game(
            'hangman_game',
            'A2',
            ' invalid-pack'
        )
    $$,
    '22023',
    'invalid_learning_game',
    'malformed pack identifiers are rejected'
);

reset role;
set local role authenticated;
set local "request.jwt.claim.sub" =
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

select is(
    (select count(*) from public.learner_game_attempts),
    0::bigint,
    'another learner cannot read the first learner attempts'
);
select is(
    (
        select count(*)
        from public.learner_activity_rewards
        where activity_type = 'hangman_game'
    ),
    0::bigint,
    'another learner cannot read the first learner game rewards'
);
select results_eq(
    $$
        select activity_type, activity_id, pack_id
        from public.start_learning_game(
            'word_search_game',
            'B2',
            'learner-two-pack'
        )
    $$,
    $$
        values (
            'word_search_game'::text,
            'B2'::text,
            'learner-two-pack'::text
        )
    $$,
    'another learner can start an isolated game attempt'
);

reset role;

delete from auth.users
where id = '99999999-9999-4999-8999-999999999999';

select is(
    (
        select count(*)
        from public.learner_game_attempts
        where user_id = '99999999-9999-4999-8999-999999999999'
    ),
    0::bigint,
    'deleting an account removes its game attempts'
);

select * from finish();
rollback;
