begin;

create extension if not exists pgtap
with schema extensions;

select plan(20);

select has_table(
    'public',
    'content_admins',
    'content admin identities have a private allowlist'
);
select has_function(
    'public',
    'get_content_admin_status',
    'the current learner can query their own admin status'
);
select has_function(
    'public',
    'admin_list_content_items',
    'admins can list canonical content metadata'
);
select has_function(
    'public',
    'admin_import_content_draft',
    array[
        'text',
        'text',
        'integer',
        'text',
        'text',
        'text',
        'jsonb',
        'text'
    ],
    'admins can create immutable drafts'
);
select has_function(
    'public',
    'admin_publish_content_revision',
    array['text', 'text', 'integer'],
    'admins can publish one explicit revision'
);
select has_function(
    'public',
    'admin_publish_latest_content_batch',
    array['text'],
    'admins can explicitly publish a reviewed batch'
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
        'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        'authenticated',
        'authenticated',
        'editor@example.test',
        '{}'::jsonb,
        '{}'::jsonb,
        now(),
        now()
    ),
    (
        'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
        'authenticated',
        'authenticated',
        'learner@example.test',
        '{}'::jsonb,
        '{}'::jsonb,
        now(),
        now()
    );

insert into public.content_admins (
    user_id
)
values (
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
);

set local role anon;

select throws_ok(
    $$ select * from public.get_content_admin_status() $$,
    '42501',
    'permission denied for function get_content_admin_status',
    'anonymous visitors cannot probe admin membership'
);

reset role;
set local role authenticated;
set local "request.jwt.claim.sub" =
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

select results_eq(
    $$ select is_admin from public.get_content_admin_status() $$,
    $$ values (false) $$,
    'an ordinary learner receives only their own negative admin status'
);
select throws_ok(
    $$ select * from public.admin_list_content_items() $$,
    '42501',
    'content_admin_access_required',
    'an ordinary learner cannot list editorial content'
);

set local "request.jwt.claim.sub" =
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

select results_eq(
    $$ select is_admin from public.get_content_admin_status() $$,
    $$ values (true) $$,
    'an allowlisted editor receives a positive admin status'
);

select results_eq(
    $$
        select
            revision_number,
            published
        from public.admin_import_content_draft(
            'grammar_lesson',
            'A1-G-ADMIN-TEST',
            2,
            'A1',
            'Brouillon admin',
            null,
            jsonb_build_object(
                'catalog',
                jsonb_build_object(
                    'id', 'A1-G-ADMIN-TEST',
                    'level', 'A1',
                    'module', 'Administration',
                    'icon', 'book',
                    'title', 'Brouillon admin',
                    'estimatedTime', 10,
                    'exercises', 0
                ),
                'document',
                jsonb_build_object(
                    'id', 'A1-G-ADMIN-TEST',
                    'level', 'A1',
                    'title', 'Brouillon admin',
                    'sections', jsonb_build_array()
                ),
                'exerciseSections',
                jsonb_build_array()
            ),
            'admin-panel'
        )
    $$,
    $$ values (1, false) $$,
    'saving from the admin API creates a draft without publishing it'
);

reset role;

select is(
    (
        select published_revision_id
        from public.content_items
        where content_key = 'A1-G-ADMIN-TEST'
    ),
    null::uuid,
    'a draft is never public implicitly'
);

set local role authenticated;
set local "request.jwt.claim.sub" =
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

select results_eq(
    $$
        select
            content_key,
            latest_revision_number,
            published_revision_number
        from public.admin_list_content_items()
        where content_key = 'A1-G-ADMIN-TEST'
    $$,
    $$ values ('A1-G-ADMIN-TEST'::text, 1, null::integer) $$,
    'the editorial catalog distinguishes latest and published revisions'
);
select results_eq(
    $$
        select
            revision_number,
            published
        from public.admin_get_content_revisions(
            'grammar_lesson',
            'A1-G-ADMIN-TEST'
        )
    $$,
    $$ values (1, false) $$,
    'the revision history exposes the draft to admins'
);

select lives_ok(
    $$
        select *
        from public.admin_publish_content_revision(
            'grammar_lesson',
            'A1-G-ADMIN-TEST',
            1
        )
    $$,
    'an admin can publish the explicitly selected revision'
);
select results_eq(
    $$
        select title_fr
        from public.get_published_content(
            'grammar_lesson',
            'A1-G-ADMIN-TEST'
        )
    $$,
    $$ values ('Brouillon admin'::text) $$,
    'the selected revision becomes visible through the public projection'
);

select lives_ok(
    $$
        select *
        from public.admin_import_content_draft(
            'grammar_lesson',
            'A1-G-ADMIN-BATCH',
            2,
            'A1',
            'Lot admin',
            null,
            jsonb_build_object(
                'catalog',
                jsonb_build_object(
                    'id', 'A1-G-ADMIN-BATCH',
                    'level', 'A1'
                ),
                'document',
                jsonb_build_object(
                    'id', 'A1-G-ADMIN-BATCH',
                    'level', 'A1',
                    'title', 'Lot admin',
                    'sections', jsonb_build_array()
                )
            ),
            'admin-panel'
        )
    $$,
    'a second content draft can join a reviewed batch'
);
select results_eq(
    $$
        select published_count
        from public.admin_publish_latest_content_batch(
            'grammar_lesson'
        )
    $$,
    $$ values (1) $$,
    'batch publication publishes only drafts newer than public revisions'
);

reset role;

select is(
    (
        select count(*)
        from public.content_publication_events
        where actor_id =
            'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
          and action = 'published'
    ),
    2::bigint,
    'every admin publication remains auditable'
);

set local role anon;

select throws_ok(
    $$
        select *
        from public.admin_import_content_draft(
            'grammar_lesson',
            'A1-G-FORBIDDEN',
            2,
            'A1',
            'Interdit',
            null,
            '{}'::jsonb,
            null
        )
    $$,
    '42501',
    'permission denied for function admin_import_content_draft',
    'anonymous visitors cannot call editorial mutations'
);

select * from finish();

rollback;
