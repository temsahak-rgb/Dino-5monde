begin;

create extension if not exists pgtap
with schema extensions;

select plan(20);

select has_function(
    'public',
    'assign_learner_saurus',
    array['text[]', 'text'],
    'the server-owned Saurus allocation function exists'
);
select has_column(
    'public',
    'learner_profiles',
    'saurus_recommendation',
    'the recommendation is auditable'
);
select has_column(
    'public',
    'learner_profiles',
    'saurus_quiz_answers',
    'the ordered quiz answers are durable'
);
select has_column(
    'public',
    'learner_profiles',
    'saurus_assignment_source',
    'the final choice source is durable'
);
select has_column(
    'public',
    'learner_profiles',
    'saurus_assigned_at',
    'the assignment time is durable'
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
        '11111111-1111-4111-8111-111111111111',
        'authenticated',
        'authenticated',
        'saurus-first@example.test',
        '{}'::jsonb,
        '{}'::jsonb,
        now(),
        now()
    ),
    (
        '22222222-2222-4222-8222-222222222222',
        'authenticated',
        'authenticated',
        'saurus-second@example.test',
        '{}'::jsonb,
        '{}'::jsonb,
        now(),
        now()
    ),
    (
        '33333333-3333-4333-8333-333333333333',
        'authenticated',
        'authenticated',
        'saurus-no-profile@example.test',
        '{}'::jsonb,
        '{}'::jsonb,
        now(),
        now()
    );

insert into public.learner_profiles (
    user_id,
    display_name
)
values
    (
        '11111111-1111-4111-8111-111111111111',
        'Mina'
    ),
    (
        '22222222-2222-4222-8222-222222222222',
        'Nima'
    );

set local role anon;

select throws_ok(
    $$
        select *
        from public.assign_learner_saurus(
            array[
                'velociraptor-explorer',
                'velociraptor-explorer',
                'triceratops-perseverant'
            ],
            null
        )
    $$,
    '42501',
    'permission denied for function assign_learner_saurus',
    'anonymous visitors cannot allocate a Saurus'
);

reset role;
set local role authenticated;
set local "request.jwt.claim.sub" =
    '11111111-1111-4111-8111-111111111111';

select results_eq(
    $$
        select
            assigned_saurus,
            saurus_recommendation,
            saurus_assignment_source
        from public.assign_learner_saurus(
            array[
                'velociraptor-explorer',
                'triceratops-perseverant',
                'velociraptor-explorer'
            ],
            null
        )
    $$,
    $$
        values (
            'velociraptor-explorer'::text,
            'velociraptor-explorer'::text,
            'recommendation'::text
        )
    $$,
    'a two-answer majority is recommended and accepted'
);
select is(
    (
        select saurus_quiz_answers
        from public.learner_profiles
        where user_id = '11111111-1111-4111-8111-111111111111'
    ),
    array[
        'velociraptor-explorer',
        'triceratops-perseverant',
        'velociraptor-explorer'
    ]::text[],
    'the ordered answers are retained'
);
select isnt(
    (
        select saurus_assigned_at
        from public.learner_profiles
        where user_id = '11111111-1111-4111-8111-111111111111'
    ),
    null::timestamptz,
    'the assignment is timestamped'
);
select is(
    (
        select assigned_saurus
        from public.assign_learner_saurus(
            array[
                'brachiosaurus-curious',
                'brachiosaurus-curious',
                'triceratops-perseverant'
            ],
            'triceratops-perseverant'
        )
    ),
    'velociraptor-explorer'::text,
    'a repeated request cannot change the stable species'
);
select is(
    (select count(*) from public.learner_profiles),
    1::bigint,
    'profile RLS exposes only the authenticated learner'
);

select throws_ok(
    $$
        select *
        from public.assign_learner_saurus(
            array['velociraptor-explorer'],
            null
        )
    $$,
    '22023',
    'saurus_quiz_invalid',
    'an incomplete quiz is rejected'
);

set local "request.jwt.claim.sub" =
    '22222222-2222-4222-8222-222222222222';

select results_eq(
    $$
        select
            assigned_saurus,
            saurus_recommendation,
            saurus_assignment_source
        from public.assign_learner_saurus(
            array[
                'velociraptor-explorer',
                'triceratops-perseverant',
                'brachiosaurus-curious'
            ],
            'triceratops-perseverant'
        )
    $$,
    $$
        values (
            'triceratops-perseverant'::text,
            'brachiosaurus-curious'::text,
            'learner-choice'::text
        )
    $$,
    'the final rhythm breaks a tie before the learner chooses another species'
);
select is(
    (
        select saurus_assignment_source
        from public.learner_profiles
        where user_id = '22222222-2222-4222-8222-222222222222'
    ),
    'learner-choice'::text,
    'an explicit alternative is recorded as a learner choice'
);
select is(
    (
        select cardinality(saurus_quiz_answers)
        from public.learner_profiles
        where user_id = '22222222-2222-4222-8222-222222222222'
    ),
    3,
    'exactly three quiz answers are retained'
);
select throws_ok(
    $$
        select *
        from public.assign_learner_saurus(
            array[
                'velociraptor-explorer',
                'unknown-saurus',
                'brachiosaurus-curious'
            ],
            null
        )
    $$,
    '22023',
    'saurus_quiz_invalid',
    'unknown quiz answers are rejected'
);
select throws_ok(
    $$
        select *
        from public.assign_learner_saurus(
            array[
                'velociraptor-explorer',
                'triceratops-perseverant',
                'brachiosaurus-curious'
            ],
            'unknown-saurus'
        )
    $$,
    '22023',
    'saurus_quiz_invalid',
    'unknown final choices are rejected'
);

set local "request.jwt.claim.sub" =
    '33333333-3333-4333-8333-333333333333';

select throws_ok(
    $$
        select *
        from public.assign_learner_saurus(
            array[
                'velociraptor-explorer',
                'triceratops-perseverant',
                'brachiosaurus-curious'
            ],
            null
        )
    $$,
    'P0002',
    'learner_profile_required',
    'a learner profile is required before allocation'
);

reset role;

select throws_ok(
    $$
        update public.learner_profiles
        set assigned_saurus = 'brachiosaurus-curious'
        where user_id = '11111111-1111-4111-8111-111111111111'
    $$,
    'P0001',
    'saurus_species_is_stable',
    'even a privileged write cannot reassign a stable species'
);

select is(
    (
        select assigned_saurus
        from public.learner_profiles
        where user_id = '11111111-1111-4111-8111-111111111111'
    ),
    'velociraptor-explorer'::text,
    'the original stable species remains unchanged'
);

select * from finish();

rollback;
