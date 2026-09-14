import assert from "node:assert/strict";
import test from "node:test";

import {
    readFile
} from "node:fs/promises";

import {
    dirname,
    resolve
} from "node:path";

import {
    fileURLToPath
} from "node:url";

import {
    createElement
} from "react";

import {
    renderToStaticMarkup
} from "react-dom/server";

import {
    BackendProvider,
    useBackend
} from "../../src/services/backend/BackendProvider.js";

import {
    ContentProvider,
    useContent
} from "../../src/services/content/ContentProvider.js";

import type {
    ContentRepository
} from "../../src/services/content/contentRepository.js";

function BackendProbe() {
    const {
        client,
        connectionStatus,
        configuration
    } = useBackend();

    return createElement(
        "output",
        null,
        `${configuration.status}${
            client === null
                ? ":no-client"
                : ":client"
        }:${connectionStatus}`
    );
}

function ContentProbe() {
    const {
        repository,
        source,
        status
    } = useContent();

    return createElement(
        "output",
        null,
        `${status}:${source ?? "none"}:${repository?.source ?? "no-repository"}`
    );
}

test(
    "BackendProvider keeps the existing static application operational",
    () => {
        const html =
            renderToStaticMarkup(
                createElement(
                    BackendProvider,
                    {
                        configuration: {
                            status: "disabled",
                            reason: "missing-environment"
                        },
                        children:
                            createElement(
                                BackendProbe
                            )
                    }
                )
            );

        assert.match(
            html,
            /disabled:no-client/u
        );
    }
);

test(
    "Supabase stays outside the initial application bundle",
    async () => {
        const root =
            resolve(
                dirname(
                    fileURLToPath(
                        import.meta.url
                    )
                ),
                "../.."
            );

        const source =
            await readFile(
                resolve(
                    root,
                    "src/services/backend/supabaseClient.ts"
                ),
                "utf8"
            );

        assert.match(
            source,
            /await import\(\s*"@supabase\/supabase-js"\s*\)/u
        );
        assert.doesNotMatch(
            source,
            /import\s+\{[^}]*createClient[^}]*\}\s+from/u
        );
    }
);

test(
    "ContentProvider makes the legacy repository explicit only when backend is disabled",
    () => {
        const staticRepository: ContentRepository = {
            listCatalog: async () => [],
            loadDocument: async () => null,
            source: "legacy-static"
        };
        const html =
            renderToStaticMarkup(
                createElement(
                    BackendProvider,
                    {
                        configuration: {
                            status: "disabled",
                            reason:
                                "missing-environment"
                        },
                        children:
                            createElement(
                                ContentProvider,
                                {
                                    staticRepository,
                                    children:
                                        createElement(
                                            ContentProbe
                                        )
                                }
                            )
                    }
                )
            );

        assert.match(
            html,
            /ready:legacy-static:legacy-static/u
        );
    }
);

test(
    "useBackend rejects components outside the provider boundary",
    () => {
        assert.throws(
            () => renderToStaticMarkup(
                createElement(
                    BackendProbe
                )
            ),
            /within BackendProvider/u
        );
    }
);
