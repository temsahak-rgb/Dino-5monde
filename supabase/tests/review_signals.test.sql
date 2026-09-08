begin;

create extension if not exists pgtap
with schema extensions;

select plan(18);

select has_table(
    'public',
    'learner_review_signals',
    'private learner review signals exist'
);
select has_function(
    'public',
    'sync_review_signal',
    array['text', 'text', 'text', 'jsonb', 'boolean', 'timestamp with time zone'],
    'the versioned review signal function exists'
);

insert into auth.users (
    id, aud, role, email, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at
)
values
    (
        '77777777-7777-4777-8777-777777777777',
        'authenticated', 'authenticated', 'review-one@example.test',
        '{}'::jsonb, '{}'::jsonb, now(), now()
    ),
    (
        '88888888-8888-4888-8888-888888888888',
        'authenticated', 'authenticated', 'review-two@example.test',
        '{}'::jsonb, '{}'::jsonb, now(), now()
    );

set local role anon;

select throws_ok(
    $$ select * from public.sync_review_signal(
        'weak_word', 'pack-one', 'bonjour', '{"word":"bonjour"}',
        true, now()
    ) $$,
    '42501',
    'permission denied for function sync_review_signal',
    'anonymous visitors cannot sync review signals'
);

reset role;
set local role authenticated;
set local "request.jwt.claim.sub" =
    '77777777-7777-4777-8777-777777777777';

select is(
    (select count(*) from public.learner_review_signals),
    0::bigint,
    'a learner starts without review signals'
);

select results_eq(
    $$
        select active
        from public.sync_review_signal(
            'weak_word', 'pack-one', 'bonjour', '{"word":"bonjour"}',
            true, now() - interval '2 hours'
        )
    $$,
    $$ values (true) $$,
    'a weak word becomes active'
);

select is(
    (select count(*) from public.learner_review_signals),
    1::bigint,
    'one versioned signal row is created'
);

select results_eq(
    $$
        select active
        from public.sync_review_signal(
            'weak_word', 'pack-one', 'bonjour', '{"word":"bonjour"}',
            false, now() - interval '1 hour'
        )
    $$,
    $$ values (false) $$,
    'marking a word as known stores a tombstone'
);

select results_eq(
    $$
        select active
        from public.sync_review_signal(
            'weak_word', 'pack-one', 'bonjour', '{"word":"bonjour"}',
            true, now() - interval '2 hours'
        )
    $$,
    $$ values (false) $$,
    'a stale device cannot resurrect a reviewed word'
);

select results_eq(
    $$
        select active
        from public.sync_review_signal(
            'weak_word', 'pack-one', 'bonjour', '{"word":"bonjour"}',
            true, now()
        )
    $$,
    $$ values (true) $$,
    'a genuinely newer difficulty can reactivate a word'
);

select throws_ok(
    $$ select * from public.sync_review_signal(
        'unknown', 'pack-one', 'word-one', '{}', true, now()
    ) $$,
    '22023',
    'invalid_review_signal',
    'unknown signal types are rejected'
);
select throws_ok(
    $$ select * from public.sync_review_signal(
        'weak_word', 'pack-one', 'bonjour', '{}', true, now()
    ) $$,
    '22023',
    'invalid_review_signal',
    'malformed weak-word payloads are rejected'
);
select throws_ok(
    $$ select * from public.sync_review_signal(
        'weak_word', 'pack-one', 'bonjour', '{"word":"bonjour"}',
        true, now() + interval '10 minutes'
    ) $$,
    '22023',
    'invalid_review_signal',
    'far-future client clocks are rejected'
);
select throws_ok(
    $$ insert into public.learner_review_signals (
        user_id, signal_type, subject_id, signal_key,
        payload, active, changed_at
    ) values (
        '77777777-7777-4777-8777-777777777777',
        'weak_word', 'pack-two', 'word-two', '{"word":"merci"}', true, now()
    ) $$,
    '42501',
    'permission denied for table learner_review_signals',
    'learners cannot bypass the merge function with direct writes'
);

select is(
    (select count(*) from public.learner_review_signals),
    1::bigint,
    'the first learner reads only their own signal'
);

reset role;
set local role authenticated;
set local "request.jwt.claim.sub" =
    '88888888-8888-4888-8888-888888888888';

select is(
    (select count(*) from public.learner_review_signals),
    0::bigint,
    'another learner cannot read the first learner signals'
);

select lives_ok(
    $$ select * from public.sync_review_signal(
        'mistake', 'A1-G-001', 'mistake-one',
        '{"id":"mistake-one","lessonId":"A1-G-001","sectionId":"exercise","questionIndex":0,"userAnswer":1,"correctAnswer":0,"timestamp":"2026-09-08T10:00:00.000Z"}',
        true, now()
    ) $$,
    'another learner can create a private mistake signal'
);

select is(
    (select count(*) from public.learner_review_signals),
    1::bigint,
    'the second learner sees only their own signal'
);

select throws_ok(
    $$ delete from public.learner_review_signals $$,
    '42501',
    'permission denied for table learner_review_signals',
    'learners cannot delete tombstones directly'
);

select * from finish();
rollback;
