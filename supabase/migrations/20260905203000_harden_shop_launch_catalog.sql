do $$
begin
    alter table public.learner_credit_transactions
    add constraint learner_credit_transactions_delta_direction
    check (
        (reason = 'starter_grant' and delta > 0)
        or (reason = 'lesson_purchase' and delta < 0)
    );
exception
    when duplicate_object then null;
end;
$$;

do $$
begin
    if (
        select count(*)
        from public.shop_lessons
        where id in (
            'grammar-c1-g-001',
            'grammar-c1-g-004',
            'vocabulary-b2-pack-81-rhetorique-persuasion',
            'vocabulary-c1-paleontology-fossils'
        )
    ) <> 4 then
        raise exception using
            errcode = 'P0002',
            message = 'shop_launch_catalog_incomplete';
    end if;
end;
$$;

update public.shop_lessons as lessons
set price_credits =
    launch_prices.price_credits
from (
    values
        ('grammar-c1-g-001', 30),
        ('grammar-c1-g-004', 25),
        ('vocabulary-b2-pack-81-rhetorique-persuasion', 20),
        ('vocabulary-c1-paleontology-fossils', 25)
) as launch_prices (
    id,
    price_credits
)
where lessons.id =
    launch_prices.id;

comment on constraint learner_credit_transactions_delta_direction
on public.learner_credit_transactions is
    'Starter grants add credits and lesson purchases subtract credits.';
