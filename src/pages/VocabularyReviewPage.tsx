import {
    useEffect,
    useState
} from "react";

import {
    useNavigate,
    useParams
} from "react-router";

import {
    VocabularyFlashcards
} from "../features/vocabulary/VocabularyFlashcards.js";

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
    VocabPack
} from "../types/global.js";

import {
    ErrorState,
    LoadingState
} from "../ui/components/Feedback.js";

import {
    Page
} from "../ui/components/Layout.js";

/** Direct route into one pack's weak-word flashcard session. */
function VocabularyReviewPage() {
    const { level: levelParameter, packId } = useParams();
    const level = parseVocabularyLevel(levelParameter);
    const navigate = useNavigate();
    const { t } = useI18n();
    const [pack, setPack] = useState<VocabPack | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let active = true;

        if (!level || !packId) {
            setLoading(false);
            return () => {
                active = false;
            };
        }

        void loadVocabularyPack(level, packId).then(loaded => {
            if (active) {
                setPack(loaded);
                setLoading(false);
            }
        });

        return () => {
            active = false;
        };
    }, [level, packId]);

    if (loading) {
        return <Page><LoadingState label={t("common.loading")} /></Page>;
    }

    if (!level || !packId || !pack) {
        return (
            <Page>
                <ErrorState
                    title={t("error.notFound.title")}
                    description={t("vocab.packSoon")}
                />
            </Page>
        );
    }

    return (
        <Page>
            <VocabularyFlashcards
                pack={pack}
                reviewMode
                onBack={() => {
                    navigate("/practice/review");
                }}
            />
        </Page>
    );
}

export {
    VocabularyReviewPage
};
