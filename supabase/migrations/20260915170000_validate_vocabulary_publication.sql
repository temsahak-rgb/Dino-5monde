create function public.vocabulary_pack_validation_errors(
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
    word jsonb;
    question jsonb;
    assessment jsonb;
    normalized_words text[] := array[]::text[];
    normalized_word text;
    correct_index integer;
begin
    if jsonb_typeof(p_payload) is distinct from 'object' then
        return array['payload_invalid'];
    end if;
    catalog := p_payload -> 'catalog';
    document := p_payload -> 'document';
    if jsonb_typeof(catalog) is distinct from 'object' then errors := array_append(errors, 'catalog_invalid'); end if;
    if jsonb_typeof(document) is distinct from 'object' then return array_append(errors, 'document_invalid'); end if;
    if catalog ->> 'id' is distinct from p_content_key or document ->> 'id' is distinct from p_content_key then errors := array_append(errors, 'content_identity_mismatch'); end if;
    if document ->> 'level' not in ('A1','A2','B1','B2','C1','C2') then errors := array_append(errors, 'level_invalid'); end if;
    if nullif(btrim(coalesce(catalog ->> 'title', '')), '') is null then errors := array_append(errors, 'catalog_title_required'); end if;
    if nullif(btrim(coalesce(document ->> 'title', document ->> 'theme', '')), '') is null then errors := array_append(errors, 'document_title_required'); end if;
    if jsonb_typeof(document -> 'words') is distinct from 'array' or jsonb_array_length(document -> 'words') = 0 then return array_append(errors, 'words_invalid'); end if;
    if jsonb_typeof(catalog -> 'words') = 'number' and (catalog ->> 'words')::integer <> jsonb_array_length(document -> 'words') then errors := array_append(errors, 'word_count_mismatch'); end if;

    for word in select value from jsonb_array_elements(document -> 'words') loop
        if jsonb_typeof(word) is distinct from 'object'
            or jsonb_typeof(word -> 'fr') is distinct from 'string'
            or jsonb_typeof(word -> 'fa') is distinct from 'string'
            or nullif(btrim(word ->> 'fr'), '') is null
            or nullif(btrim(word ->> 'fa'), '') is null
        then errors := array_append(errors, 'word_invalid'); continue; end if;
        normalized_word := lower(btrim(word ->> 'fr'));
        if normalized_word = any(normalized_words) then errors := array_append(errors, 'word_duplicate'); else normalized_words := array_append(normalized_words, normalized_word); end if;
        if word ? 'difficulty' and (jsonb_typeof(word -> 'difficulty') is distinct from 'number' or (word ->> 'difficulty')::numeric not between 1 and 6) then errors := array_append(errors, 'word_difficulty_invalid'); end if;
    end loop;

    if document ? 'quiz' and document ? 'exercise' then errors := array_append(errors, 'assessment_alias_conflict'); end if;
    assessment := coalesce(document -> 'exercise', document -> 'quiz');
    if assessment is not null then
        if jsonb_typeof(assessment) is distinct from 'object' or jsonb_typeof(assessment -> 'questions') is distinct from 'array' then
            errors := array_append(errors, 'assessment_invalid');
        else
            if jsonb_array_length(assessment -> 'questions') = 0 then errors := array_append(errors, 'assessment_empty'); end if;
            if assessment ? 'displayCount' and (jsonb_typeof(assessment -> 'displayCount') is distinct from 'number' or (assessment ->> 'displayCount')::integer not between 1 and jsonb_array_length(assessment -> 'questions')) then errors := array_append(errors, 'display_count_invalid'); end if;
            for question in select value from jsonb_array_elements(assessment -> 'questions') loop
                if jsonb_typeof(question) is distinct from 'object' or nullif(btrim(coalesce(question ->> 'question','')), '') is null or jsonb_typeof(question -> 'options') is distinct from 'array' or jsonb_array_length(question -> 'options') < 2 then errors := array_append(errors, 'question_invalid'); continue; end if;
                correct_index := coalesce((question ->> 'correct')::integer, (question ->> 'correctIndex')::integer);
                if correct_index is null or correct_index < 0 or correct_index >= jsonb_array_length(question -> 'options') then errors := array_append(errors, 'question_answer_invalid'); end if;
            end loop;
        end if;
    end if;
    return array(select distinct value from unnest(errors) as value);
end;
$$;

create function public.enforce_vocabulary_publication_contract()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
    target public.content_revisions%rowtype;
    previous_payload jsonb;
    errors text[];
begin
    if new.content_type <> 'vocabulary_pack' or new.published_revision_id is null or new.published_revision_id is not distinct from old.published_revision_id then return new; end if;
    select * into target from public.content_revisions where id = new.published_revision_id and content_item_id = new.id;
    if not found then return new; end if;
    errors := public.vocabulary_pack_validation_errors(new.content_key, target.payload);
    if target.schema_version is distinct from 1 then errors := array_append(errors, 'schema_version_invalid'); end if;
    if target.level is distinct from target.payload #>> '{document,level}' then errors := array_append(errors, 'revision_level_mismatch'); end if;
    if target.title_fr is distinct from target.payload #>> '{catalog,title}' then errors := array_append(errors, 'revision_title_mismatch'); end if;
    if old.published_revision_id is not null then
        select payload into previous_payload from public.content_revisions where id = old.published_revision_id;
        if previous_payload #>> '{document,level}' is distinct from target.payload #>> '{document,level}' then errors := array_append(errors, 'published_level_changed'); end if;
        if exists (
            select 1 from jsonb_array_elements(previous_payload #> '{document,words}') previous_word
            where not exists (
                select 1 from jsonb_array_elements(target.payload #> '{document,words}') proposed_word
                where lower(btrim(proposed_word ->> 'fr')) = lower(btrim(previous_word ->> 'fr'))
            )
        ) then errors := array_append(errors, 'published_word_removed_or_renamed'); end if;
    end if;
    if cardinality(errors) > 0 then raise exception using errcode = '22023', message = 'vocabulary_pack_not_publishable', detail = array_to_string(errors, ','); end if;
    return new;
end;
$$;

create trigger validate_vocabulary_publication
before update of published_revision_id on public.content_items
for each row execute function public.enforce_vocabulary_publication_contract();

revoke all on function public.vocabulary_pack_validation_errors(text, jsonb) from public, anon, authenticated;
revoke all on function public.enforce_vocabulary_publication_contract() from public, anon, authenticated;
