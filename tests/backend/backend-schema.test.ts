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
