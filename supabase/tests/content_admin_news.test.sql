begin;

create extension if not exists pgtap
with schema extensions;

select plan(12);

select has_function(
    'public',
    'news_article_validation_errors',
    array['text', 'jsonb'],
    'News publication has a server-side validator'
);
select has_trigger(
    'public',
    'content_items',
    'content_items_validate_publication',
    'every content publication passes the server contract'
);

select ok(
    'content_key_invalid' = any(public.news_article_validation_errors(
        'article-libre',
        '{}'::jsonb
    )),
    'News identifiers follow the shareable weekly URL contract'
);

select ok(
    'published_date_invalid' = any(public.news_article_validation_errors(
        '2026-w09-invalid-date',
        jsonb_build_object(
            'catalog', jsonb_build_object('id', '2026-w09-invalid-date'),
            'document', jsonb_build_object(
                'id', '2026-w09-invalid-date',
                'publishedDate', '2026-02-31'
            )
        )
    )),
    'calendar dates are validated beyond their shape'
);

select ok(
    'level_range_reversed' = any(public.news_article_validation_errors(
        '2026-w09-invalid-level-range',
        jsonb_build_object(
            'catalog', jsonb_build_object('id', '2026-w09-invalid-level-range'),
            'document', jsonb_build_object(
                'id', '2026-w09-invalid-level-range',
                'level', 'C1-A1'
            )
        )
    )),
    'CEFR ranges cannot be reversed'
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
values (
    'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    'authenticated',
    'authenticated',
    'news-editor@example.test',
    '{}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
);

insert into public.content_admins (user_id)
values ('cccccccc-cccc-4ccc-8ccc-cccccccccccc');

set local role authenticated;
set local "request.jwt.claim.sub" =
    'cccccccc-cccc-4ccc-8ccc-cccccccccccc';

select lives_ok(
    $$
        select * from public.admin_import_content_draft(
            'news_article',
            '2026-w40-invalid',
            2,
            'B1-C1',
            'Article incomplet',
            null,
            jsonb_build_object(
                'catalog', jsonb_build_object(
                    'id', '2026-w40-invalid',
                    'title', 'Article incomplet'
                ),
                'document', jsonb_build_object(
                    'id', '2026-w40-invalid',
                    'title', 'Article incomplet'
                )
            ),
            'admin-panel'
        )
    $$,
    'an incomplete News article can remain a private draft'
);

select throws_ok(
    $$
        select * from public.admin_publish_content_revision(
            'news_article',
            '2026-w40-invalid',
            1
        )
    $$,
    '22023',
    'news_article_not_publishable',
    'an incomplete News draft cannot become public'
);

select lives_ok(
    $$
        select * from public.admin_import_content_draft(
            'news_article',
            '2026-w40-valid-article',
            2,
            'B1-C1',
            'Une actualité vérifiée',
            'خبر تأییدشده',
            jsonb_build_object(
                'catalog', jsonb_build_object(
                    'id', '2026-w40-valid-article',
                    'title', 'Une actualité vérifiée',
                    'level', 'B1-C1',
                    'publishedDate', '2026-10-02',
                    'image', 'https://images.example.test/article.jpg'
                ),
                'document', jsonb_build_object(
                    'id', '2026-w40-valid-article',
                    'title', 'Une actualité vérifiée',
                    'title_fa', 'خبر تأییدشده',
                    'level', 'B1-C1',
                    'publishedDate', '2026-10-02',
                    'image', 'https://images.example.test/article.jpg',
                    'sources', jsonb_build_array(
                        jsonb_build_object(
                            'title', 'Source officielle',
                            'url', 'https://source.example.test/article'
                        )
                    ),
                    'content', jsonb_build_object(
                        'fullText', repeat('Texte complet vérifié. ', 5),
                        'simpleText', repeat('Texte simple. ', 4),
                        'grammar', jsonb_build_array(),
                        'vocabulary', jsonb_build_array()
                    )
                )
            ),
            'admin-panel'
        )
    $$,
    'a complete structured News draft is accepted'
);

select lives_ok(
    $$
        select * from public.admin_publish_content_revision(
            'news_article',
            '2026-w40-valid-article',
            1
        )
    $$,
    'a valid News revision can be published explicitly'
);

select results_eq(
    $$
        select content_key, title_fr
        from public.get_published_content(
            'news_article',
            '2026-w40-valid-article'
        )
    $$,
    $$ values (
        '2026-w40-valid-article'::text,
        'Une actualité vérifiée'::text
    ) $$,
    'the valid article reaches the public projection'
);

reset role;

select is(
    (
        select published_revision_id
        from public.content_items
        where content_key = '2026-w40-invalid'
    ),
    null::uuid,
    'the rejected article remains private'
);

select is(
    (
        select count(*)
        from public.content_publication_events
        where content_item_id = (
            select id
            from public.content_items
            where content_key = '2026-w40-valid-article'
        )
          and action = 'published'
    ),
    1::bigint,
    'the successful News publication remains auditable'
);

select * from finish();

rollback;
