create function public.grammar_table_is_valid(p_table jsonb)
returns boolean
language plpgsql
immutable
security definer
set search_path = ''
as $$
declare
    column_count integer;
    row_value jsonb;
begin
    if jsonb_typeof(p_table) is distinct from 'object'
        or jsonb_typeof(p_table -> 'headers') is distinct from 'array'
        or jsonb_typeof(p_table -> 'rows') is distinct from 'array'
    then
        return false;
    end if;

    column_count := jsonb_array_length(p_table -> 'headers');
    if column_count = 0
        or jsonb_array_length(p_table -> 'rows') = 0
        or exists (
            select 1
            from jsonb_array_elements(p_table -> 'headers') as header(value)
            where jsonb_typeof(header.value) is distinct from 'string'
               or nullif(btrim(header.value #>> '{}'), '') is null
        )
    then
        return false;
    end if;

    for row_value in
        select rows.value
        from jsonb_array_elements(p_table -> 'rows') as rows(value)
    loop
        if jsonb_typeof(row_value) is distinct from 'array'
            or jsonb_array_length(row_value) <> column_count
            or exists (
                select 1
                from jsonb_array_elements(row_value) as cell(value)
                where jsonb_typeof(cell.value) is distinct from 'string'
                   or nullif(btrim(cell.value #>> '{}'), '') is null
            )
        then
            return false;
        end if;
    end loop;

    return true;
end;
$$;

create function public.grammar_lesson_validation_errors(
    p_content_key text,
    p_payload jsonb
)
returns text[]
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
    errors text[] := array[]::text[];
    catalog jsonb;
    document jsonb;
    section jsonb;
    exercise_section jsonb;
    question jsonb;
    item jsonb;
    item_id text;
    seen_ids text[] := array[]::text[];
    reference_exists boolean;
    dependency_cycle boolean;
    correct_index numeric;
    words_sorted text[];
    correct_sorted text[];
begin
    if jsonb_typeof(p_payload) is distinct from 'object' then
        return array_append(errors, 'payload_object_required');
    end if;

    if coalesce(p_content_key, '')
        !~ '^(A1|A2|B1|B2|C1)-G-[0-9]{3}(-[A-Z])?$'
    then
        errors := array_append(errors, 'content_key_invalid');
    end if;

    catalog := p_payload -> 'catalog';
    document := p_payload -> 'document';

    if jsonb_typeof(catalog) is distinct from 'object' then
        errors := array_append(errors, 'catalog_object_required');
        return errors;
    end if;
    if jsonb_typeof(document) is distinct from 'object' then
        errors := array_append(errors, 'document_object_required');
        return errors;
    end if;

    if jsonb_typeof(catalog -> 'id') is distinct from 'string'
        or catalog ->> 'id' is distinct from p_content_key
    then
        errors := array_append(errors, 'catalog_id_mismatch');
    end if;
    if jsonb_typeof(document -> 'id') is distinct from 'string'
        or document ->> 'id' is distinct from p_content_key
    then
        errors := array_append(errors, 'document_id_mismatch');
    end if;
    if jsonb_typeof(catalog -> 'level') is distinct from 'string'
        or jsonb_typeof(document -> 'level') is distinct from 'string'
        or coalesce(catalog ->> 'level', '') !~ '^(A1|A2|B1|B2|C1)$'
        or document ->> 'level' is distinct from catalog ->> 'level'
        or p_content_key !~ ('^' || coalesce(catalog ->> 'level', '') || '-G-')
    then
        errors := array_append(errors, 'level_invalid');
    end if;
    if jsonb_typeof(catalog -> 'title') is distinct from 'string'
        or length(btrim(coalesce(catalog ->> 'title', ''))) < 3
    then
        errors := array_append(errors, 'catalog_title_required');
    end if;
    if jsonb_typeof(document -> 'title') is distinct from 'string'
        or length(btrim(coalesce(document ->> 'title', ''))) < 3
    then
        errors := array_append(errors, 'document_title_required');
    end if;
    if jsonb_typeof(catalog -> 'module') is distinct from 'string'
        or length(btrim(coalesce(catalog ->> 'module', ''))) < 2
    then
        errors := array_append(errors, 'module_required');
    end if;
    if jsonb_typeof(catalog -> 'category') is distinct from 'string'
        or length(btrim(coalesce(catalog ->> 'category', ''))) < 2
    then
        errors := array_append(errors, 'category_required');
    end if;
    if jsonb_typeof(catalog -> 'icon') is distinct from 'string'
        or jsonb_typeof(document -> 'icon') is distinct from 'string'
        or nullif(btrim(catalog ->> 'icon'), '') is null
        or nullif(btrim(document ->> 'icon'), '') is null
    then
        errors := array_append(errors, 'icon_required');
    end if;
    if catalog ? 'title_fa'
        and jsonb_typeof(catalog -> 'title_fa') is distinct from 'string'
    then
        errors := array_append(errors, 'catalog_title_fa_invalid');
    end if;
    if document ? 'title_fa'
        and jsonb_typeof(document -> 'title_fa') is distinct from 'string'
    then
        errors := array_append(errors, 'document_title_fa_invalid');
    end if;

    if jsonb_typeof(catalog -> 'estimatedTime') is distinct from 'number'
        or (catalog ->> 'estimatedTime')::numeric < 1
        or (catalog ->> 'estimatedTime')::numeric > 240
        or jsonb_typeof(document -> 'estimatedTime') is distinct from 'number'
        or document ->> 'estimatedTime' is distinct from catalog ->> 'estimatedTime'
    then
        errors := array_append(errors, 'estimated_time_invalid');
    end if;
    if jsonb_typeof(catalog -> 'importance') is distinct from 'number'
        or (catalog ->> 'importance')::numeric <> trunc((catalog ->> 'importance')::numeric)
        or (catalog ->> 'importance')::numeric < 1
        or (catalog ->> 'importance')::numeric > 5
    then
        errors := array_append(errors, 'importance_invalid');
    end if;
    if jsonb_typeof(catalog -> 'lessons') is distinct from 'number'
        or (catalog ->> 'lessons')::numeric <> trunc((catalog ->> 'lessons')::numeric)
        or (catalog ->> 'lessons')::numeric < 0
    then
        errors := array_append(errors, 'lesson_count_invalid');
    end if;
    if jsonb_typeof(catalog -> 'exercises') is distinct from 'number'
        or (catalog ->> 'exercises')::numeric <> trunc((catalog ->> 'exercises')::numeric)
        or (catalog ->> 'exercises')::numeric < 0
    then
        errors := array_append(errors, 'exercise_count_invalid');
    end if;
    if jsonb_typeof(catalog -> 'recommended') is distinct from 'boolean' then
        errors := array_append(errors, 'recommended_invalid');
    end if;

    if jsonb_typeof(catalog -> 'prerequisites') is distinct from 'array' then
        errors := array_append(errors, 'prerequisites_array_required');
    else
        if (
            select count(*) <> count(distinct prerequisite.value #>> '{}')
            from jsonb_array_elements(catalog -> 'prerequisites') as prerequisite(value)
        ) then
            errors := array_append(errors, 'prerequisites_duplicate');
        end if;

        for item in
            select prerequisite.value
            from jsonb_array_elements(catalog -> 'prerequisites') as prerequisite(value)
        loop
            if jsonb_typeof(item) is distinct from 'string'
                or nullif(btrim(item #>> '{}'), '') is null
            then
                errors := array_append(errors, 'prerequisite_invalid');
                continue;
            end if;
            if item #>> '{}' = p_content_key then
                errors := array_append(errors, 'prerequisite_self_reference');
                continue;
            end if;

            select exists (
                select 1
                from public.content_items as content_item
                where content_item.content_type = 'grammar_lesson'
                  and content_item.content_key = item #>> '{}'
                  and content_item.published_revision_id is not null
                  and content_item.archived_at is null
            ) into reference_exists;
            if not reference_exists then
                errors := array_append(errors, 'prerequisite_unpublished');
                continue;
            end if;

            with recursive dependency_tree(content_key, path) as (
                select
                    item #>> '{}',
                    array[p_content_key, item #>> '{}']::text[]
                union all
                select
                    dependency.value,
                    tree.path || dependency.value
                from dependency_tree as tree
                join public.content_items as dependency_item
                  on dependency_item.content_type = 'grammar_lesson'
                 and dependency_item.content_key = tree.content_key
                 and dependency_item.published_revision_id is not null
                 and dependency_item.archived_at is null
                join public.content_revisions as dependency_revision
                  on dependency_revision.id = dependency_item.published_revision_id
                cross join lateral jsonb_array_elements_text(
                    case
                        when jsonb_typeof(
                            dependency_revision.payload #> '{catalog,prerequisites}'
                        ) = 'array'
                        then dependency_revision.payload #> '{catalog,prerequisites}'
                        else '[]'::jsonb
                    end
                ) as dependency(value)
                where tree.content_key <> p_content_key
                  and (
                    dependency.value = p_content_key
                    or not dependency.value = any(tree.path)
                  )
            )
            select exists (
                select 1
                from dependency_tree
                where content_key = p_content_key
            ) into dependency_cycle;

            if dependency_cycle then
                errors := array_append(errors, 'prerequisite_cycle');
            end if;
        end loop;
    end if;

    if jsonb_typeof(document -> 'sections') is distinct from 'array'
        or jsonb_array_length(document -> 'sections') = 0
    then
        errors := array_append(errors, 'lesson_section_required');
    else
        for section in
            select sections.value
            from jsonb_array_elements(document -> 'sections') as sections(value)
        loop
            item_id := nullif(btrim(section ->> 'id'), '');
            if jsonb_typeof(section) is distinct from 'object'
                or jsonb_typeof(section -> 'id') is distinct from 'string'
                or section ->> 'type' is distinct from 'lesson'
                or jsonb_typeof(section -> 'title') is distinct from 'string'
                or jsonb_typeof(section -> 'content') is distinct from 'string'
                or item_id is null
                or length(btrim(coalesce(section ->> 'title', ''))) < 2
                or length(btrim(coalesce(section ->> 'content', ''))) < 10
            then
                errors := array_append(errors, 'lesson_section_invalid');
            end if;
            if item_id = any(seen_ids) then
                errors := array_append(errors, 'section_id_duplicate');
            elsif item_id is not null then
                seen_ids := array_append(seen_ids, item_id);
            end if;

            if section ? 'table'
                and not public.grammar_table_is_valid(section -> 'table')
            then
                errors := array_append(errors, 'lesson_table_invalid');
            end if;
            if section ? 'table2'
                and not public.grammar_table_is_valid(section -> 'table2')
            then
                errors := array_append(errors, 'lesson_table_invalid');
            end if;
            if section ? 'examples' then
                if jsonb_typeof(section -> 'examples') is distinct from 'array'
                    or exists (
                        select 1
                        from jsonb_array_elements(section -> 'examples') as example(value)
                        where jsonb_typeof(example.value) is distinct from 'object'
                           or jsonb_typeof(example.value -> 'fr') is distinct from 'string'
                           or length(btrim(coalesce(example.value ->> 'fr', ''))) < 2
                    )
                then
                    errors := array_append(errors, 'lesson_examples_invalid');
                end if;
            end if;
        end loop;
    end if;

    if jsonb_typeof(p_payload -> 'exerciseSections') is distinct from 'array' then
        errors := array_append(errors, 'exercise_sections_array_required');
    else
        for exercise_section in
            select sections.value
            from jsonb_array_elements(p_payload -> 'exerciseSections') as sections(value)
        loop
            item_id := nullif(btrim(exercise_section ->> 'id'), '');
            if jsonb_typeof(exercise_section) is distinct from 'object'
                or jsonb_typeof(exercise_section -> 'id') is distinct from 'string'
                or jsonb_typeof(exercise_section -> 'type') is distinct from 'string'
                or coalesce(exercise_section ->> 'type', '') !~ '^(exercise|quiz)$'
                or jsonb_typeof(exercise_section -> 'title') is distinct from 'string'
                or item_id is null
                or length(btrim(coalesce(exercise_section ->> 'title', ''))) < 2
                or jsonb_typeof(exercise_section -> 'questions') is distinct from 'array'
                or jsonb_array_length(exercise_section -> 'questions') = 0
            then
                errors := array_append(errors, 'exercise_section_invalid');
                continue;
            end if;
            if item_id = any(seen_ids) then
                errors := array_append(errors, 'section_id_duplicate');
            else
                seen_ids := array_append(seen_ids, item_id);
            end if;

            if exercise_section ? 'displayCount'
                and (
                    jsonb_typeof(exercise_section -> 'displayCount') is distinct from 'number'
                    or (exercise_section ->> 'displayCount')::numeric <> trunc((exercise_section ->> 'displayCount')::numeric)
                    or (exercise_section ->> 'displayCount')::numeric < 1
                    or (exercise_section ->> 'displayCount')::numeric > jsonb_array_length(exercise_section -> 'questions')
                )
            then
                errors := array_append(errors, 'display_count_invalid');
            end if;

            for question in
                select questions.value
                from jsonb_array_elements(exercise_section -> 'questions') as questions(value)
            loop
                if jsonb_typeof(question) is distinct from 'object'
                    or jsonb_typeof(question -> 'question') is distinct from 'string'
                    or jsonb_typeof(question -> 'type') is distinct from 'string'
                    or length(btrim(coalesce(question ->> 'question', ''))) < 3
                    or coalesce(question ->> 'type', '') !~ '^(mcq|binary|fill_blank|ordering)$'
                then
                    errors := array_append(errors, 'exercise_question_invalid');
                    continue;
                end if;
                if question ? 'explanation'
                    and jsonb_typeof(question -> 'explanation') is distinct from 'string'
                then
                    errors := array_append(errors, 'exercise_explanation_invalid');
                end if;
                if question ? 'explanation_fa'
                    and jsonb_typeof(question -> 'explanation_fa') is distinct from 'string'
                then
                    errors := array_append(errors, 'exercise_explanation_invalid');
                end if;

                if question ->> 'type' in ('mcq', 'binary') then
                    if jsonb_typeof(question -> 'options') is distinct from 'array'
                        or jsonb_array_length(question -> 'options') < 2
                        or (
                            question ->> 'type' = 'binary'
                            and jsonb_array_length(question -> 'options') <> 2
                        )
                        or exists (
                            select 1
                            from jsonb_array_elements(question -> 'options') as option(value)
                            where jsonb_typeof(option.value) is distinct from 'string'
                               or nullif(btrim(option.value #>> '{}'), '') is null
                        )
                        or (
                            select count(*) <> count(distinct option.value #>> '{}')
                            from jsonb_array_elements(question -> 'options') as option(value)
                        )
                        or jsonb_typeof(question -> 'correct') is distinct from 'number'
                    then
                        errors := array_append(errors, 'choice_question_invalid');
                    else
                        correct_index := (question ->> 'correct')::numeric;
                        if correct_index <> trunc(correct_index)
                            or correct_index < 0
                            or correct_index >= jsonb_array_length(question -> 'options')
                        then
                            errors := array_append(errors, 'choice_question_invalid');
                        end if;
                    end if;
                elsif question ->> 'type' = 'fill_blank' then
                    if jsonb_typeof(question -> 'correct') is distinct from 'string'
                        or nullif(btrim(question ->> 'correct'), '') is null
                    then
                        errors := array_append(errors, 'fill_blank_question_invalid');
                    end if;
                elsif question ->> 'type' = 'ordering' then
                    if jsonb_typeof(question -> 'words') is distinct from 'array'
                        or jsonb_typeof(question -> 'correct') is distinct from 'array'
                        or jsonb_array_length(question -> 'words') < 2
                        or jsonb_array_length(question -> 'words') <> jsonb_array_length(question -> 'correct')
                        or exists (
                            select 1
                            from jsonb_array_elements(question -> 'words') as word(value)
                            where jsonb_typeof(word.value) is distinct from 'string'
                               or nullif(btrim(word.value #>> '{}'), '') is null
                        )
                        or exists (
                            select 1
                            from jsonb_array_elements(question -> 'correct') as word(value)
                            where jsonb_typeof(word.value) is distinct from 'string'
                               or nullif(btrim(word.value #>> '{}'), '') is null
                        )
                    then
                        errors := array_append(errors, 'ordering_question_invalid');
                    else
                        select array_agg(word.value #>> '{}' order by word.value #>> '{}')
                        into words_sorted
                        from jsonb_array_elements(question -> 'words') as word(value);
                        select array_agg(word.value #>> '{}' order by word.value #>> '{}')
                        into correct_sorted
                        from jsonb_array_elements(question -> 'correct') as word(value);
                        if words_sorted is distinct from correct_sorted then
                            errors := array_append(errors, 'ordering_question_invalid');
                        end if;
                    end if;
                end if;
            end loop;
        end loop;
    end if;

    return errors;
end;
$$;

create or replace function public.enforce_content_publication_contract()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
    target_payload jsonb;
    current_payload jsonb;
    target_level text;
    target_title_fr text;
    target_title_fa text;
    target_schema_version integer;
    validation_errors text[];
    removes_published_section boolean;
begin
    if new.published_revision_id is null
        or new.published_revision_id is not distinct from old.published_revision_id
    then
        return new;
    end if;

    select
        revisions.payload,
        revisions.level,
        revisions.title_fr,
        revisions.title_fa,
        revisions.schema_version
    into
        target_payload,
        target_level,
        target_title_fr,
        target_title_fa,
        target_schema_version
    from public.content_revisions as revisions
    where revisions.id = new.published_revision_id
      and revisions.content_item_id = new.id;

    if not found then
        raise exception using
            errcode = '23503',
            message = 'published_revision_invalid';
    end if;

    if new.content_type = 'news_article' then
        validation_errors := public.news_article_validation_errors(
            new.content_key,
            target_payload
        );

        if cardinality(validation_errors) > 0 then
            raise exception using
                errcode = '22023',
                message = 'news_article_not_publishable',
                detail = array_to_string(validation_errors, ',');
        end if;
    elsif new.content_type = 'grammar_lesson' then
        validation_errors := public.grammar_lesson_validation_errors(
            new.content_key,
            target_payload
        );

        if target_schema_version is distinct from 2 then
            validation_errors := array_append(
                validation_errors,
                'schema_version_invalid'
            );
        end if;
        if target_level is distinct from target_payload #>> '{catalog,level}'
            or target_level is distinct from target_payload #>> '{document,level}'
        then
            validation_errors := array_append(
                validation_errors,
                'revision_level_mismatch'
            );
        end if;
        if target_title_fr is distinct from target_payload #>> '{catalog,title}' then
            validation_errors := array_append(
                validation_errors,
                'revision_title_mismatch'
            );
        end if;
        if nullif(btrim(coalesce(target_title_fa, '')), '')
            is distinct from
            nullif(btrim(coalesce(target_payload #>> '{catalog,title_fa}', '')), '')
        then
            validation_errors := array_append(
                validation_errors,
                'revision_title_fa_mismatch'
            );
        end if;

        if old.published_revision_id is not null then
            select revisions.payload
            into current_payload
            from public.content_revisions as revisions
            where revisions.id = old.published_revision_id;

            select exists (
                select 1
                from (
                    (
                        select previous.value ->> 'id' as section_id
                        from jsonb_array_elements(
                            coalesce(current_payload #> '{document,sections}', '[]'::jsonb)
                        ) as previous(value)
                        union
                        select previous.value ->> 'id'
                        from jsonb_array_elements(
                            coalesce(current_payload -> 'exerciseSections', '[]'::jsonb)
                        ) as previous(value)
                    )
                    except
                    (
                        select proposed.value ->> 'id'
                        from jsonb_array_elements(
                            coalesce(target_payload #> '{document,sections}', '[]'::jsonb)
                        ) as proposed(value)
                        union
                        select proposed.value ->> 'id'
                        from jsonb_array_elements(
                            coalesce(target_payload -> 'exerciseSections', '[]'::jsonb)
                        ) as proposed(value)
                    )
                ) as removed
                where removed.section_id is not null
            ) into removes_published_section;

            if removes_published_section then
                validation_errors := array_append(
                    validation_errors,
                    'published_section_removed'
                );
            end if;
        end if;

        if cardinality(validation_errors) > 0 then
            raise exception using
                errcode = '22023',
                message = 'grammar_lesson_not_publishable',
                detail = array_to_string(validation_errors, ',');
        end if;
    end if;

    return new;
end;
$$;

revoke all on function public.grammar_table_is_valid(jsonb)
from public, anon, authenticated;
revoke all on function public.grammar_lesson_validation_errors(text, jsonb)
from public, anon, authenticated;
