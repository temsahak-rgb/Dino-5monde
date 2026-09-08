begin;

create extension if not exists pgtap
with schema extensions;

select plan(18);

select has_table(
    'public',
    'learner_lesson_progress',
    'private learner lesson progress exists'
);
select has_function(
    'public',
    'sync_lesson_progress',
    array['text', 'text', 'text', 'text[]', 'integer', 'timestamp with time zone'],
    'the monotonic progress sync function exists'
);

insert into auth.users (
    id, aud, role, email, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at
)
values
    (
        '55555555-5555-4555-8555-555555555555',
        'authenticated', 'authenticated', 'progress-one@example.test',
        '{}'::jsonb, '{}'::jsonb, now(), now()
    ),
    (
        '66666666-6666-4666-8666-666666666666',
        'authenticated', 'authenticated', 'progress-two@example.test',
        '{}'::jsonb, '{}'::jsonb, now(), now()
    );

set local role anon;

select throws_ok(
    $$ select * from public.sync_lesson_progress(
        'grammar', 'A1-G-001', 'in_progress', array['intro'], 1, now()
    ) $$,
    '42501',
    'permission denied for function sync_lesson_progress',
    'anonymous visitors cannot sync progress'
);

reset role;
set local role authenticated;
set local "request.jwt.claim.sub" =
    '55555555-5555-4555-8555-555555555555';

select is(
    (select count(*) from public.learner_lesson_progress),
    0::bigint,
    'a learner starts without remote progress'
);

select results_eq(
    $$
        select status, completed_sections, current_section
        from public.sync_lesson_progress(
            'grammar', 'A1-G-001', 'completed',
            array['intro', 'exercise'], 2,
            '2026-09-08T10:00:00Z'::timestamptz
        )
    $$,
    $$ values (
        'completed'::text,
        array['exercise', 'intro']::text[],
        2
    ) $$,
    'the first device stores completed progress'
);

select is(
    (select count(*) from public.learner_lesson_progress),
    1::bigint,
    'one remote progress row is created'
);

select results_eq(
    $$
        select status, completed_sections, current_section, last_accessed
        from public.sync_lesson_progress(
            'grammar', 'A1-G-001', 'in_progress',
            array['summary'], 1,
            '2026-09-07T10:00:00Z'::timestamptz
        )
    $$,
    $$ values (
        'completed'::text,
        array['exercise', 'intro', 'summary']::text[],
        2,
        '2026-09-08T10:00:00Z'::timestamptz
    ) $$,
    'a stale device cannot regress status, sections, position or timestamp'
);

select is(
    (select count(*) from public.learner_lesson_progress),
    1::bigint,
    'repeated synchronization is idempotent'
);

select throws_ok(
    $$ select * from public.sync_lesson_progress(
        'unknown', 'A1-G-001', 'in_progress', array['intro'], 1, now()
    ) $$,
    '22023',
    'invalid_lesson_progress',
    'unknown content types are rejected'
);
select throws_ok(
    $$ select * from public.sync_lesson_progress(
        'grammar', ' A1-G-001', 'in_progress', array['intro'], 1, now()
    ) $$,
    '22023',
    'invalid_lesson_progress',
    'malformed lesson ids are rejected'
);
select throws_ok(
    $$ select * from public.sync_lesson_progress(
        'grammar', 'A1-G-001', 'in_progress', array[' bad'], 1, now()
    ) $$,
    '22023',
    'invalid_lesson_progress',
    'malformed section ids are rejected'
);
select throws_ok(
    $$ insert into public.learner_lesson_progress (
        user_id, content_type, lesson_id, status, last_accessed
    ) values (
        '55555555-5555-4555-8555-555555555555',
        'travel', 'TR-006', 'completed', now()
    ) $$,
    '42501',
    'permission denied for table learner_lesson_progress',
    'learners cannot bypass the merge function with direct writes'
);

select is(
    (select count(*) from public.learner_lesson_progress),
    1::bigint,
    'the first learner can read only their own progress'
);

reset role;
set local role authenticated;
set local "request.jwt.claim.sub" =
    '66666666-6666-4666-8666-666666666666';

select is(
    (select count(*) from public.learner_lesson_progress),
    0::bigint,
    'another learner cannot read the first learner progress'
);

select lives_ok(
    $$ select * from public.sync_lesson_progress(
        'travel', 'TR-006', 'in_progress', array['arrival'], 1, now()
    ) $$,
    'another learner can create their own progress through the RPC'
);

select is(
    (select count(*) from public.learner_lesson_progress),
    1::bigint,
    'the second learner sees only their own row'
);

select is(
    (
        select status
        from public.learner_lesson_progress
        where lesson_id = 'TR-006'
    ),
    'in_progress'::text,
    'travel progress uses the same private contract'
);

select throws_ok(
    $$ delete from public.learner_lesson_progress $$,
    '42501',
    'permission denied for table learner_lesson_progress',
    'learners cannot delete synchronized progress directly'
);

select * from finish();
rollback;
