begin;

create extension if not exists pgtap
with schema extensions;

select plan(24);

select has_function(
    'public',
    'grammar_lesson_validation_errors',
    array['text', 'jsonb'],
    'Grammar publication has a server-side validator'
);
select has_function(
    'public',
    'grammar_table_is_valid',
    array['jsonb'],
    'Grammar tables have one canonical structural validator'
);
select has_trigger(
    'public',
    'content_items',
    'content_items_validate_publication',
    'every content publication passes the server contract'
);

select ok(
    'content_key_invalid' = any(public.grammar_lesson_validation_errors(
        'grammar-libre',
        '{}'::jsonb
    )),
    'Grammar identifiers follow the stable level contract'
);
select ok(
    not public.grammar_table_is_valid(jsonb_build_object(
        'headers', jsonb_build_array('Sujet', 'Verbe'),
        'rows', jsonb_build_array(jsonb_build_array('Je'))
    )),
    'ragged Grammar tables are rejected'
);
select ok(
    'ordering_question_invalid' = any(public.grammar_lesson_validation_errors(
        'A1-G-994',
        jsonb_build_object(
            'catalog', jsonb_build_object(
                'id', 'A1-G-994',
                'title', 'Leçon invalide',
                'level', 'A1',
                'module', 'Tests',
                'category', 'base',
                'icon', 'book',
                'estimatedTime', 5,
                'importance', 1,
                'lessons', 1,
                'exercises', 1,
                'recommended', false,
                'prerequisites', jsonb_build_array()
            ),
            'document', jsonb_build_object(
                'id', 'A1-G-994',
                'title', 'Leçon invalide',
                'level', 'A1',
                'icon', 'book',
                'estimatedTime', 5,
                'sections', jsonb_build_array(
                    jsonb_build_object(
                        'id', 'A1-G-994-1',
                        'type', 'lesson',
                        'title', 'Cours',
                        'content', 'Un contenu volontairement valide.'
                    )
                )
            ),
            'exerciseSections', jsonb_build_array(
                jsonb_build_object(
                    'id', 'A1-G-994-ex1',
                    'type', 'exercise',
                    'title', 'Ordre',
                    'questions', jsonb_build_array(
                        jsonb_build_object(
                            'type', 'ordering',
                            'question', 'Remettez dans l’ordre.',
                            'words', jsonb_build_array('Je', 'suis'),
                            'correct', jsonb_build_array('Un', 'intrus')
                        )
                    )
                )
            )
        )
    )),
    'ordering answers must be an exact permutation of proposed words'
);
select ok(
    'catalog_title_required' = any(public.grammar_lesson_validation_errors(
        'A1-G-994',
        jsonb_build_object(
            'catalog', jsonb_build_object('title', 12345),
            'document', jsonb_build_object(),
            'exerciseSections', jsonb_build_array()
        )
    )),
    'numeric values cannot masquerade as Grammar text fields'
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
    'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
    'authenticated',
    'authenticated',
    'grammar-editor@example.test',
    '{}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
);

insert into public.content_admins (user_id)
values ('dddddddd-dddd-4ddd-8ddd-dddddddddddd');

set local role authenticated;
set local "request.jwt.claim.sub" =
    'dddddddd-dddd-4ddd-8ddd-dddddddddddd';

select lives_ok(
    $$
        select * from public.admin_import_content_draft(
            'grammar_lesson',
            'A1-G-993',
            2,
            'A1',
            'Leçon incomplète',
            null,
            jsonb_build_object(
                'catalog', jsonb_build_object(
                    'id', 'A1-G-993',
                    'title', 'Leçon incomplète'
                ),
                'document', jsonb_build_object(
                    'id', 'A1-G-993',
                    'title', 'Leçon incomplète'
                )
            ),
            'admin-panel'
        )
    $$,
    'an incomplete Grammar lesson can remain a private draft'
);

select throws_ok(
    $$
        select * from public.admin_publish_content_revision(
            'grammar_lesson',
            'A1-G-993',
            1
        )
    $$,
    '22023',
    'grammar_lesson_not_publishable',
    'an incomplete Grammar draft cannot become public'
);

select lives_ok(
    $$
        select * from public.admin_import_content_draft(
            'grammar_lesson',
            'A1-G-992',
            2,
            'A1',
            'Carte du présent',
            'کارت زمان حال',
            jsonb_build_object(
                'catalog', jsonb_build_object(
                    'id', 'A1-G-992',
                    'title', 'Carte du présent',
                    'title_fa', 'کارت زمان حال',
                    'level', 'A1',
                    'module', 'Fondations',
                    'category', 'verbe',
                    'icon', 'book',
                    'estimatedTime', 10,
                    'importance', 2,
                    'lessons', 1,
                    'exercises', 4,
                    'recommended', true,
                    'prerequisites', jsonb_build_array()
                ),
                'document', jsonb_build_object(
                    'id', 'A1-G-992',
                    'title', 'Le présent validé',
                    'title_fa', 'حال ساده',
                    'level', 'A1',
                    'icon', 'notebook',
                    'estimatedTime', 10,
                    'sections', jsonb_build_array(
                        jsonb_build_object(
                            'id', 'A1-G-992-1',
                            'type', 'lesson',
                            'title', 'Former le présent',
                            'content', 'Le présent décrit une action actuelle.',
                            'table', jsonb_build_object(
                                'headers', jsonb_build_array('Sujet', 'Verbe'),
                                'rows', jsonb_build_array(
                                    jsonb_build_array('Je', 'suis')
                                )
                            )
                        )
                    )
                ),
                'exerciseSections', jsonb_build_array(
                    jsonb_build_object(
                        'id', 'A1-G-992-ex1',
                        'type', 'exercise',
                        'title', 'S’entraîner',
                        'displayCount', 4,
                        'questions', jsonb_build_array(
                            jsonb_build_object(
                                'type', 'mcq',
                                'question', 'Tu ___ ici.',
                                'options', jsonb_build_array('es', 'est'),
                                'correct', 0
                            ),
                            jsonb_build_object(
                                'type', 'binary',
                                'question', 'Je suis est correct.',
                                'options', jsonb_build_array('Vrai', 'Faux'),
                                'correct', 0
                            ),
                            jsonb_build_object(
                                'type', 'fill_blank',
                                'question', 'Je ___ ici.',
                                'correct', 'suis'
                            ),
                            jsonb_build_object(
                                'type', 'ordering',
                                'question', 'Remettez dans l’ordre.',
                                'words', jsonb_build_array('ici', 'Je', 'suis'),
                                'correct', jsonb_build_array('Je', 'suis', 'ici')
                            )
                        )
                    )
                )
            ),
            'admin-panel'
        )
    $$,
    'a complete structured Grammar draft is accepted'
);

select lives_ok(
    $$
        select * from public.admin_publish_content_revision(
            'grammar_lesson',
            'A1-G-992',
            1
        )
    $$,
    'a valid Grammar revision can be published explicitly'
);

select results_eq(
    $$
        select content_key, title_fr
        from public.get_published_content(
            'grammar_lesson',
            'A1-G-992'
        )
    $$,
    $$ values ('A1-G-992'::text, 'Carte du présent'::text) $$,
    'the valid lesson reaches the public projection'
);

select lives_ok(
    $$
        select * from public.admin_import_content_draft(
            'grammar_lesson',
            'A1-G-992',
            2,
            'B1',
            'Carte du présent',
            'کارت زمان حال',
            (
                select payload
                from public.get_published_content(
                    'grammar_lesson',
                    'A1-G-992'
                )
            ),
            'admin-panel'
        )
    $$,
    'a mismatched metadata revision may remain a private draft'
);

select throws_ok(
    $$
        select * from public.admin_publish_content_revision(
            'grammar_lesson',
            'A1-G-992',
            2
        )
    $$,
    '22023',
    'grammar_lesson_not_publishable',
    'revision metadata must match the Grammar payload before publication'
);

select lives_ok(
    $$
        select * from public.admin_import_content_draft(
            'grammar_lesson',
            'A1-G-990',
            2,
            'A1',
            'Prérequis privé',
            null,
            jsonb_build_object(
                'catalog', jsonb_build_object(
                    'id', 'A1-G-990',
                    'title', 'Prérequis privé'
                ),
                'document', jsonb_build_object(
                    'id', 'A1-G-990',
                    'title', 'Prérequis privé'
                )
            ),
            'admin-panel'
        )
    $$,
    'an unpublished prerequisite can exist as a draft'
);

select lives_ok(
    $$
        select * from public.admin_import_content_draft(
            'grammar_lesson',
            'A1-G-989',
            2,
            'A1',
            'Carte du présent',
            'کارت زمان حال',
            jsonb_set(
                replace(
                    (
                        select payload::text
                        from public.get_published_content(
                            'grammar_lesson',
                            'A1-G-992'
                        )
                    ),
                    'A1-G-992',
                    'A1-G-989'
                )::jsonb,
                '{catalog,prerequisites}',
                '["A1-G-990"]'::jsonb
            ),
            'admin-panel'
        )
    $$,
    'a lesson with a private prerequisite may remain a draft'
);

select throws_ok(
    $$
        select * from public.admin_publish_content_revision(
            'grammar_lesson',
            'A1-G-989',
            1
        )
    $$,
    '22023',
    'grammar_lesson_not_publishable',
    'a public lesson cannot depend on a private prerequisite'
);

select lives_ok(
    $$
        select * from public.admin_import_content_draft(
            'grammar_lesson',
            'A1-G-992',
            2,
            'A1',
            'Carte du présent',
            'کارت زمان حال',
            jsonb_set(
                (
                    select payload
                    from public.get_published_content(
                        'grammar_lesson',
                        'A1-G-992'
                    )
                ),
                '{document,sections,0,id}',
                '"A1-G-992-2"'::jsonb
            ),
            'admin-panel'
        )
    $$,
    'a revision that renames a published section can remain a draft'
);

select throws_ok(
    $$
        select * from public.admin_publish_content_revision(
            'grammar_lesson',
            'A1-G-992',
            3
        )
    $$,
    '22023',
    'grammar_lesson_not_publishable',
    'a published section identity cannot disappear from a later revision'
);

select lives_ok(
    $$
        select * from public.admin_import_content_draft(
            'grammar_lesson',
            'A1-G-992',
            2,
            'A1',
            'Carte du présent',
            'کارت زمان حال',
            jsonb_set(
                (
                    select payload
                    from public.get_published_content(
                        'grammar_lesson',
                        'A1-G-992'
                    )
                ),
                '{catalog,prerequisites}',
                '["A1-G-998"]'::jsonb
            ),
            'admin-panel'
        )
    $$,
    'a valid published prerequisite can be added in a draft'
);

select lives_ok(
    $$
        select * from public.admin_publish_content_revision(
            'grammar_lesson',
            'A1-G-992',
            4
        )
    $$,
    'a lesson can depend on an already published acyclic prerequisite'
);

select lives_ok(
    $$
        select * from public.admin_import_content_draft(
            'grammar_lesson',
            'A1-G-998',
            2,
            'A1',
            'Se présenter simplement',
            'معرفی ساده خود',
            jsonb_set(
                (
                    select payload
                    from public.get_published_content(
                        'grammar_lesson',
                        'A1-G-998'
                    )
                ),
                '{catalog,prerequisites}',
                '["A1-G-992"]'::jsonb
            ),
            'admin-panel'
        )
    $$,
    'a cyclic prerequisite proposal may remain a draft'
);

select throws_ok(
    $$
        select * from public.admin_publish_content_revision(
            'grammar_lesson',
            'A1-G-998',
            2
        )
    $$,
    '22023',
    'grammar_lesson_not_publishable',
    'a prerequisite cycle cannot be published'
);

reset role;

select is(
    (
        select published_revision_id
        from public.content_items
        where content_key = 'A1-G-993'
    ),
    null::uuid,
    'the rejected lesson remains private'
);

select * from finish();

rollback;
