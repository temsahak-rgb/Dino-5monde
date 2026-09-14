-- Small, deterministic acceptance corpus for local Docker and backend tests.
-- Production content is loaded separately with `npm run content:import`.

select *
from public.import_content_revision(
    'grammar_lesson',
    'A1-G-998',
    2,
    'A1',
    'Se présenter simplement',
    'معرفی ساده خود',
    jsonb_build_object(
        'catalog', jsonb_build_object(
            'id', 'A1-G-998',
            'title', 'Se présenter simplement',
            'title_fa', 'معرفی ساده خود',
            'level', 'A1',
            'module', 'UAT',
            'category', 'base',
            'icon', '🧪',
            'estimatedTime', 5,
            'importance', 1,
            'lessons', 1,
            'exercises', 0,
            'recommended', false,
            'prerequisites', jsonb_build_array()
        ),
        'document', jsonb_build_object(
            'id', 'A1-G-998',
            'title', 'Se présenter simplement',
            'title_fa', 'معرفی ساده خود',
            'level', 'A1',
            'icon', '🧪',
            'estimatedTime', 5,
            'sections', jsonb_build_array(
                jsonb_build_object(
                    'id', 'A1-G-998-1',
                    'type', 'lesson',
                    'title', 'Je suis…',
                    'content', 'Une phrase minimale pour valider le rendu.'
                )
            )
        ),
        'exerciseSections', jsonb_build_array()
    ),
    'uat/grammar/A1-G-998.json',
    true
);

select *
from public.import_content_revision(
    'vocabulary_pack',
    'uat-salutations',
    1,
    'A1',
    'Salutations UAT',
    'سلام و احوالپرسی',
    jsonb_build_object(
        'catalog', jsonb_build_object(
            'id', 'uat-salutations',
            'title', 'Salutations UAT',
            'level', 'A1'
        ),
        'document', jsonb_build_object(
            'id', 'uat-salutations',
            'title', 'Salutations UAT',
            'title_fa', 'سلام و احوالپرسی',
            'level', 'A1',
            'words', jsonb_build_array(
                jsonb_build_object(
                    'fr', 'bonjour',
                    'fa', 'سلام'
                )
            )
        )
    ),
    'uat/vocabulary/uat-salutations.json',
    true
);

select *
from public.import_content_revision(
    'travel_lesson',
    'uat-hotel',
    1,
    'A1',
    'À l’hôtel — UAT',
    'در هتل',
    jsonb_build_object(
        'catalog', jsonb_build_object(
            'id', 'uat-hotel',
            'title', 'À l’hôtel — UAT',
            'level', 'A1'
        ),
        'document', jsonb_build_object(
            'id', 'uat-hotel',
            'title', 'À l’hôtel — UAT',
            'title_fa', 'در هتل',
            'level', 'A1',
            'sections', jsonb_build_array(
                jsonb_build_object(
                    'id', 'uat-travel-arrival',
                    'title', 'L’arrivée',
                    'content', 'Je voudrais une chambre, s’il vous plaît.'
                )
            )
        )
    ),
    'uat/travel/uat-hotel.json',
    true
);

select *
from public.import_content_revision(
    'news_article',
    '2026-w38-uat-news',
    1,
    'B1',
    'Le journal UAT',
    'خبر آزمایشی',
    jsonb_build_object(
        'catalog', jsonb_build_object(
            'id', '2026-w38-uat-news',
            'title', 'Le journal UAT',
            'level', 'B1',
            'image', 'https://images.example.test/uat-news.jpg',
            'publishedDate', '2026-09-14',
            'week', 38,
            'year', 2026
        ),
        'document', jsonb_build_object(
            'id', '2026-w38-uat-news',
            'title', 'Le journal UAT',
            'title_fa', 'خبر آزمایشی',
            'level', 'B1',
            'image', 'https://images.example.test/uat-news.jpg',
            'imageAlt', 'Illustration de l’actualité UAT',
            'publishedDate', '2026-09-14',
            'sources', jsonb_build_array(
                jsonb_build_object(
                    'title', 'Source UAT officielle',
                    'url', 'https://source.example.test/uat-news'
                )
            ),
            'content', jsonb_build_object(
                'fullText', repeat(
                    'Un article UAT complet relie les tests de navigation au serveur canonique. ',
                    2
                ),
                'simpleText', 'Cet article UAT vérifie simplement la lecture depuis le serveur.',
                'grammar', jsonb_build_array(),
                'vocabulary', jsonb_build_array()
            )
        )
    ),
    'uat/news/uat-news.json',
    true
);
