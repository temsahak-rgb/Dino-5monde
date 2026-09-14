create or replace function public.admin_get_content_revisions(
    p_content_type text,
    p_content_key text
)
returns table (
    revision_id uuid,
    revision_number integer,
    schema_version integer,
    level text,
    title_fr text,
    title_fa text,
    payload jsonb,
    source_path text,
    created_by uuid,
    created_at timestamptz,
    published boolean
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
    perform public.assert_content_admin_access();

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
        revisions.id,
        revisions.revision_number,
        revisions.schema_version,
        revisions.level,
        revisions.title_fr,
        revisions.title_fa,
        revisions.payload,
        revisions.source_path,
        revisions.created_by,
        revisions.created_at,
        coalesce(
            items.published_revision_id = revisions.id,
            false
        )
    from public.content_items as items
    join public.content_revisions as revisions
      on revisions.content_item_id = items.id
    where items.content_type = p_content_type
      and items.content_key = p_content_key
    order by revisions.revision_number desc;
end;
$$;

revoke all on function public.admin_get_content_revisions(text, text)
from public, anon, authenticated;
grant execute on function public.admin_get_content_revisions(text, text)
to authenticated;
