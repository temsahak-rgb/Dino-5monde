begin;

create extension if not exists pgtap
with schema extensions;

select plan(22);

select has_table(
    'public',
    'learner_exercise_attempts',
    'private learner exercise attempts exist'
);
select has_function(
    'public',
    'record_exercise_attempt',
    array[
        'uuid',
        'text',
        'text',
        'text',
        'text',
        'integer',
        'integer',
        'timestamp with time zone'
    ],
    'the idempotent attempt recording function exists'
);
select ok(
    (
        select relrowsecurity and relforcerowsecurity
        from pg_catalog.pg_class
        where oid = 'public.learner_exercise_attempts'::regclass
    ),
    'exercise attempts enforce row level security'
);

insert into auth.users (
    id, aud, role, email, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at
)
values
    (
        'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
        'authenticated', 'authenticated', 'exercise-one@example.test',
        '{}'::jsonb, '{}'::jsonb, now(), now()
    ),
    (
        'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
        'authenticated', 'authenticated', 'exercise-two@example.test',
        '{}'::jsonb, '{}'::jsonb, now(), now()
    );

set local role anon;

select throws_ok(
    $$
        select *
        from public.record_exercise_attempt(
            '11111111-1111-4111-8111-111111111111',
            'grammar',
            'A1-G-001',
            'exercise-1',
            null,
            4,
            5,
            '2026-09-08T12:00:00Z'
        )
    $$,
    '42501',
    'permission denied for function record_exercise_attempt',
    'anonymous visitors cannot write exercise attempts'
);

reset role;
set local role authenticated;
set local "request.jwt.claim.sub" =
    'dddddddd-dddd-4ddd-8ddd-dddddddddddd';

select is(
    (select count(*) from public.learner_exercise_attempts),
    0::bigint,
    'a learner starts without attempts'
);
select results_eq(
    $$
        select
            content_type,
            activity_id,
            exercise_id,
            level,
            correct_answers,
            total_questions,
            completed_at
        from public.record_exercise_attempt(
            '11111111-1111-4111-8111-111111111111',
            'grammar',
            'A1-G-001',
            'exercise-1',
            null,
            4,
            5,
            '2026-09-08T12:00:00Z'
        )
    $$,
    $$
        values (
            'grammar'::text,
            'A1-G-001'::text,
            'exercise-1'::text,
            null::text,
            4,
            5,
            '2026-09-08T12:00:00Z'::timestamptz
        )
    $$,
    'a valid Grammar result is recorded'
);
select is(
    (select count(*) from public.learner_exercise_attempts),
    1::bigint,
    'recording creates one append-only row'
);
select lives_ok(
    $$
        select *
        from public.record_exercise_attempt(
            '11111111-1111-4111-8111-111111111111',
            'grammar',
            'A1-G-001',
            'exercise-1',
            null,
            4,
            5,
            '2026-09-08T12:00:00Z'
        )
    $$,
    'replaying the same attempt UUID and payload is idempotent'
);
select is(
    (select count(*) from public.learner_exercise_attempts),
    1::bigint,
    'an idempotent replay creates no duplicate'
);
select throws_ok(
    $$
        select *
        from public.record_exercise_attempt(
            '11111111-1111-4111-8111-111111111111',
            'grammar',
            'A1-G-001',
            'exercise-1',
            null,
            5,
            5,
            '2026-09-08T12:00:00Z'
        )
    $$,
    'P0001',
    'exercise_attempt_conflict',
    'an existing attempt result cannot be mutated'
);
select throws_ok(
    $$
        select * from public.record_exercise_attempt(
            gen_random_uuid(), 'unknown', 'A1-G-001', 'exercise-1',
            null, 1, 1, now()
        )
    $$,
    '22023',
    'invalid_exercise_attempt',
    'unknown content types are rejected'
);
select throws_ok(
    $$
        select * from public.record_exercise_attempt(
            gen_random_uuid(), 'vocabulary', 'salutations', 'quiz',
            null, 1, 1, now()
        )
    $$,
    '22023',
    'invalid_exercise_attempt',
    'Vocabulary attempts require a CEFR level'
);
select throws_ok(
    $$
        select * from public.record_exercise_attempt(
            gen_random_uuid(), 'grammar', 'A1-G-001', 'exercise-1',
            'A1', 1, 1, now()
        )
    $$,
    '22023',
    'invalid_exercise_attempt',
    'Grammar attempts cannot carry a redundant level'
);
select throws_ok(
    $$
        select * from public.record_exercise_attempt(
            gen_random_uuid(), 'travel', 'TR-001', 'quiz',
            null, 0, 0, now()
        )
    $$,
    '22023',
    'invalid_exercise_attempt',
    'empty attempts are rejected'
);
select throws_ok(
    $$
        select * from public.record_exercise_attempt(
            gen_random_uuid(), 'travel', 'TR-001', 'quiz',
            null, 3, 2, now()
        )
    $$,
    '22023',
    'invalid_exercise_attempt',
    'impossible scores are rejected'
);
select throws_ok(
    $$
        select * from public.record_exercise_attempt(
            gen_random_uuid(), 'travel', 'TR-001', 'quiz',
            null, 1, 1, now() + interval '10 minutes'
        )
    $$,
    '22023',
    'invalid_exercise_attempt',
    'future completion timestamps are rejected'
);
select throws_ok(
    $$
        insert into public.learner_exercise_attempts (
            id, user_id, content_type, activity_id, exercise_id,
            correct_answers, total_questions, completed_at
        )
        values (
            gen_random_uuid(),
            'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
            'travel', 'TR-001', 'quiz', 1, 1, now()
        )
    $$,
    '42501',
    'permission denied for table learner_exercise_attempts',
    'learners cannot bypass the RPC with direct inserts'
);
select throws_ok(
    $$
        update public.learner_exercise_attempts
        set correct_answers = 5
    $$,
    '42501',
    'permission denied for table learner_exercise_attempts',
    'learners cannot mutate recorded scores'
);
select is(
    (select count(*) from public.learner_exercise_attempts),
    1::bigint,
    'the first learner reads their own attempt'
);

reset role;
set local role authenticated;
set local "request.jwt.claim.sub" =
    'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';

select is(
    (select count(*) from public.learner_exercise_attempts),
    0::bigint,
    'another learner cannot read the first learner attempts'
);
select throws_ok(
    $$
        select *
        from public.record_exercise_attempt(
            '11111111-1111-4111-8111-111111111111',
            'grammar',
            'A1-G-001',
            'exercise-1',
            null,
            4,
            5,
            '2026-09-08T12:00:00Z'
        )
    $$,
    'P0001',
    'exercise_attempt_conflict',
    'another learner cannot reuse an existing attempt UUID'
);
select lives_ok(
    $$
        select *
        from public.record_exercise_attempt(
            '22222222-2222-4222-8222-222222222222',
            'vocabulary',
            'salutations',
            'quiz',
            'A1',
            7,
            10,
            '2026-09-08T12:30:00Z'
        )
    $$,
    'a valid Vocabulary result records its level'
);

select * from finish();

rollback;
