create table public.content_admins (
    user_id uuid primary key
        references auth.users (id)
        on delete cascade,
    granted_by uuid
        references auth.users (id)
        on delete set null,
    granted_at timestamptz not null
        default timezone('utc', now())
);

comment on table public.content_admins is
    'Server-only allowlist for editorial access to canonical content.';

alter table public.content_admins
enable row level security;
alter table public.content_admins
force row level security;

revoke all on table public.content_admins
from public, anon, authenticated;

create function public.is_content_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
    select
        (select auth.uid()) is not null
        and exists (
            select 1
            from public.content_admins as admins
            where admins.user_id = (select auth.uid())
        );
$$;

create function public.assert_content_admin_access()
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
    if not public.is_content_admin() then
        raise exception using
            errcode = '42501',
            message = 'content_admin_access_required';
    end if;
end;
$$;

create function public.get_content_admin_status()
returns table (
    is_admin boolean
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
    return query
    select public.is_content_admin();
end;
$$;

create function public.admin_list_content_items()
returns table (
    item_id uuid,
    content_type text,
    content_key text,
    level text,
    title_fr text,
    title_fa text,
    revision_count bigint,
    latest_revision_number integer,
    published_revision_number integer,
    published_at timestamptz,
    archived_at timestamptz,
    updated_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
    perform public.assert_content_admin_access();

    return query
    select
        items.id,
        items.content_type,
        items.content_key,
        latest.level,
        latest.title_fr,
        latest.title_fa,
        (
            select count(*)
            from public.content_revisions as revisions
            where revisions.content_item_id = items.id
        ),
        latest.revision_number,
        published.revision_number,
        items.published_at,
        items.archived_at,
        items.updated_at
    from public.content_items as items
    join lateral (
        select revisions.*
        from public.content_revisions as revisions
        where revisions.content_item_id = items.id
        order by revisions.revision_number desc
        limit 1
    ) as latest on true
    left join public.content_revisions as published
      on published.id = items.published_revision_id
     and published.content_item_id = items.id
    order by
        items.content_type,
        items.content_key;
end;
$$;

create function public.admin_get_content_revisions(
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
        items.published_revision_id = revisions.id
    from public.content_items as items
    join public.content_revisions as revisions
      on revisions.content_item_id = items.id
    where items.content_type = p_content_type
      and items.content_key = p_content_key
    order by revisions.revision_number desc;
end;
$$;

create function public.admin_import_content_draft(
    p_content_type text,
    p_content_key text,
    p_schema_version integer,
    p_level text,
    p_title_fr text,
    p_title_fa text,
    p_payload jsonb,
    p_source_path text
)
returns table (
    content_type text,
    content_key text,
    revision_number integer,
    content_hash text,
    published boolean
)
language plpgsql
security definer
set search_path = ''
as $$
begin
    perform public.assert_content_admin_access();

    return query
    select imported.*
    from public.import_content_revision(
        p_content_type,
        p_content_key,
        p_schema_version,
        p_level,
        p_title_fr,
        p_title_fa,
        p_payload,
        p_source_path,
        false
    ) as imported;
end;
$$;

create function public.admin_publish_content_revision(
    p_content_type text,
    p_content_key text,
    p_revision_number integer
)
returns table (
    content_type text,
    content_key text,
    revision_number integer,
    published_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
    target_item public.content_items%rowtype;
    target_revision public.content_revisions%rowtype;
begin
    perform public.assert_content_admin_access();

    select items.*
    into target_item
    from public.content_items as items
    where items.content_type = p_content_type
      and items.content_key = p_content_key
    for update;

    if not found then
        raise exception using
            errcode = 'P0002',
            message = 'content_item_not_found';
    end if;

    select revisions.*
    into target_revision
    from public.content_revisions as revisions
    where revisions.content_item_id = target_item.id
      and revisions.revision_number = p_revision_number;

    if not found then
        raise exception using
            errcode = 'P0002',
            message = 'content_revision_not_found';
    end if;

    if target_item.published_revision_id
        is distinct from target_revision.id
    then
        update public.content_items as items
        set
            published_revision_id = target_revision.id,
            published_at = timezone('utc', now()),
            archived_at = null
        where items.id = target_item.id
        returning items.* into target_item;

        insert into public.content_publication_events (
            content_item_id,
            revision_id,
            action,
            actor_id,
            metadata
        )
        values (
            target_item.id,
            target_revision.id,
            'published',
            (select auth.uid()),
            jsonb_build_object(
                'source',
                'admin_panel'
            )
        );
    end if;

    return query
    select
        target_item.content_type,
        target_item.content_key,
        target_revision.revision_number,
        target_item.published_at;
end;
$$;

create function public.admin_publish_latest_content_batch(
    p_content_type text
)
returns table (
    published_count integer
)
language plpgsql
security definer
set search_path = ''
as $$
declare
    candidate record;
    affected_count integer := 0;
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

    for candidate in
        select
            items.id as item_id,
            latest.id as revision_id,
            latest.revision_number
        from public.content_items as items
        join lateral (
            select revisions.*
            from public.content_revisions as revisions
            where revisions.content_item_id = items.id
            order by revisions.revision_number desc
            limit 1
        ) as latest on true
        where items.content_type = p_content_type
          and items.published_revision_id
                is distinct from latest.id
        order by items.content_key
        for update of items
    loop
        update public.content_items as items
        set
            published_revision_id = candidate.revision_id,
            published_at = timezone('utc', now()),
            archived_at = null
        where items.id = candidate.item_id;

        insert into public.content_publication_events (
            content_item_id,
            revision_id,
            action,
            actor_id,
            metadata
        )
        values (
            candidate.item_id,
            candidate.revision_id,
            'published',
            (select auth.uid()),
            jsonb_build_object(
                'source',
                'admin_panel_batch'
            )
        );

        affected_count := affected_count + 1;
    end loop;

    return query
    select affected_count;
end;
$$;

revoke all on function public.is_content_admin()
from public, anon, authenticated;
grant execute on function public.is_content_admin()
to authenticated, service_role;

revoke all on function public.assert_content_admin_access()
from public, anon, authenticated;

revoke all on function public.get_content_admin_status()
from public, anon, authenticated;
grant execute on function public.get_content_admin_status()
to authenticated;

revoke all on function public.admin_list_content_items()
from public, anon, authenticated;
grant execute on function public.admin_list_content_items()
to authenticated;

revoke all on function public.admin_get_content_revisions(text, text)
from public, anon, authenticated;
grant execute on function public.admin_get_content_revisions(text, text)
to authenticated;

revoke all on function public.admin_import_content_draft(
    text,
    text,
    integer,
    text,
    text,
    text,
    jsonb,
    text
)
from public, anon, authenticated;
grant execute on function public.admin_import_content_draft(
    text,
    text,
    integer,
    text,
    text,
    text,
    jsonb,
    text
)
to authenticated;

revoke all on function public.admin_publish_content_revision(
    text,
    text,
    integer
)
from public, anon, authenticated;
grant execute on function public.admin_publish_content_revision(
    text,
    text,
    integer
)
to authenticated;

revoke all on function public.admin_publish_latest_content_batch(text)
from public, anon, authenticated;
grant execute on function public.admin_publish_latest_content_batch(text)
to authenticated;
