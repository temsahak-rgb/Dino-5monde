begin;

create extension if not exists pgtap
with schema extensions;

select plan(33);

select has_table(
    'public',
    'learner_wallets',
    'learner wallets exist'
);
select has_table(
    'public',
    'learner_credit_transactions',
    'the credit audit ledger exists'
);
select has_table(
    'public',
    'shop_lessons',
    'the lesson catalogue exists'
);
select has_table(
    'public',
    'lesson_entitlements',
    'durable lesson entitlements exist'
);
select has_function(
    'public',
    'purchase_shop_lesson',
    array['text'],
    'the atomic lesson-purchase function exists'
);

insert into auth.users (
    id,
    aud,
    role,
    email,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at
)
values
    (
        '11111111-1111-4111-8111-111111111111',
        'authenticated',
        'authenticated',
        'shop-first@example.test',
        '{}'::jsonb,
        '{}'::jsonb,
        now(),
        now()
    ),
    (
        '22222222-2222-4222-8222-222222222222',
        'authenticated',
        'authenticated',
        'shop-second@example.test',
        '{}'::jsonb,
        '{}'::jsonb,
        now(),
        now()
    );

select is(
    (
        select credits
        from public.learner_wallets
        where user_id = '11111111-1111-4111-8111-111111111111'
    ),
    100,
    'a first learner receives 100 starter credits'
);
select is(
    (
        select credits
        from public.learner_wallets
        where user_id = '22222222-2222-4222-8222-222222222222'
    ),
    100,
    'a second learner receives an independent wallet'
);
select is(
    (
        select delta
        from public.learner_credit_transactions
        where user_id = '11111111-1111-4111-8111-111111111111'
          and reason = 'starter_grant'
    ),
    100,
    'the first starter grant is audited'
);
select is(
    (
        select delta
        from public.learner_credit_transactions
        where user_id = '22222222-2222-4222-8222-222222222222'
          and reason = 'starter_grant'
    ),
    100,
    'the second starter grant is audited'
);

select throws_ok(
    $$
        insert into public.learner_credit_transactions (
            user_id,
            delta,
            balance_after,
            reason,
            reference_id
        )
        values (
            '11111111-1111-4111-8111-111111111111',
            25,
            125,
            'lesson_purchase',
            'grammar-c1-g-004'
        )
    $$,
    '23514',
    'new row for relation "learner_credit_transactions" violates check constraint "learner_credit_transactions_delta_direction"',
    'a lesson purchase can never credit the wallet'
);

set local role anon;

select throws_ok(
    $$
        select *
        from public.purchase_shop_lesson(
            'grammar-c1-g-001'
        )
    $$,
    '42501',
    'permission denied for function purchase_shop_lesson',
    'anonymous visitors cannot execute a purchase'
);

reset role;
set local role authenticated;
set local "request.jwt.claim.sub" =
    '11111111-1111-4111-8111-111111111111';

select is(
    (select count(*) from public.learner_wallets),
    1::bigint,
    'RLS exposes only the authenticated learner wallet'
);
select is(
    (
        select count(*)
        from public.learner_credit_transactions
    ),
    1::bigint,
    'RLS exposes only the authenticated learner credit history'
);
select results_eq(
    $$
        select
            shop_lesson_id,
            credits_remaining,
            purchased
        from public.purchase_shop_lesson(
            'grammar-c1-g-001'
        )
    $$,
    $$
        values (
            'grammar-c1-g-001'::text,
            70::integer,
            true::boolean
        )
    $$,
    'an unowned lesson is purchased atomically'
);
select is(
    (
        select credits
        from public.learner_wallets
    ),
    70,
    'the purchase debits exactly the lesson price'
);
select is(
    (
        select count(*)
        from public.lesson_entitlements
        where shop_lesson_id = 'grammar-c1-g-001'
    ),
    1::bigint,
    'the purchase creates one entitlement'
);
select is(
    (
        select delta
        from public.learner_credit_transactions
        where reason = 'lesson_purchase'
          and reference_id = 'grammar-c1-g-001'
    ),
    -30,
    'the purchase debit is audited'
);
select results_eq(
    $$
        select
            shop_lesson_id,
            credits_remaining,
            purchased
        from public.purchase_shop_lesson(
            'grammar-c1-g-001'
        )
    $$,
    $$
        values (
            'grammar-c1-g-001'::text,
            70::integer,
            false::boolean
        )
    $$,
    'buying an owned lesson is idempotent'
);
select is(
    (
        select credits
        from public.learner_wallets
    ),
    70,
    'an idempotent retry keeps the balance unchanged'
);
select is(
    (
        select count(*)
        from public.lesson_entitlements
        where shop_lesson_id = 'grammar-c1-g-001'
    ),
    1::bigint,
    'an idempotent retry keeps one entitlement'
);
select throws_ok(
    $$
        update public.learner_wallets
        set credits = 999
    $$,
    '42501',
    'permission denied for table learner_wallets',
    'browser roles cannot mutate their wallet directly'
);

select throws_ok(
    $$
        select *
        from public.purchase_shop_lesson(
            'missing-shop-lesson'
        )
    $$,
    'P0002',
    'shop_lesson_not_found',
    'an unknown Shop lesson is refused'
);
select is(
    (
        select credits
        from public.learner_wallets
    ),
    70,
    'an unknown lesson leaves the wallet unchanged'
);

reset role;

insert into public.lesson_entitlements (
    user_id,
    shop_lesson_id,
    price_paid
)
values (
    '22222222-2222-4222-8222-222222222222',
    'grammar-c1-g-004',
    25
);

set local role authenticated;
set local "request.jwt.claim.sub" =
    '11111111-1111-4111-8111-111111111111';

select is(
    (
        select count(*)
        from public.lesson_entitlements
    ),
    1::bigint,
    'RLS hides another learner entitlement'
);

reset role;

update public.shop_lessons
set active = false
where id = 'grammar-c1-g-004';

set local role authenticated;
set local "request.jwt.claim.sub" =
    '11111111-1111-4111-8111-111111111111';

select throws_ok(
    $$
        select *
        from public.purchase_shop_lesson(
            'grammar-c1-g-004'
        )
    $$,
    'P0002',
    'shop_lesson_not_found',
    'an inactive Shop lesson is refused'
);
select is(
    (
        select credits
        from public.learner_wallets
    ),
    70,
    'an inactive lesson leaves the wallet unchanged'
);

reset role;

select throws_ok(
    $$
        update public.learner_credit_transactions
        set delta = 999
        where user_id = '11111111-1111-4111-8111-111111111111'
    $$,
    '55000',
    'credit_transactions_are_append_only',
    'credit history cannot be rewritten'
);

update public.learner_wallets
set credits = 20
where user_id = '22222222-2222-4222-8222-222222222222';

set local role authenticated;
set local "request.jwt.claim.sub" =
    '22222222-2222-4222-8222-222222222222';

select throws_ok(
    $$
        select *
        from public.purchase_shop_lesson(
            'grammar-c1-g-001'
        )
    $$,
    'P0001',
    'insufficient_credits',
    'an insufficient wallet cannot purchase a lesson'
);
select is(
    (
        select credits
        from public.learner_wallets
    ),
    20,
    'a refused purchase leaves the balance unchanged'
);
select is(
    (
        select count(*)
        from public.lesson_entitlements
        where shop_lesson_id = 'grammar-c1-g-001'
    ),
    0::bigint,
    'RLS hides other entitlements and a refused purchase creates none'
);
select is(
    (
        select count(*)
        from public.learner_credit_transactions
        where reason = 'lesson_purchase'
    ),
    0::bigint,
    'a refused purchase creates no debit entry'
);

reset role;

delete from auth.users
where id = '22222222-2222-4222-8222-222222222222';

select is(
    (
        select count(*)
        from public.learner_wallets
        where user_id = '22222222-2222-4222-8222-222222222222'
    ),
    0::bigint,
    'deleting an account removes its private wallet'
);
select is(
    (
        select count(*)
        from public.learner_credit_transactions
        where user_id = '22222222-2222-4222-8222-222222222222'
    ),
    0::bigint,
    'deleting an account removes its private credit history'
);

select * from finish();

rollback;
