alter table public.learner_profiles
add column saurus_recommendation text,
add column saurus_quiz_answers text[],
add column saurus_assignment_source text,
add column saurus_assigned_at timestamptz;

alter table public.learner_profiles
add constraint learner_profiles_saurus_recommendation_supported
check (
    saurus_recommendation is null
    or saurus_recommendation in (
        'velociraptor-explorer',
        'triceratops-perseverant',
        'brachiosaurus-curious'
    )
),
add constraint learner_profiles_saurus_answers_complete
check (
    saurus_quiz_answers is null
    or (
        cardinality(saurus_quiz_answers) = 3
        and saurus_quiz_answers <@ array[
            'velociraptor-explorer',
            'triceratops-perseverant',
            'brachiosaurus-curious'
        ]::text[]
    )
),
add constraint learner_profiles_saurus_source_supported
check (
    saurus_assignment_source is null
    or saurus_assignment_source in (
        'recommendation',
        'learner-choice'
    )
),
add constraint learner_profiles_saurus_assignment_complete
check (
    assigned_saurus is null
    or (
        saurus_recommendation is null
        and saurus_quiz_answers is null
        and saurus_assignment_source is null
        and saurus_assigned_at is null
    )
    or (
        saurus_recommendation is not null
        and saurus_quiz_answers is not null
        and saurus_assignment_source is not null
        and saurus_assigned_at is not null
    )
) not valid;

comment on table public.learner_profiles is
    'Private learner identity with one stable server-assigned Saurus species.';
comment on column public.learner_profiles.assigned_saurus is
    'Stable Saurus species selected after the server validates the quiz.';
comment on column public.learner_profiles.saurus_recommendation is
    'Server-calculated recommendation from the explicit quiz rules.';
comment on column public.learner_profiles.saurus_quiz_answers is
    'Three ordered answers. The last answer breaks a three-way score tie.';
comment on column public.learner_profiles.saurus_assignment_source is
    'Whether the learner accepted the recommendation or made another choice.';

create function public.prevent_saurus_reassignment()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
    if old.assigned_saurus is not null and (
        new.assigned_saurus is distinct from old.assigned_saurus
        or new.saurus_recommendation is distinct from old.saurus_recommendation
        or new.saurus_quiz_answers is distinct from old.saurus_quiz_answers
        or new.saurus_assignment_source is distinct from old.saurus_assignment_source
        or new.saurus_assigned_at is distinct from old.saurus_assigned_at
    ) then
        raise exception using
            errcode = 'P0001',
            message = 'saurus_species_is_stable';
    end if;

    return new;
end;
$$;

create trigger learner_profiles_prevent_saurus_reassignment
before update on public.learner_profiles
for each row
execute function public.prevent_saurus_reassignment();

create function public.assign_learner_saurus(
    p_answers text[],
    p_selected_saurus text default null
)
returns setof public.learner_profiles
language plpgsql
security definer
set search_path = ''
as $$
declare
    learner_id uuid := (select auth.uid());
    learner_profile public.learner_profiles;
    recommended_saurus text;
    selected_saurus text;
begin
    if learner_id is null then
        raise exception using
            errcode = '28000',
            message = 'authentication_required';
    end if;

    if (
        p_answers is null
        or cardinality(p_answers) <> 3
        or exists (
            select 1
            from unnest(p_answers) as answer(value)
            where answer.value is null
               or answer.value not in (
                    'velociraptor-explorer',
                    'triceratops-perseverant',
                    'brachiosaurus-curious'
               )
        )
        or (
            p_selected_saurus is not null
            and p_selected_saurus not in (
                'velociraptor-explorer',
                'triceratops-perseverant',
                'brachiosaurus-curious'
            )
        )
    ) then
        raise exception using
            errcode = '22023',
            message = 'saurus_quiz_invalid';
    end if;

    select profiles.*
    into learner_profile
    from public.learner_profiles as profiles
    where profiles.user_id = learner_id
    for update;

    if not found then
        raise exception using
            errcode = 'P0002',
            message = 'learner_profile_required';
    end if;

    if learner_profile.assigned_saurus is not null then
        return next learner_profile;
        return;
    end if;

    select scored.answer
    into recommended_saurus
    from (
        select
            answers.answer,
            count(*) as score,
            bool_or(answers.position = 3) as final_answer
        from unnest(p_answers)
            with ordinality as answers(answer, position)
        group by answers.answer
    ) as scored
    order by
        scored.score desc,
        scored.final_answer desc,
        case scored.answer
            when 'velociraptor-explorer' then 1
            when 'triceratops-perseverant' then 2
            else 3
        end
    limit 1;

    selected_saurus := coalesce(
        p_selected_saurus,
        recommended_saurus
    );

    update public.learner_profiles as profiles
    set
        assigned_saurus = selected_saurus,
        saurus_recommendation = recommended_saurus,
        saurus_quiz_answers = p_answers,
        saurus_assignment_source = case
            when selected_saurus = recommended_saurus
                then 'recommendation'
            else 'learner-choice'
        end,
        saurus_assigned_at = timezone('utc', now())
    where profiles.user_id = learner_id
    returning profiles.* into learner_profile;

    return next learner_profile;
end;
$$;

revoke all on function public.prevent_saurus_reassignment()
from public, anon, authenticated;
revoke all on function public.assign_learner_saurus(text[], text)
from public, anon, authenticated;
grant execute on function public.assign_learner_saurus(text[], text)
to authenticated;
