import assert from "node:assert/strict";
import {
    readFile
} from "node:fs/promises";
import {
    dirname,
    resolve
} from "node:path";
import test from "node:test";

import {
    shopOfferManifest
} from "../../src/features/shop/shopOfferManifest.js";
import {
    fileURLToPath
} from "node:url";

const root =
    resolve(
        dirname(
            fileURLToPath(
                import.meta.url
            )
        ),
        "../.."
    );

async function readShopMigrations():
    Promise<string> {
    const paths = [
        "supabase/migrations/20260905190000_create_shop_credit_system.sql",
        "supabase/migrations/20260905203000_harden_shop_launch_catalog.sql"
    ];

    return (
        await Promise.all(
            paths.map(
                path =>
                    readFile(
                        resolve(root, path),
                        "utf8"
                    )
            )
        )
    ).join("\n");
}

test(
    "learner profiles are private and Saurus allocation is server-managed",
    async () => {
        const migration =
            await readFile(
                resolve(
                    root,
                    "supabase/migrations/20260905130000_create_learner_profiles.sql"
                ),
                "utf8"
            );

        assert.match(
            migration,
            /references auth\.users \(id\) on delete cascade/u
        );
        assert.match(
            migration,
            /enable row level security/u
        );
        assert.match(
            migration,
            /to authenticated\s+using \(\(select auth\.uid\(\)\) = user_id\)/u
        );
        assert.match(
            migration,
            /to authenticated\s+with check \(\(select auth\.uid\(\)\) = user_id\)/u
        );
        assert.match(
            migration,
            /grant insert \([\s\S]*show_saurus_suffix[\s\S]*\) on public\.learner_profiles/u
        );
        assert.doesNotMatch(
            migration,
            /grant (?:insert|update) \([\s\S]*assigned_saurus[\s\S]*\) on public\.learner_profiles/u
        );
        assert.doesNotMatch(
            migration,
            /grant delete/u
        );
    }
);

test(
    "local backend keeps corpus seeding and paid phone OTP disabled",
    async () => {
        const configuration =
            await readFile(
                resolve(
                    root,
                    "supabase/config.toml"
                ),
                "utf8"
            );

        assert.match(
            configuration,
            /\[db\.seed\]\s+enabled = false/u
        );
        assert.match(
            configuration,
            /\[auth\.sms\]\s+enable_signup = false/u
        );
        assert.match(
            configuration,
            /\[auth\.external\.google\]\s+enabled = false/u
        );
        assert.doesNotMatch(
            configuration,
            /service_role|secret_key/u
        );
    }
);

test(
    "email authentication keeps a production return URL and a staged OTP template",
    async () => {
        const [
            configuration,
            template
        ] = await Promise.all([
            readFile(
                resolve(
                    root,
                    "supabase/config.toml"
                ),
                "utf8"
            ),
            readFile(
                resolve(
                    root,
                    "supabase/templates/magic_link.html"
                ),
                "utf8"
            )
        ]);

        assert.match(
            configuration,
            /site_url = "https:\/\/temsahak-rgb\.github\.io\/Dino-5monde\/"/u
        );
        assert.doesNotMatch(
            configuration,
            /^\[auth\.email\.template\.magic_link\]/mu
        );
        assert.match(
            template,
            /\{\{ \.Token \}\}/u
        );
        assert.doesNotMatch(
            template,
            /ConfirmationURL/u
        );
    }
);

test(
    "shop credits and purchases remain server-managed and private",
    async () => {
        const migration =
            await readShopMigrations();

        assert.match(
            migration,
            /create table public\.learner_wallets[\s\S]*credits integer not null default 100/u
        );
        assert.match(
            migration,
            /create trigger auth_user_create_learner_wallet\s+after insert on auth\.users/u
        );
        assert.match(
            migration,
            /insert into public\.learner_wallets \(user_id\)\s+select users\.id\s+from auth\.users as users\s+on conflict \(user_id\) do nothing/u
        );

        for (
            const table
            of [
                "learner_wallets",
                "learner_credit_transactions",
                "shop_lessons",
                "lesson_entitlements"
            ]
        ) {
            assert.match(
                migration,
                new RegExp(
                    `alter table public\\.${table} enable row level security`,
                    "u"
                )
            );
            assert.match(
                migration,
                new RegExp(
                    `alter table public\\.${table} force row level security`,
                    "u"
                )
            );
        }

        assert.match(
            migration,
            /grant select on table public\.learner_wallets to authenticated/u
        );
        assert.match(
            migration,
            /grant select on table public\.lesson_entitlements to authenticated/u
        );
        assert.match(
            migration,
            /grant select on table public\.learner_credit_transactions to authenticated/u
        );
        assert.doesNotMatch(
            migration,
            /grant (?:insert|update|delete)[\s\S]*public\.(?:learner_wallets|learner_credit_transactions|lesson_entitlements)[\s\S]*to (?:anon|authenticated)/u
        );
        assert.match(
            migration,
            /create table public\.learner_credit_transactions[\s\S]*reason in \('starter_grant', 'lesson_purchase'\)/u
        );
        assert.match(
            migration,
            /learner_credit_transactions_delta_direction[\s\S]*reason = 'starter_grant' and delta > 0[\s\S]*reason = 'lesson_purchase' and delta < 0/u
        );
        assert.match(
            migration,
            /create trigger learner_credit_transactions_append_only\s+before update on/u
        );
        assert.match(
            migration,
            /insert into public\.learner_credit_transactions[\s\S]*'starter_grant'/u
        );
        assert.match(
            migration,
            /update public\.learner_wallets[\s\S]*insert into public\.learner_credit_transactions[\s\S]*'lesson_purchase'/u
        );
        assert.match(
            migration,
            /security definer\s+set search_path = ''[\s\S]*for update/u
        );
        assert.match(
            migration,
            /if exists \([\s\S]*lesson_entitlements[\s\S]*return query[\s\S]*false/u
        );
        assert.match(
            migration,
            /if wallet_credits < lesson_price then[\s\S]*message = 'insufficient_credits'/u
        );
        assert.match(
            migration,
            /revoke all on function public\.purchase_shop_lesson\(text\)\s+from public, anon, authenticated/u
        );
        assert.match(
            migration,
            /grant execute on function public\.purchase_shop_lesson\(text\)\s+to authenticated/u
        );
        assert.doesNotMatch(
            migration,
            /grant execute on function public\.[a-z_]*credit[a-z_]*\([^)]*\)\s+to (?:anon|authenticated)/u
        );
    }
);

test(
    "shop catalogue contains the four localized active lesson offers",
    async () => {
        const migration =
            await readShopMigrations();

        for (
            const {
                id,
                contentType,
                contentId,
                level,
                priceCredits
            } of shopOfferManifest
        ) {
            assert.match(
                migration,
                new RegExp(
                    `'${id}',\\s*'${contentType}',\\s*'${contentId}',\\s*'${level}',\\s*\\d+,[\\s\\S]*?true,`,
                    "u"
                )
            );
            assert.match(
                migration,
                new RegExp(
                    `\\('${id}',\\s*${priceCredits}\\)`,
                    "u"
                )
            );
        }

        assert.equal(
            shopOfferManifest.reduce(
                (total, offer) =>
                    total + offer.priceCredits,
                0
            ),
            100,
            "Starter credits must unlock the complete launch catalogue"
        );

        assert.match(
            migration,
            /grant select on table public\.shop_lessons to anon, authenticated/u
        );
        assert.match(
            migration,
            /create policy "Active shop lessons are public"[\s\S]*using \(active\)/u
        );

        const catalogSources = [
            [
                "data/grammar-C1.json",
                "C1-G-001",
                "C1",
                "Raconter au passé : les temps du récit"
            ],
            [
                "data/grammar-C1.json",
                "C1-G-004",
                "C1",
                "Les connecteurs logiques : structurer l'argumentation"
            ],
            [
                "data/vocabulary/vocab-B2.json",
                "pack_81_rhetorique_persuasion",
                "B2",
                "Rhétorique, persuasion et art de la parole"
            ],
            [
                "data/vocabulary/vocab-C1.json",
                "paleontology_fossils",
                "C1",
                "Paléontologie, dinosaures et ères géologiques"
            ]
        ] as const;

        for (
            const [
                source,
                contentId,
                level,
                title
            ] of catalogSources
        ) {
            const catalog =
                JSON.parse(
                    await readFile(
                        resolve(root, source),
                        "utf8"
                    )
                ) as Array<{
                    id: string;
                    level?: string;
                    title: string;
                }>;

            const catalogItem =
                catalog.find(
                    item =>
                        item.id === contentId
                );

            assert.ok(
                catalogItem,
                `Missing Shop content ${contentId} in ${source}`
            );
            assert.equal(
                catalogItem.title,
                title
            );
            assert.equal(
                catalogItem.level
                ?? /vocab-(A1|A2|B1|B2|C1|C2)\.json$/u
                    .exec(source)?.[1],
                level
            );
            assert.ok(
                migration.includes(
                    `'${title.replaceAll("'", "''")}'`
                ),
                `Shop copy must match ${source} for ${contentId}`
            );
        }
    }
);
