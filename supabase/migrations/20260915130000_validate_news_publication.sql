create function public.news_article_validation_errors(
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
    article_content jsonb;
    item jsonb;
    reference_exists boolean;
begin
    if jsonb_typeof(p_payload) is distinct from 'object' then
        return array_append(errors, 'payload_object_required');
    end if;

    if coalesce(p_content_key, '')
        !~ '^\d{4}-w(0[1-9]|[1-4]\d|5[0-3])-[a-z0-9]+(-[a-z0-9]+)*$'
    then
        errors := array_append(errors, 'content_key_invalid');
    end if;

    catalog := p_payload -> 'catalog';
    document := p_payload -> 'document';

    if jsonb_typeof(catalog) is distinct from 'object' then
        errors := array_append(errors, 'catalog_object_required');
    end if;
    if jsonb_typeof(document) is distinct from 'object' then
        errors := array_append(errors, 'document_object_required');
        return errors;
    end if;

    if catalog ->> 'id' is distinct from p_content_key then
        errors := array_append(errors, 'catalog_id_mismatch');
    end if;
    if document ->> 'id' is distinct from p_content_key then
        errors := array_append(errors, 'document_id_mismatch');
    end if;
    if nullif(btrim(document ->> 'title'), '') is null then
        errors := array_append(errors, 'title_required');
    end if;
    if catalog ->> 'title' is distinct from document ->> 'title' then
        errors := array_append(errors, 'catalog_title_mismatch');
    end if;
    if coalesce(document ->> 'level', '')
        !~ '^(A1|A2|B1|B2|C1|C2)(-(A1|A2|B1|B2|C1|C2))?$'
    then
        errors := array_append(errors, 'level_invalid');
    elsif position('-' in document ->> 'level') > 0
        and array_position(
            array['A1', 'A2', 'B1', 'B2', 'C1', 'C2'],
            split_part(document ->> 'level', '-', 1)
        ) > array_position(
            array['A1', 'A2', 'B1', 'B2', 'C1', 'C2'],
            split_part(document ->> 'level', '-', 2)
        )
    then
        errors := array_append(errors, 'level_range_reversed');
    end if;
    if coalesce(document ->> 'publishedDate', '')
        !~ '^\d{4}-\d{2}-\d{2}$'
    then
        errors := array_append(errors, 'published_date_invalid');
    else
        begin
            if to_char(
                to_date(document ->> 'publishedDate', 'YYYY-MM-DD'),
                'YYYY-MM-DD'
            ) is distinct from document ->> 'publishedDate'
            then
                errors := array_append(errors, 'published_date_invalid');
            end if;
        exception
            when others then
                errors := array_append(errors, 'published_date_invalid');
        end;
    end if;
    if (
        coalesce(document ->> 'image', '') !~ '^https://'
        and coalesce(document ->> 'image', '') !~ '^\./data/news/images/'
    ) then
        errors := array_append(errors, 'image_invalid');
    end if;

    article_content := document -> 'content';
    if jsonb_typeof(article_content) is distinct from 'object' then
        errors := array_append(errors, 'content_object_required');
        return errors;
    end if;
    if length(btrim(coalesce(article_content ->> 'fullText', ''))) < 80 then
        errors := array_append(errors, 'full_text_too_short');
    end if;
    if length(btrim(coalesce(article_content ->> 'simpleText', ''))) < 40 then
        errors := array_append(errors, 'simple_text_too_short');
    end if;

    if jsonb_typeof(document -> 'sources') is distinct from 'array'
        or jsonb_array_length(document -> 'sources') = 0
    then
        errors := array_append(errors, 'source_required');
    else
        for item in
            select source.value
            from jsonb_array_elements(document -> 'sources') as source(value)
        loop
            if jsonb_typeof(item) is distinct from 'object'
                or length(btrim(coalesce(item ->> 'title', ''))) < 3
                or coalesce(item ->> 'url', '') !~ '^https://'
            then
                errors := array_append(errors, 'source_invalid');
            end if;
        end loop;
    end if;

    if article_content ? 'grammar' then
        if jsonb_typeof(article_content -> 'grammar') is distinct from 'array' then
            errors := array_append(errors, 'grammar_array_invalid');
        else
            for item in
                select annotation.value
                from jsonb_array_elements(article_content -> 'grammar')
                    as annotation(value)
            loop
                if jsonb_typeof(item) is distinct from 'object'
                    or length(btrim(coalesce(item ->> 'title', ''))) < 2
                    or length(btrim(coalesce(item ->> 'example', ''))) < 2
                then
                    errors := array_append(errors, 'grammar_annotation_invalid');
                end if;

                if nullif(btrim(item ->> 'level'), '') is not null
                    and item ->> 'level' !~ '^(A1|A2|B1|B2|C1|C2)$'
                then
                    errors := array_append(errors, 'grammar_level_invalid');
                end if;

                if nullif(btrim(item ->> 'grammarId'), '') is not null then
                    select exists (
                        select 1
                        from public.content_items as items
                        where items.content_type = 'grammar_lesson'
                          and items.content_key = item ->> 'grammarId'
                          and items.published_revision_id is not null
                          and items.archived_at is null
                    ) into reference_exists;

                    if not reference_exists then
                        errors := array_append(errors, 'grammar_reference_unpublished');
                    end if;
                end if;
            end loop;
        end if;
    end if;

    if article_content ? 'vocabulary' then
        if jsonb_typeof(article_content -> 'vocabulary') is distinct from 'array' then
            errors := array_append(errors, 'vocabulary_array_invalid');
        else
            for item in
                select annotation.value
                from jsonb_array_elements(article_content -> 'vocabulary')
                    as annotation(value)
            loop
                if jsonb_typeof(item) is distinct from 'object'
                    or nullif(btrim(item ->> 'fr'), '') is null
                    or nullif(btrim(item ->> 'fa'), '') is null
                then
                    errors := array_append(errors, 'vocabulary_annotation_invalid');
                end if;

                if nullif(btrim(item ->> 'level'), '') is not null
                    and item ->> 'level' !~ '^(A1|A2|B1|B2|C1|C2)$'
                then
                    errors := array_append(errors, 'vocabulary_level_invalid');
                end if;

                if nullif(btrim(item ->> 'packId'), '') is not null then
                    select exists (
                        select 1
                        from public.content_items as items
                        where items.content_type = 'vocabulary_pack'
                          and items.content_key = item ->> 'packId'
                          and items.published_revision_id is not null
                          and items.archived_at is null
                    ) into reference_exists;

                    if not reference_exists then
                        errors := array_append(errors, 'vocabulary_reference_unpublished');
                    end if;
                end if;
            end loop;
        end if;
    end if;

    return errors;
end;
$$;

create function public.enforce_content_publication_contract()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
    target_payload jsonb;
    validation_errors text[];
begin
    if new.published_revision_id is null
        or new.published_revision_id is not distinct from old.published_revision_id
    then
        return new;
    end if;

    select revisions.payload
    into target_payload
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
    end if;

    return new;
end;
$$;

create trigger content_items_validate_publication
before update of published_revision_id
on public.content_items
for each row
execute function public.enforce_content_publication_contract();

revoke all on function public.news_article_validation_errors(text, jsonb)
from public, anon, authenticated;
revoke all on function public.enforce_content_publication_contract()
from public, anon, authenticated;
