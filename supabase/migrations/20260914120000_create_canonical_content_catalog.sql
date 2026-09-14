create extension if not exists pgcrypto
with schema extensions;

create table public.content_items (
    id uuid primary key
        default gen_random_uuid(),
    content_type text not null,
    content_key text not null,
    published_revision_id uuid,
    published_at timestamptz,
    archived_at timestamptz,
    created_at timestamptz not null
        default timezone('utc', now()),
    updated_at timestamptz not null
        default timezone('utc', now()),
    constraint content_items_identity_unique
        unique (content_type, content_key),
    constraint content_items_type_supported
        check (
            content_type in (
                'grammar_lesson',
                'vocabulary_pack',
                'travel_lesson',
                'news_article'
            )
        ),
    constraint content_items_key_valid
        check (
            content_key = btrim(content_key)
            and length(content_key) between 1 and 160
            and content_key not like '%/%'
            and content_key not like E'%\\\\%'
            and content_key !~ '[[:cntrl:]]'
        ),
    constraint content_items_publication_complete
        check (
            (
                published_revision_id is null
                and published_at is null
            )
            or (
                published_revision_id is not null
                and published_at is not null
            )
        )
);

create table public.content_revisions (
    id uuid primary key
        default gen_random_uuid(),
    content_item_id uuid not null
        references public.content_items (id)
        on delete restrict,
    revision_number integer not null,
    schema_version integer not null,
    level text,
    title_fr text not null,
    title_fa text,
    payload jsonb not null,
    content_hash text not null,
    source_path text,
    created_by uuid
        references auth.users (id)
        on delete set null,
    created_at timestamptz not null
        default timezone('utc', now()),
    constraint content_revisions_number_positive
        check (revision_number > 0),
    constraint content_revisions_schema_positive
        check (schema_version > 0),
    constraint content_revisions_level_valid
        check (
            level is null
            or (
                level = btrim(level)
                and length(level) between 1 and 32
            )
        ),
    constraint content_revisions_title_fr_valid
        check (
            title_fr = btrim(title_fr)
            and length(title_fr) between 1 and 200
        ),
    constraint content_revisions_title_fa_valid
        check (
            title_fa is null
            or (
                title_fa = btrim(title_fa)
                and length(title_fa) between 1 and 200
            )
        ),
    constraint content_revisions_payload_object
        check (jsonb_typeof(payload) = 'object'),
    constraint content_revisions_hash_valid
        check (content_hash ~ '^[0-9a-f]{64}$'),
    constraint content_revisions_source_path_valid
        check (
            source_path is null
            or (
                source_path = btrim(source_path)
                and length(source_path) between 1 and 500
            )
        ),
    constraint content_revisions_number_unique
        unique (content_item_id, revision_number),
    constraint content_revisions_hash_unique
        unique (content_item_id, content_hash),
    constraint content_revisions_item_reference_unique
        unique (id, content_item_id)
);

alter table public.content_items
add constraint content_items_published_revision_same_item
foreign key (published_revision_id, id)
references public.content_revisions (id, content_item_id)
on delete restrict;

create table public.content_publication_events (
    id bigint generated always as identity
        primary key,
    content_item_id uuid not null
        references public.content_items (id)
        on delete restrict,
    revision_id uuid
        references public.content_revisions (id)
        on delete restrict,
    action text not null,
    actor_id uuid
        references auth.users (id)
        on delete set null,
    metadata jsonb not null default '{}'::jsonb,
    occurred_at timestamptz not null
        default timezone('utc', now()),
    constraint content_publication_events_action_supported
        check (
            action in (
                'imported',
                'published',
                'archived',
                'restored'
            )
        ),
    constraint content_publication_events_metadata_object
        check (jsonb_typeof(metadata) = 'object')
);

create index content_items_published_index
on public.content_items (
    content_type,
    published_at desc
)
where published_revision_id is not null
  and archived_at is null;

create index content_publication_events_item_index
on public.content_publication_events (
    content_item_id,
    occurred_at desc
);

comment on table public.content_items is
    'Stable server-owned identity and publication pointer for educational content.';
comment on table public.content_revisions is
    'Immutable JSONB revisions imported from the legacy corpus or created by the future admin panel.';
comment on table public.content_publication_events is
    'Append-only audit trail for content imports and publication changes.';
comment on column public.content_revisions.source_path is
    'Import provenance only. This value is never exposed by the public read function.';

create function public.set_content_item_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
    new.updated_at := timezone('utc', now());
    return new;
end;
$$;

create trigger content_items_set_updated_at
before update on public.content_items
for each row
execute function public.set_content_item_updated_at();

create function public.prevent_content_history_mutation()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
    raise exception using
        errcode = '55000',
        message = 'content_history_is_append_only';
end;
$$;

create trigger content_revisions_append_only
before update or delete on public.content_revisions
for each row
execute function public.prevent_content_history_mutation();

create trigger content_publication_events_append_only
before update or delete on public.content_publication_events
for each row
execute function public.prevent_content_history_mutation();

alter table public.content_items
enable row level security;
alter table public.content_items
force row level security;
alter table public.content_revisions
enable row level security;
alter table public.content_revisions
force row level security;
alter table public.content_publication_events
enable row level security;
alter table public.content_publication_events
force row level security;

revoke all on table public.content_items
from public, anon, authenticated;
revoke all on table public.content_revisions
from public, anon, authenticated;
revoke all on table public.content_publication_events
from public, anon, authenticated;

create function public.import_content_revision(
    p_content_type text,
    p_content_key text,
    p_schema_version integer,
    p_level text,
    p_title_fr text,
    p_title_fa text,
    p_payload jsonb,
    p_source_path text,
    p_publish boolean default true
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
declare
    target_item public.content_items%rowtype;
    target_revision public.content_revisions%rowtype;
    revision_created boolean := false;
    revision_hash text;
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
        or p_content_key like '%/%'
        or p_content_key like E'%\\\\%'
        or p_content_key ~ '[[:cntrl:]]'
    ) then
        raise exception using
            errcode = '22023',
            message = 'content_key_invalid';
    end if;

    if p_schema_version is null or p_schema_version < 1 then
        raise exception using
            errcode = '22023',
            message = 'content_schema_version_invalid';
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

    if (
        p_title_fr is null
        or p_title_fr <> btrim(p_title_fr)
        or length(p_title_fr) not between 1 and 200
    ) then
        raise exception using
            errcode = '22023',
            message = 'content_title_fr_invalid';
    end if;

    if (
        p_title_fa is not null
        and (
            p_title_fa <> btrim(p_title_fa)
            or length(p_title_fa) not between 1 and 200
        )
    ) then
        raise exception using
            errcode = '22023',
            message = 'content_title_fa_invalid';
    end if;

    if p_payload is null or jsonb_typeof(p_payload) <> 'object' then
        raise exception using
            errcode = '22023',
            message = 'content_payload_invalid';
    end if;

    if (
        p_source_path is not null
        and (
            p_source_path <> btrim(p_source_path)
            or length(p_source_path) not between 1 and 500
        )
    ) then
        raise exception using
            errcode = '22023',
            message = 'content_source_path_invalid';
    end if;

    revision_hash := encode(
        extensions.digest(
            convert_to(
                jsonb_build_object(
                    'schemaVersion', p_schema_version,
                    'level', p_level,
                    'titleFr', p_title_fr,
                    'titleFa', p_title_fa,
                    'payload', p_payload
                )::text,
                'UTF8'
            ),
            'sha256'
        ),
        'hex'
    );

    insert into public.content_items (
        content_type,
        content_key
    )
    values (
        p_content_type,
        p_content_key
    )
    on conflict on constraint content_items_identity_unique
    do nothing;

    select items.*
    into target_item
    from public.content_items as items
    where items.content_type = p_content_type
      and items.content_key = p_content_key
    for update;

    select revisions.*
    into target_revision
    from public.content_revisions as revisions
    where revisions.content_item_id = target_item.id
      and revisions.content_hash = revision_hash;

    if not found then
        insert into public.content_revisions (
            content_item_id,
            revision_number,
            schema_version,
            level,
            title_fr,
            title_fa,
            payload,
            content_hash,
            source_path,
            created_by
        )
        values (
            target_item.id,
            coalesce(
                (
                    select max(revisions.revision_number)
                    from public.content_revisions as revisions
                    where revisions.content_item_id = target_item.id
                ),
                0
            ) + 1,
            p_schema_version,
            p_level,
            p_title_fr,
            p_title_fa,
            p_payload,
            revision_hash,
            p_source_path,
            (select auth.uid())
        )
        returning * into target_revision;

        revision_created := true;

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
            'imported',
            (select auth.uid()),
            jsonb_build_object(
                'schemaVersion', p_schema_version,
                'sourcePath', p_source_path
            )
        );
    end if;

    if (
        coalesce(p_publish, false)
        and target_item.published_revision_id
            is distinct from target_revision.id
    ) then
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
                'newRevision', revision_created
            )
        );
    end if;

    return query
    select
        target_item.content_type,
        target_item.content_key,
        target_revision.revision_number,
        target_revision.content_hash,
        coalesce(
            target_item.published_revision_id
                = target_revision.id,
            false
        );
end;
$$;

create function public.get_published_content(
    p_content_type text default null,
    p_content_key text default null
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
language sql
stable
security definer
set search_path = ''
as $$
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
      and (
          p_content_type is null
          or items.content_type = p_content_type
      )
      and (
          p_content_key is null
          or items.content_key = p_content_key
      )
    order by
        items.content_type,
        items.content_key;
$$;

revoke all on function public.set_content_item_updated_at()
from public, anon, authenticated;
revoke all on function public.prevent_content_history_mutation()
from public, anon, authenticated;
revoke all on function public.import_content_revision(
    text,
    text,
    integer,
    text,
    text,
    text,
    jsonb,
    text,
    boolean
)
from public, anon, authenticated;
grant execute on function public.import_content_revision(
    text,
    text,
    integer,
    text,
    text,
    text,
    jsonb,
    text,
    boolean
)
to service_role;
revoke all on function public.get_published_content(text, text)
from public, anon, authenticated;
grant execute on function public.get_published_content(text, text)
to anon, authenticated, service_role;
