create table public.learner_wallets (
    user_id uuid primary key references auth.users (id) on delete cascade,
    credits integer not null default 100,
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now()),

    constraint learner_wallets_credits_non_negative
        check (credits >= 0)
);

comment on table public.learner_wallets is
    'Private, server-managed credit balance for one learner.';
comment on column public.learner_wallets.credits is
    'Server-managed balance. Browser roles have no write grant.';

create table public.shop_lessons (
    id text primary key,
    content_type text not null,
    content_id text not null,
    cefr_level text not null,
    price_credits integer not null,
    title_fr text not null,
    title_fa text not null,
    description_fr text not null,
    description_fa text not null,
    active boolean not null default true,
    display_order integer not null default 0,
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now()),

    constraint shop_lessons_content_type
        check (content_type in ('grammar', 'vocabulary')),
    constraint shop_lessons_cefr_level
        check (cefr_level in ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
    constraint shop_lessons_grammar_level
        check (content_type <> 'grammar' or cefr_level <> 'C2'),
    constraint shop_lessons_price_positive
        check (price_credits > 0),
    constraint shop_lessons_id_trimmed
        check (id = btrim(id) and char_length(id) between 1 and 160),
    constraint shop_lessons_content_id_trimmed
        check (
            content_id = btrim(content_id)
            and char_length(content_id) between 1 and 160
        ),
    constraint shop_lessons_localized_copy_non_empty
        check (
            char_length(btrim(title_fr)) > 0
            and char_length(btrim(title_fa)) > 0
            and char_length(btrim(description_fr)) > 0
            and char_length(btrim(description_fa)) > 0
        ),
    constraint shop_lessons_content_unique
        unique (content_type, cefr_level, content_id)
);

comment on table public.shop_lessons is
    'Public read-only catalogue of lessons purchasable with learner credits.';

create table public.lesson_entitlements (
    user_id uuid not null references auth.users (id) on delete cascade,
    shop_lesson_id text not null references public.shop_lessons (id),
    price_paid integer not null,
    purchased_at timestamptz not null default timezone('utc', now()),

    primary key (user_id, shop_lesson_id),
    constraint lesson_entitlements_price_paid_non_negative
        check (price_paid >= 0)
);

comment on table public.lesson_entitlements is
    'Private, immutable proof that a learner owns one shop lesson.';

create table public.learner_credit_transactions (
    id bigint generated always as identity primary key,
    user_id uuid not null references auth.users (id) on delete cascade,
    delta integer not null,
    balance_after integer not null,
    reason text not null,
    reference_id text references public.shop_lessons (id),
    created_at timestamptz not null default timezone('utc', now()),

    constraint learner_credit_transactions_delta_non_zero
        check (delta <> 0),
    constraint learner_credit_transactions_balance_non_negative
        check (balance_after >= 0),
    constraint learner_credit_transactions_reason
        check (reason in ('starter_grant', 'lesson_purchase')),
    constraint learner_credit_transactions_reference
        check (
            (reason = 'starter_grant' and reference_id is null)
            or (
                reason = 'lesson_purchase'
                and reference_id is not null
                and reference_id = btrim(reference_id)
                and char_length(reference_id) between 1 and 160
            )
        )
);

comment on table public.learner_credit_transactions is
    'Private, append-only audit ledger for every learner credit movement.';

create unique index learner_credit_transactions_one_starter_grant
on public.learner_credit_transactions (user_id)
where reason = 'starter_grant';

create unique index learner_credit_transactions_one_lesson_purchase
on public.learner_credit_transactions (user_id, reference_id)
where reason = 'lesson_purchase';

create function public.prevent_credit_transaction_mutation()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
    raise exception using
        errcode = '55000',
        message = 'credit_transactions_are_append_only';
end;
$$;

create trigger learner_credit_transactions_append_only
before update on public.learner_credit_transactions
for each row
execute function public.prevent_credit_transaction_mutation();

create function public.set_shop_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
    new.updated_at = timezone('utc', now());
    return new;
end;
$$;

create trigger learner_wallets_set_updated_at
before update on public.learner_wallets
for each row
execute function public.set_shop_updated_at();

create trigger shop_lessons_set_updated_at
before update on public.shop_lessons
for each row
execute function public.set_shop_updated_at();

create function public.create_learner_wallet()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
    initial_balance integer;
begin
    insert into public.learner_wallets (user_id)
    values (new.id)
    on conflict (user_id) do nothing
    returning credits into initial_balance;

    if initial_balance is not null then
        insert into public.learner_credit_transactions (
            user_id,
            delta,
            balance_after,
            reason
        )
        values (
            new.id,
            initial_balance,
            initial_balance,
            'starter_grant'
        );
    end if;

    return new;
end;
$$;

create trigger auth_user_create_learner_wallet
after insert on auth.users
for each row
execute function public.create_learner_wallet();

insert into public.learner_wallets (user_id)
select users.id
from auth.users as users
on conflict (user_id) do nothing;

insert into public.learner_credit_transactions (
    user_id,
    delta,
    balance_after,
    reason
)
select
    wallets.user_id,
    wallets.credits,
    wallets.credits,
    'starter_grant'
from public.learner_wallets as wallets
where not exists (
    select 1
    from public.learner_credit_transactions as transactions
    where transactions.user_id = wallets.user_id
      and transactions.reason = 'starter_grant'
);

insert into public.shop_lessons (
    id,
    content_type,
    content_id,
    cefr_level,
    price_credits,
    title_fr,
    title_fa,
    description_fr,
    description_fa,
    active,
    display_order
)
values
    (
        'grammar-c1-g-001',
        'grammar',
        'C1-G-001',
        'C1',
        30,
        'Raconter au passé : les temps du récit',
        'روایت در گذشته: زمان‌های داستان',
        'Maîtrisez les temps du récit pour raconter avec précision et nuance.',
        'زمان‌های روایت را برای داستان‌گویی دقیق و ظریف بیاموزید.',
        true,
        10
    ),
    (
        'grammar-c1-g-004',
        'grammar',
        'C1-G-004',
        'C1',
        35,
        'Les connecteurs logiques : structurer l''argumentation',
        'پیوندهای منطقی: ساختاردهی استدلال',
        'Structurez une argumentation claire grâce aux connecteurs logiques.',
        'با پیوندهای منطقی، استدلالی روشن و منسجم بسازید.',
        true,
        20
    ),
    (
        'vocabulary-b2-pack-81-rhetorique-persuasion',
        'vocabulary',
        'pack_81_rhetorique_persuasion',
        'B2',
        25,
        'Rhétorique, persuasion et art de la parole',
        'بلاغت، اقناع و هنر بیان',
        'Enrichissez votre vocabulaire pour argumenter et convaincre.',
        'واژگان خود را برای استدلال و متقاعد کردن گسترش دهید.',
        true,
        30
    ),
    (
        'vocabulary-c1-paleontology-fossils',
        'vocabulary',
        'paleontology_fossils',
        'C1',
        30,
        'Paléontologie, dinosaures et ères géologiques',
        'دیرینه‌شناسی، دایناسورها و دوران‌های زمین‌شناسی',
        'Explorez le vocabulaire scientifique des fossiles et de l’évolution.',
        'واژگان علمی فسیل‌ها و فرگشت را کاوش کنید.',
        true,
        40
    );

alter table public.learner_wallets enable row level security;
alter table public.learner_wallets force row level security;
alter table public.shop_lessons enable row level security;
alter table public.shop_lessons force row level security;
alter table public.lesson_entitlements enable row level security;
alter table public.lesson_entitlements force row level security;
alter table public.learner_credit_transactions enable row level security;
alter table public.learner_credit_transactions force row level security;

revoke all on table public.learner_wallets from public, anon, authenticated;
revoke all on table public.shop_lessons from public, anon, authenticated;
revoke all on table public.lesson_entitlements from public, anon, authenticated;
revoke all on table public.learner_credit_transactions from public, anon, authenticated;

grant select on table public.learner_wallets to authenticated;
grant select on table public.shop_lessons to anon, authenticated;
grant select on table public.lesson_entitlements to authenticated;
grant select on table public.learner_credit_transactions to authenticated;

create policy "Active shop lessons are public"
on public.shop_lessons
for select
to anon, authenticated
using (active);

create policy "Learners read their own wallet"
on public.learner_wallets
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Learners read their own entitlements"
on public.lesson_entitlements
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Learners read their own credit history"
on public.learner_credit_transactions
for select
to authenticated
using ((select auth.uid()) = user_id);

create function public.purchase_shop_lesson(
    p_shop_lesson_id text
)
returns table (
    shop_lesson_id text,
    credits_remaining integer,
    purchased boolean
)
language plpgsql
security definer
set search_path = ''
as $$
declare
    learner_id uuid := auth.uid();
    lesson_price integer;
    wallet_credits integer;
begin
    if learner_id is null then
        raise exception using
            errcode = '42501',
            message = 'authentication_required';
    end if;

    select lessons.price_credits
    into lesson_price
    from public.shop_lessons as lessons
    where lessons.id = p_shop_lesson_id
      and lessons.active;

    if lesson_price is null then
        raise exception using
            errcode = 'P0002',
            message = 'shop_lesson_not_found';
    end if;

    select wallets.credits
    into wallet_credits
    from public.learner_wallets as wallets
    where wallets.user_id = learner_id
    for update;

    if wallet_credits is null then
        raise exception using
            errcode = 'P0002',
            message = 'learner_wallet_not_found';
    end if;

    if exists (
        select 1
        from public.lesson_entitlements as entitlements
        where entitlements.user_id = learner_id
          and entitlements.shop_lesson_id = p_shop_lesson_id
    ) then
        return query
        select p_shop_lesson_id, wallet_credits, false;
        return;
    end if;

    if wallet_credits < lesson_price then
        raise exception using
            errcode = 'P0001',
            message = 'insufficient_credits';
    end if;

    insert into public.lesson_entitlements (
        user_id,
        shop_lesson_id,
        price_paid
    )
    values (
        learner_id,
        p_shop_lesson_id,
        lesson_price
    );

    update public.learner_wallets
    set credits = credits - lesson_price
    where user_id = learner_id
    returning credits into wallet_credits;

    insert into public.learner_credit_transactions (
        user_id,
        delta,
        balance_after,
        reason,
        reference_id
    )
    values (
        learner_id,
        -lesson_price,
        wallet_credits,
        'lesson_purchase',
        p_shop_lesson_id
    );

    return query
    select p_shop_lesson_id, wallet_credits, true;
end;
$$;

revoke all on function public.set_shop_updated_at()
from public, anon, authenticated;
revoke all on function public.create_learner_wallet()
from public, anon, authenticated;
revoke all on function public.prevent_credit_transaction_mutation()
from public, anon, authenticated;
revoke all on function public.purchase_shop_lesson(text)
from public, anon, authenticated;
grant execute on function public.purchase_shop_lesson(text)
to authenticated;
