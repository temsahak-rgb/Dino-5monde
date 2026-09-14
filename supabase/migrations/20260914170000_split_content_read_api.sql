create or replace function public.validate_content_revision_payload()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
    expected_content_key text;
begin
    select items.content_key
    into expected_content_key
    from public.content_items as items
    where items.id = new.content_item_id;

    if (
        jsonb_typeof(new.payload -> 'catalog')
            is distinct from 'object'
        or jsonb_typeof(new.payload -> 'document')
            is distinct from 'object'
        or new.payload #>> '{catalog,id}'
            is distinct from expected_content_key
        or new.payload #>> '{document,id}'
            is distinct from expected_content_key
        or (
            new.payload ? 'exerciseSections'
            and jsonb_typeof(
                new.payload -> 'exerciseSections'
            ) is distinct from 'array'
        )
    ) then
        raise exception using
            errcode = '22023',
            message = 'content_payload_identity_invalid';
    end if;

    return new;
end;
$$;

drop trigger if exists content_revisions_validate_payload
on public.content_revisions;

create trigger content_revisions_validate_payload
before insert on public.content_revisions
for each row
execute function public.validate_content_revision_payload();

drop function public.get_published_content(text, text);

create function public.get_published_content(
    p_content_type text,
    p_content_key text
)
returns table (
    item_id uuid,
    revision_id uuid,
    content_type text,
    content_key text,
    revision_number integer,
    schema_version integer,
    level text,
    title_fr text,
    title_fa text,
    payload jsonb,
    content_hash text,
    published_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
    if p_content_type is null or p_content_type not in (
        'grammar_lesson',
        'vocabulary_pack',
        'travel_lesson',
        'news_article'
    ) then
        raise exception using
            errcode = '22023',
            message = 'content_type_invalid';
    end if;

    if (
        p_content_key is null
        or p_content_key <> btrim(p_content_key)
        or length(p_content_key) not between 1 and 160
    ) then
        raise exception using
            errcode = '22023',
            message = 'content_key_invalid';
    end if;

    return query
    select
        items.id,
        revisions.id,
        items.content_type,
        items.content_key,
        revisions.revision_number,
        revisions.schema_version,
        revisions.level,
        revisions.title_fr,
        revisions.title_fa,
        revisions.payload,
        revisions.content_hash,
        items.published_at
    from public.content_items as items
    join public.content_revisions as revisions
      on revisions.id = items.published_revision_id
     and revisions.content_item_id = items.id
    where items.archived_at is null
      and items.content_type = p_content_type
      and items.content_key = p_content_key;
end;
$$;

create function public.get_published_content_catalog(
    p_content_type text default null,
    p_level text default null
)
returns table (
    item_id uuid,
    revision_id uuid,
    content_type text,
    content_key text,
    revision_number integer,
    schema_version integer,
    level text,
    title_fr text,
    title_fa text,
    catalog jsonb,
    published_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
    if (
        p_content_type is not null
        and p_content_type not in (
            'grammar_lesson',
            'vocabulary_pack',
            'travel_lesson',
            'news_article'
        )
    ) then
        raise exception using
            errcode = '22023',
            message = 'content_type_invalid';
    end if;

    if (
        p_level is not null
        and (
            p_level <> btrim(p_level)
            or length(p_level) not between 1 and 32
        )
    ) then
        raise exception using
            errcode = '22023',
            message = 'content_level_invalid';
    end if;

    return query
    select
        items.id,
        revisions.id,
        items.content_type,
        items.content_key,
        revisions.revision_number,
        revisions.schema_version,
        revisions.level,
        revisions.title_fr,
        revisions.title_fa,
        revisions.payload -> 'catalog',
        items.published_at
    from public.content_items as items
    join public.content_revisions as revisions
      on revisions.id = items.published_revision_id
     and revisions.content_item_id = items.id
    where items.archived_at is null
      and (
          p_content_type is null
          or items.content_type = p_content_type
      )
      and (
          p_level is null
          or revisions.level = p_level
      )
    order by
        items.content_type,
        items.content_key;
end;
$$;

revoke all on function public.validate_content_revision_payload()
from public, anon, authenticated;
revoke all on function public.get_published_content(text, text)
from public, anon, authenticated;
grant execute on function public.get_published_content(text, text)
to anon, authenticated, service_role;
revoke all on function public.get_published_content_catalog(text, text)
from public, anon, authenticated;
grant execute on function public.get_published_content_catalog(text, text)
to anon, authenticated, service_role;
