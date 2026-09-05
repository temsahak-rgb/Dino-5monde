import assert from "node:assert/strict";
import test from "node:test";

import type {
    ShopLesson
} from "../../src/services/backend/shopRepository.js";
import {
    createShopLessonPath,
    loadLearnerWallet,
    loadLessonEntitlements,
    loadShopLessons,
    purchaseShopLesson
} from "../../src/services/backend/shopRepository.js";
import type {
    DinoBackendClient
} from "../../src/services/backend/supabaseClient.js";

const grammarOffer: ShopLesson = {
    active: true,
    cefr_level: "C1",
    content_id: "C1-G-001",
    content_type: "grammar",
    description_fa: "توضیح",
    description_fr: "Description",
    display_order: 10,
    id: "grammar-c1-g-001",
    price_credits: 30,
    title_fa: "عنوان",
    title_fr: "Titre"
};

test(
    "shop lesson paths use durable grammar and vocabulary routes",
    () => {
        assert.equal(
            createShopLessonPath(
                grammarOffer
            ),
            "/grammar/lesson/C1-G-001"
        );
        assert.equal(
            createShopLessonPath({
                cefr_level: "B2",
                content_id:
                    "pack_81_rhetorique_persuasion",
                content_type:
                    "vocabulary"
            }),
            "/vocabulary/B2/pack_81_rhetorique_persuasion"
        );
        assert.throws(
            () => createShopLessonPath({
                cefr_level: "C1",
                content_id: "../profile",
                content_type:
                    "vocabulary"
            }),
            TypeError
        );
        assert.throws(
            () => createShopLessonPath({
                cefr_level: "C2",
                content_id: "future-grammar",
                content_type:
                    "grammar"
            }),
            TypeError
        );
    }
);

test(
    "shop repository loads only active ordered offers and private learner state",
    async () => {
        const calls: unknown[][] = [];
        const wallet = {
            credits: 100,
            user_id: "learner-id"
        };
        const entitlement = {
            shop_lesson_id:
                "grammar-c1-g-001"
        };

        function createQuery(
            table: string
        ) {
            const query = {
                data: table === "shop_lessons"
                    ? [grammarOffer]
                    : table === "learner_wallets"
                        ? [wallet]
                        : [entitlement],
                error: null,
                eq: (
                    field: string,
                    value: unknown
                ) => {
                    calls.push([
                        table,
                        "eq",
                        field,
                        value
                    ]);
                    return query;
                },
                limit: (value: number) => {
                    calls.push([
                        table,
                        "limit",
                        value
                    ]);
                    return query;
                },
                order: (
                    field: string,
                    options: unknown
                ) => {
                    calls.push([
                        table,
                        "order",
                        field,
                        options
                    ]);
                    return query;
                },
                select: (columns: string) => {
                    calls.push([
                        table,
                        "select",
                        columns
                    ]);
                    return query;
                }
            };

            return query;
        }

        const client = {
            from: (table: string) =>
                createQuery(table)
        } as unknown as DinoBackendClient;

        assert.deepEqual(
            await loadShopLessons(client),
            [grammarOffer]
        );
        assert.deepEqual(
            await loadLearnerWallet(
                client,
                "learner-id"
            ),
            wallet
        );
        assert.deepEqual(
            await loadLessonEntitlements(
                client,
                "learner-id"
            ),
            [entitlement]
        );
        assert.deepEqual(
            calls,
            [
                [
                    "shop_lessons",
                    "select",
                    "active,cefr_level,content_id,content_type,description_fa,description_fr,display_order,id,price_credits,title_fa,title_fr"
                ],
                [
                    "shop_lessons",
                    "eq",
                    "active",
                    true
                ],
                [
                    "shop_lessons",
                    "order",
                    "display_order",
                    { ascending: true }
                ],
                [
                    "shop_lessons",
                    "order",
                    "id",
                    { ascending: true }
                ],
                [
                    "learner_wallets",
                    "select",
                    "credits,user_id"
                ],
                [
                    "learner_wallets",
                    "eq",
                    "user_id",
                    "learner-id"
                ],
                [
                    "learner_wallets",
                    "limit",
                    1
                ],
                [
                    "lesson_entitlements",
                    "select",
                    "shop_lesson_id"
                ],
                [
                    "lesson_entitlements",
                    "eq",
                    "user_id",
                    "learner-id"
                ],
                [
                    "lesson_entitlements",
                    "order",
                    "purchased_at",
                    { ascending: false }
                ]
            ]
        );
    }
);

test(
    "purchases use the sole server RPC and expose a stable camel-case result",
    async () => {
        const calls: unknown[] = [];
        const client = {
            rpc: async (
                name: string,
                args: unknown
            ) => {
                calls.push({
                    args,
                    name
                });

                return {
                    data: [
                        {
                            credits_remaining: 70,
                            purchased: true,
                            shop_lesson_id:
                                "grammar-c1-g-001"
                        }
                    ],
                    error: null
                };
            }
        } as unknown as DinoBackendClient;

        assert.deepEqual(
            await purchaseShopLesson(
                client,
                "grammar-c1-g-001"
            ),
            {
                balance: 70,
                purchased: true,
                shopLessonId:
                    "grammar-c1-g-001"
            }
        );
        assert.deepEqual(
            calls,
            [
                {
                    args: {
                        p_shop_lesson_id:
                            "grammar-c1-g-001"
                    },
                    name:
                        "purchase_shop_lesson"
                }
            ]
        );
        await assert.rejects(
            purchaseShopLesson(
                client,
                " grammar-c1-g-001"
            ),
            TypeError
        );
    }
);
