begin;

create extension if not exists pgtap
with schema extensions;

select plan(30);

select has_table(
    'public',
    'content_items',
    'stable content identities exist'
);
select has_table(
    'public',
    'content_revisions',
    'immutable content revisions exist'
);
select has_table(
    'public',
    'content_publication_events',
    'content publication changes are audited'
);
select has_function(
    'public',
    'import_content_revision',
    array[
        'text',
        'text',
        'integer',
        'text',
        'text',
        'text',
        'jsonb',
        'text',
        'boolean'
    ],
    'the server-only idempotent importer exists'
);
select has_function(
    'public',
    'get_published_content',
    array['text', 'text'],
    'the public read projection exists'
);
select has_function(
    'public',
    'get_published_content_catalog',
    array['text', 'text'],
    'the lightweight public catalog projection exists'
);

select is(
    (
        select count(*)
        from public.get_published_content_catalog()
        where content_key in (
            'A1-G-998',
            'uat-salutations',
            'uat-hotel',
            '2026-w38-uat-news'
        )
    ),
    4::bigint,
    'the local seed contains exactly four published UAT documents'
);
select results_eq(
    $$
        select
            content_type,
            count(*)
        from public.get_published_content_catalog()
        where content_key in (
            'A1-G-998',
            'uat-salutations',
            'uat-hotel',
            '2026-w38-uat-news'
        )
        group by content_type
        order by content_type
    $$,
    $$
        values
            ('grammar_lesson'::text, 1::bigint),
            ('news_article'::text, 1::bigint),
            ('travel_lesson'::text, 1::bigint),
            ('vocabulary_pack'::text, 1::bigint)
    $$,
    'each canonical content family has one acceptance fixture'
);
select ok(
    (
        select bool_and(
            catalog ? 'id'
            and not catalog ? 'document'
            and not catalog ? 'exerciseSections'
        )
        from public.get_published_content_catalog()
    ),
    'catalog reads never return lesson bodies or exercises'
);
select throws_ok(
    $$
        select *
        from public.get_published_content(
            'grammar_lesson',
            null
        )
    $$,
    '22023',
    'content_key_invalid',
    'detail reads require one explicit content identity'
);

set local role anon;

select throws_ok(
    $$ select count(*) from public.content_items $$,
    '42501',
    'permission denied for table content_items',
    'anonymous visitors cannot inspect server-owned identities'
);
select is(
    (
        select count(*)
        from public.get_published_content_catalog()
        where content_key in (
            'A1-G-998',
            'uat-salutations',
            'uat-hotel',
            '2026-w38-uat-news'
        )
    ),
    4::bigint,
    'anonymous visitors can read the published projection'
);
select throws_ok(
    $$ select count(*) from public.content_revisions $$,
    '42501',
    'permission denied for table content_revisions',
    'anonymous visitors cannot inspect revision provenance'
);
select throws_ok(
    $$
        select *
        from public.import_content_revision(
            'news_article',
            'forbidden-anon',
            1,
            'A1',
            'Interdit',
            null,
            '{}'::jsonb,
            null,
            true
        )
    $$,
    '42501',
    'permission denied for function import_content_revision',
    'anonymous visitors cannot import content'
);

reset role;
set local role authenticated;

select is(
    (
        select count(*)
        from public.get_published_content_catalog()
        where content_key in (
            'A1-G-998',
            'uat-salutations',
            'uat-hotel',
            '2026-w38-uat-news'
        )
    ),
    4::bigint,
    'authenticated learners receive the same published projection'
);
select throws_ok(
    $$
        select *
        from public.import_content_revision(
            'news_article',
            'forbidden-learner',
            1,
            'A1',
            'Interdit',
            null,
            '{}'::jsonb,
            null,
            true
        )
    $$,
    '42501',
    'permission denied for function import_content_revision',
    'learners cannot import content'
);

reset role;

select throws_ok(
    $$
        select *
        from public.import_content_revision(
            'news_article',
            'invalid-payload',
            1,
            'A1',
            'Payload invalide',
            null,
            jsonb_build_object(
                'catalog', jsonb_build_object(
                    'id', 'another-id'
                )
            ),
            null,
            false
        )
    $$,
    '22023',
    'content_payload_identity_invalid',
    'the database rejects incomplete or mismatched content payloads'
);

select is(
    (
        select count(*)
        from public.content_revisions as revisions
        join public.content_items as items
          on items.id = revisions.content_item_id
        where items.content_type = 'grammar_lesson'
          and items.content_key = 'A1-G-998'
    ),
    1::bigint,
    'the seeded grammar document starts at revision one'
);

select results_eq(
    $$
        select
            imported.revision_number,
            imported.published
        from public.content_items as items
        join public.content_revisions as revisions
          on revisions.id = items.published_revision_id
        cross join lateral public.import_content_revision(
            items.content_type,
            items.content_key,
            revisions.schema_version,
            revisions.level,
            revisions.title_fr,
            revisions.title_fa,
            revisions.payload,
            revisions.source_path,
            true
        ) as imported
        where items.content_type = 'grammar_lesson'
          and items.content_key = 'A1-G-998'
    $$,
    $$ values (1::integer, true::boolean) $$,
    'reimporting an identical document reuses its published revision'
);
select is(
    (
        select count(*)
        from public.content_revisions as revisions
        join public.content_items as items
          on items.id = revisions.content_item_id
        where items.content_type = 'grammar_lesson'
          and items.content_key = 'A1-G-998'
    ),
    1::bigint,
    'an idempotent retry creates no duplicate revision'
);

select results_eq(
    $$
        select
            imported.revision_number,
            imported.published
        from public.content_items as items
        join public.content_revisions as revisions
          on revisions.id = items.published_revision_id
        cross join lateral public.import_content_revision(
            items.content_type,
            items.content_key,
            revisions.schema_version,
            revisions.level,
            revisions.title_fr,
            revisions.title_fa,
            revisions.payload
                || jsonb_build_object('uatRevision', 2),
            revisions.source_path,
            true
        ) as imported
        where items.content_type = 'grammar_lesson'
          and items.content_key = 'A1-G-998'
    $$,
    $$ values (2::integer, true::boolean) $$,
    'changed content creates and publishes revision two'
);
select is(
    (
        select count(*)
        from public.content_revisions as revisions
        join public.content_items as items
          on items.id = revisions.content_item_id
        where items.content_type = 'grammar_lesson'
          and items.content_key = 'A1-G-998'
    ),
    2::bigint,
    'publishing a change preserves both revisions'
);
select ok(
    exists (
        select 1
        from public.content_revisions as revisions
        join public.content_items as items
          on items.id = revisions.content_item_id
        where items.content_type = 'grammar_lesson'
          and items.content_key = 'A1-G-998'
          and revisions.revision_number = 1
          and not revisions.payload ? 'uatRevision'
    ),
    'revision one retains its original payload'
);
select is(
    (
        select revision_number
        from public.get_published_content(
            'grammar_lesson',
            'A1-G-998'
        )
    ),
    2,
    'the public projection follows the new publication pointer'
);
select throws_ok(
    $$
        update public.content_revisions
        set title_fr = 'Réécriture interdite'
        where revision_number = 1
    $$,
    '55000',
    'content_history_is_append_only',
    'a historical revision cannot be rewritten'
);
select throws_ok(
    $$
        delete from public.content_publication_events
        where action = 'published'
    $$,
    '55000',
    'content_history_is_append_only',
    'publication audit entries cannot be deleted'
);
select results_eq(
    $$
        select
            events.action,
            count(*)
        from public.content_publication_events as events
        join public.content_items as items
          on items.id = events.content_item_id
        where items.content_type = 'grammar_lesson'
          and items.content_key = 'A1-G-998'
        group by events.action
        order by events.action
    $$,
    $$
        values
            ('imported'::text, 2::bigint),
            ('published'::text, 2::bigint)
    $$,
    'imports and publications leave distinct audit events'
);

select results_eq(
    $$
        select
            imported.revision_number,
            imported.published
        from public.import_content_revision(
            'news_article',
            'uat-draft-news',
            1,
            'B1',
            'Brouillon UAT',
            null,
            jsonb_build_object(
                'catalog', jsonb_build_object(
                    'id', 'uat-draft-news',
                    'title', 'Brouillon UAT'
                ),
                'document', jsonb_build_object(
                    'id', 'uat-draft-news',
                    'title', 'Brouillon UAT'
                )
            ),
            'uat/news/uat-draft-news.json',
            false
        ) as imported
    $$,
    $$ values (1::integer, false::boolean) $$,
    'a server import may deliberately remain a draft'
);
select is(
    (
        select count(*)
        from public.get_published_content(
            'news_article',
            'uat-draft-news'
        )
    ),
    0::bigint,
    'draft content never leaks through the public projection'
);
select throws_ok(
    $$
        select *
        from public.get_published_content_catalog(
            'unsupported_type',
            null
        )
    $$,
    '22023',
    'content_type_invalid',
    'an unsupported public catalog filter is rejected'
);

select * from finish();

rollback;
