-- Small, deterministic acceptance corpus for local Docker and backend tests.
-- Production content is loaded separately with `npm run content:import`.

select *
from public.import_content_revision(
    'grammar_lesson',
    'UAT-A1-G-001',
    1,
    'A1',
    'Se présenter simplement',
    'معرفی ساده خود',
    jsonb_build_object(
        'catalog', jsonb_build_object(
            'id', 'UAT-A1-G-001',
            'title', 'Se présenter simplement',
            'level', 'A1'
        ),
        'document', jsonb_build_object(
            'id', 'UAT-A1-G-001',
            'title', 'Se présenter simplement',
            'title_fa', 'معرفی ساده خود',
            'level', 'A1',
            'sections', jsonb_build_array(
                jsonb_build_object(
                    'id', 'uat-grammar-introduction',
                    'title', 'Je suis…',
                    'content', 'Une phrase minimale pour valider le rendu.'
                )
            )
        )
    ),
    'uat/grammar/UAT-A1-G-001.json',
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
    'uat-news',
    1,
    'B1',
    'Le journal UAT',
    'خبر آزمایشی',
    jsonb_build_object(
        'catalog', jsonb_build_object(
            'id', 'uat-news',
            'title', 'Le journal UAT',
            'level', 'B1',
            'date', '2026-09-14'
        ),
        'document', jsonb_build_object(
            'id', 'uat-news',
            'title', 'Le journal UAT',
            'title_fa', 'خبر آزمایشی',
            'level', 'B1',
            'content', jsonb_build_array(
                jsonb_build_object(
                    'type', 'paragraph',
                    'text', 'Un article minimal relie les tests de navigation au serveur.'
                )
            )
        )
    ),
    'uat/news/uat-news.json',
    true
);
