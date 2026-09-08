import {
    useCallback,
    useEffect,
    useState
} from "react";

import {
    Link,
    useNavigate,
    useParams
} from "react-router";

import {
    createPracticeCatalogPath,
    isPracticeGameKind
} from "../core/practiceRoutes.js";

import {
    VocabularyGame
} from "../features/vocabulary/VocabularyGame.js";
import {
    PracticeGameReward
} from "../features/practice/PracticeGameReward.js";

import {
    getAvailableVocabularyGames
} from "../features/vocabulary/vocabularyGameEngine.js";

import {
    parseVocabularyLevel
} from "../features/vocabulary/vocabularyLevels.js";

import {
    loadVocabularyPack
} from "../features/vocabulary/vocabularyRepository.js";

import {
    useI18n
} from "../i18n/I18nProvider.js";

import type {
    Level,
    VocabPack
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
    Page
} from "../ui/components/Layout.js";

/** Loads and runs one vocabulary mini-game at a durable, shareable URL. */
function PracticeGamePage() {
    const {
        game: gameParameter,
        level: levelParameter,
        packId: packIdParameter
    } = useParams();

    const navigate =
        useNavigate();

    const {
        t
    } = useI18n();

    const game =
        isPracticeGameKind(gameParameter)
            ? gameParameter
            : null;

    const level =
        parseVocabularyLevel(levelParameter);

    const packId =
        normalizePracticePackId(packIdParameter);

    const [
        pack,
        setPack
    ] = useState<VocabPack | null>(null);

    const [
        loading,
        setLoading
    ] = useState(true);

    const [
        retryCount,
        setRetryCount
    ] = useState(0);
    const [
        gameCompleted,
        setGameCompleted
    ] = useState(false);
    const completeGame =
        useCallback(
            () => {
                setGameCompleted(true);
            },
            []
        );

    useEffect(
        () => {
            setGameCompleted(false);

            if (!game || !level || !packId) {
                setPack(null);
                setLoading(false);
                return;
            }

            let active = true;

            async function load(
                vocabularyLevel: Level,
                vocabularyPackId: string
            ): Promise<void> {
                setLoading(true);

                const loadedPack =
                    await loadVocabularyPack(
                        vocabularyLevel,
                        vocabularyPackId
                    );

                if (active) {
                    setPack(loadedPack);
                    setLoading(false);
                }
            }

            void load(level, packId);

            return () => {
                active = false;
            };
        },
        [
            game,
            level,
            packId,
            retryCount
        ]
    );

    if (!game || !level || !packId) {
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

    const catalogPath =
        createPracticeCatalogPath(
            game,
            level
        );

    if (loading) {
        return (
            <Page>
                <LoadingState label={t("common.loading")} />
            </Page>
        );
    }

    if (!pack) {
        return (
            <Page>
                <BackButton fallback={catalogPath}>
                    ← {t("common.back")}
                </BackButton>

                <ErrorState
                    title={t("error.notFound.title")}
                    description={t("vocab.packSoon")}
                    onRetry={() => {
                        setRetryCount(
                            current => current + 1
                        );
                    }}
                    retryLabel={t("common.retry")}
                />
            </Page>
        );
    }

    if (
        !getAvailableVocabularyGames(
            pack.words
        ).includes(game)
    ) {
        return (
            <Page>
                <BackButton fallback={catalogPath}>
                    ← {t("common.back")}
                </BackButton>

                <EmptyState
                    icon="🧩"
                    title={t("vocab.game.unavailable")}
                    action={
                        <Link
                            to={catalogPath}
                            className="text-sm font-bold text-dino-700 hover:underline hover:underline-offset-4"
                        >
                            {t("practice.chooseAnotherTheme")}
                        </Link>
                    }
                />
            </Page>
        );
    }

    return (
        <Page>
            <PracticeGameReward
                completed={gameCompleted}
                game={game}
                level={level}
                packId={packId}
            />

            <VocabularyGame
                pack={pack}
                game={game}
                onComplete={completeGame}
                onBack={() => {
                    navigate(catalogPath);
                }}
            />
        </Page>
    );
}

function normalizePracticePackId(
    value: string | undefined
): string | null {
    if (!value) {
        return null;
    }

    try {
        const decoded =
            decodeURIComponent(value).trim();

        return decoded || null;
    } catch {
        return null;
    }
}

export {
    normalizePracticePackId,
    PracticeGamePage
};
