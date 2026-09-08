import {
    useEffect,
    useState
} from "react";

import {
    useParams
} from "react-router";

import {
    isPracticeGameKind
} from "../core/practiceRoutes.js";

import type {
    PracticeGameKind
} from "../core/practiceRoutes.js";

import {
    getPracticeGamePresentation
} from "../features/practice/practiceGamePresentation.js";

import {
    PracticePackCatalog
} from "../features/practice/PracticePackCatalog.js";

import {
    parseVocabularyLevel
} from "../features/vocabulary/vocabularyLevels.js";

import {
    loadVocabularyIndex
} from "../features/vocabulary/vocabularyRepository.js";

import {
    useI18n
} from "../i18n/I18nProvider.js";

import type {
    Level,
    VocabPackIndex
} from "../types/global.js";

import {
    BackButton
} from "../ui/components/Controls.js";

import {
    EmptyState,
    ErrorState,
    LoadingState
} from "../ui/components/Feedback.js";

import {
    Page,
    PageHeader
} from "../ui/components/Layout.js";

/** Lists the vocabulary themes available for one game and CEFR level. */
function PracticeCatalogPage() {
    const {
        game: gameParameter,
        level: levelParameter
    } = useParams();

    const {
        t
    } = useI18n();

    const game: PracticeGameKind | null =
        isPracticeGameKind(gameParameter)
            ? gameParameter
            : null;

    const level =
        parseVocabularyLevel(
            levelParameter
        );

    const [
        packs,
        setPacks
    ] = useState<VocabPackIndex[]>([]);

    const [
        loading,
        setLoading
    ] = useState(true);

    const [
        retryCount,
        setRetryCount
    ] = useState(0);

    useEffect(
        () => {
            if (!game || !level) {
                setPacks([]);
                setLoading(false);
                return;
            }

            let active = true;

            async function load(
                vocabularyLevel: Level
            ): Promise<void> {
                setLoading(true);

                const loadedPacks =
                    await loadVocabularyIndex(
                        vocabularyLevel
                    );

                if (active) {
                    setPacks(loadedPacks);
                    setLoading(false);
                }
            }

            void load(level);

            return () => {
                active = false;
            };
        },
        [
            game,
            level,
            retryCount
        ]
    );

    if (!game || !level) {
        return (
            <Page>
                <BackButton fallback="/practice">
                    ← {t("common.back")}
                </BackButton>

                <ErrorState
                    title={t("error.notFound.title")}
                    description={t("practice.invalidRoute")}
                />
            </Page>
        );
    }

    const presentation =
        getPracticeGamePresentation(game);

    if (loading) {
        return (
            <Page>
                <LoadingState label={t("common.loading")} />
            </Page>
        );
    }

    return (
        <Page>
            <BackButton fallback="/practice">
                ← {t("common.back")}
            </BackButton>

            <PageHeader
                icon={presentation.icon}
                eyebrow={`${t("practice.title")} · ${level}`}
                title={t(presentation.titleKey)}
                description={t("practice.chooseTheme")}
            />

            {packs.length > 0 ? (
                <PracticePackCatalog
                    game={game}
                    level={level}
                    packs={packs}
                />
            ) : (
                <EmptyState
                    icon="📖"
                    title={t("practice.noThemes")}
                    action={
                        <button
                            type="button"
                            className="text-sm font-bold text-dino-700 hover:underline hover:underline-offset-4"
                            onClick={() => {
                                setRetryCount(
                                    current => current + 1
                                );
                            }}
                        >
                            {t("common.retry")}
                        </button>
                    }
                />
            )}
        </Page>
    );
}

export {
    PracticeCatalogPage
};
