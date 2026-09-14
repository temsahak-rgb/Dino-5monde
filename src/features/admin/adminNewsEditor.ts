import type {
    AdminContentItemRpcRow,
    Json
} from "../../services/backend/database.types.js";

import type {
    Level,
    NewsArticle,
    NewsGrammarItem,
    NewsSource,
    NewsVocabularyItem
} from "../../types/global.js";

import type {
    AdminContentEditorValue
} from "./adminContentEditor.js";

interface AdminNewsSourceValue {
    title: string;
    url: string;
}

interface AdminNewsVocabularyValue {
    fa: string;
    fr: string;
    level: string;
    packId: string;
}

interface AdminNewsGrammarValue {
    example: string;
    explanation: string;
    grammarId: string;
    level: string;
    title: string;
    translation: string;
}

interface AdminNewsEditorValue {
    contentKey: string;
    fullText: string;
    image: string;
    imageAlt: string;
    level: string;
    publishedDate: string;
    simpleText: string;
    sources: AdminNewsSourceValue[];
    subtitleFa: string;
    subtitleFr: string;
    titleFa: string;
    titleFr: string;
    vocabulary: AdminNewsVocabularyValue[];
    grammar: AdminNewsGrammarValue[];
}

interface AdminNewsValidationIssue {
    field: string;
    message: string;
    severity: "error" | "warning";
}

const cefrLevels = [
    "A1",
    "A2",
    "B1",
    "B2",
    "C1",
    "C2"
] as const;

const newsIdPattern =
    /^\d{4}-w(?:0[1-9]|[1-4]\d|5[0-3])-[a-z0-9]+(?:-[a-z0-9]+)*$/u;

const levelPattern =
    /^(A1|A2|B1|B2|C1|C2)(?:-(A1|A2|B1|B2|C1|C2))?$/u;

const cefrRank = new Map(
    cefrLevels.map((level, index) => [level, index])
);

function readAdminNewsEditor(
    editor: AdminContentEditorValue
): AdminNewsEditorValue {
    const payload = parseObject(editor.payloadText);
    const catalog = asObject(payload?.catalog);
    const document = asObject(payload?.document);
    const content = asObject(document?.content);

    return {
        contentKey: firstString(
            document?.id,
            catalog?.id,
            editor.contentKey
        ),
        fullText: firstString(content?.fullText),
        image: firstString(document?.image, catalog?.image),
        imageAlt: firstString(document?.imageAlt),
        level: firstString(document?.level, catalog?.level, editor.level),
        publishedDate: firstString(
            document?.publishedDate,
            catalog?.publishedDate
        ),
        simpleText: firstString(content?.simpleText),
        sources: readSources(document?.sources),
        subtitleFa: firstString(document?.subtitle_fa, catalog?.subtitle_fa),
        subtitleFr: firstString(document?.subtitle, catalog?.subtitle),
        titleFa: firstString(document?.title_fa, catalog?.title_fa, editor.titleFa),
        titleFr: firstString(document?.title, catalog?.title, editor.titleFr),
        vocabulary: readVocabulary(content?.vocabulary),
        grammar: readGrammar(content?.grammar)
    };
}

function updateAdminNewsEditor(
    editor: AdminContentEditorValue,
    news: AdminNewsEditorValue
): AdminContentEditorValue {
    return {
        ...editor,
        contentKey: news.contentKey,
        contentType: "news_article",
        level: news.level,
        payloadText: JSON.stringify(
            buildAdminNewsPayload(news),
            null,
            2
        ),
        sourcePath: editor.sourcePath || "admin-panel",
        titleFa: news.titleFa,
        titleFr: news.titleFr
    };
}

function buildAdminNewsPayload(
    news: AdminNewsEditorValue
): Json {
    const calendar = getNewsCalendar(news.publishedDate);
    const shared = {
        id: news.contentKey.trim(),
        image: news.image.trim(),
        level: news.level.trim(),
        publishedDate: news.publishedDate.trim(),
        subtitle: news.subtitleFr.trim(),
        subtitle_fa: news.subtitleFa.trim(),
        title: news.titleFr.trim(),
        title_fa: news.titleFa.trim()
    };

    return {
        catalog: {
            ...shared,
            icon: "",
            week: calendar.week,
            year: calendar.year
        },
        document: {
            ...shared,
            content: {
                fullText: news.fullText.trim(),
                grammar: news.grammar.map(item => compactObject({
                    example: item.example,
                    explanation: item.explanation,
                    grammarId: item.grammarId,
                    level: item.level,
                    title: item.title,
                    translation: item.translation
                })),
                simpleText: news.simpleText.trim(),
                vocabulary: news.vocabulary.map(item => compactObject({
                    fa: item.fa,
                    fr: item.fr,
                    level: item.level,
                    packId: item.packId
                }))
            },
            icon: "newspaper",
            imageAlt: news.imageAlt.trim(),
            sources: news.sources.map(item => ({
                title: item.title.trim(),
                url: item.url.trim()
            })),
            week: calendar.week,
            year: calendar.year
        }
    };
}

function validateAdminNewsEditor(
    news: AdminNewsEditorValue,
    availableItems?: readonly AdminContentItemRpcRow[]
): AdminNewsValidationIssue[] {
    const issues: AdminNewsValidationIssue[] = [];
    requireMatch(
        issues,
        "Identifiant",
        news.contentKey,
        newsIdPattern,
        "Utilisez la forme AAAA-wNN-slug."
    );
    requireText(issues, "Titre français", news.titleFr, 3);
    requireMatch(
        issues,
        "Niveau",
        news.level,
        levelPattern,
        "Utilisez un niveau ou une plage CECRL, par exemple B1-C1."
    );

    if (isReversedLevelRange(news.level)) {
        issues.push(errorIssue(
            "Niveau",
            "La plage CECRL doit aller du niveau le plus simple au plus avancé."
        ));
    }

    if (!isIsoDate(news.publishedDate)) {
        issues.push(errorIssue(
            "Date de publication",
            "Utilisez une date réelle au format AAAA-MM-JJ."
        ));
    }

    if (
        !news.image.trim().startsWith("https://")
        && !news.image.trim().startsWith("./data/news/images/")
    ) {
        issues.push(errorIssue(
            "Image",
            "Utilisez une URL HTTPS ou une image historique de data/news/images."
        ));
    }

    requireText(issues, "Texte complet", news.fullText, 80);
    requireText(issues, "Texte simplifié", news.simpleText, 40);

    if (news.sources.length === 0) {
        issues.push(errorIssue(
            "Sources",
            "Ajoutez au moins une source vérifiable."
        ));
    }

    news.sources.forEach((source, index) => {
        requireText(issues, `Source ${index + 1}`, source.title, 3);
        if (!isHttpsUrl(source.url)) {
            issues.push(errorIssue(
                `Source ${index + 1}`,
                "L’adresse de la source doit être une URL HTTPS valide."
            ));
        }
    });

    news.vocabulary.forEach((item, index) => {
        requireText(issues, `Vocabulaire ${index + 1}`, item.fr, 1);
        requireText(issues, `Vocabulaire ${index + 1}`, item.fa, 1);
        optionalLevel(issues, `Vocabulaire ${index + 1}`, item.level);
        validateReference(
            issues,
            availableItems,
            "vocabulary_pack",
            item.packId,
            `Vocabulaire ${index + 1}`
        );
    });

    news.grammar.forEach((item, index) => {
        requireText(issues, `Grammaire ${index + 1}`, item.title, 2);
        requireText(issues, `Grammaire ${index + 1}`, item.example, 2);
        optionalLevel(issues, `Grammaire ${index + 1}`, item.level);
        validateReference(
            issues,
            availableItems,
            "grammar_lesson",
            item.grammarId,
            `Grammaire ${index + 1}`
        );
    });

    for (const [field, value, message] of [
        ["Titre persan", news.titleFa, "Ajoutez le titre persan."],
        ["Sous-titre français", news.subtitleFr, "Ajoutez un chapô français."],
        ["Sous-titre persan", news.subtitleFa, "Ajoutez le chapô persan."],
        ["Texte alternatif", news.imageAlt, "Décrivez l’image pour l’accessibilité."]
    ] as const) {
        if (!value.trim()) {
            issues.push({ field, message, severity: "warning" });
        }
    }

    return issues;
}

function createNewsArticlePreview(
    news: AdminNewsEditorValue
): NewsArticle {
    return {
        content: {
            fullText: news.fullText || "Le texte complet apparaîtra ici.",
            grammar: news.grammar
                .filter(item => item.title && item.example)
                .map(toGrammarPreview),
            simpleText: news.simpleText || "Le texte simplifié apparaîtra ici.",
            vocabulary: news.vocabulary
                .filter(item => item.fr && item.fa)
                .map(toVocabularyPreview)
        },
        id: news.contentKey || "nouvelle-actualite",
        image: news.image,
        imageAlt: news.imageAlt,
        level: news.level,
        publishedDate: news.publishedDate || "—",
        sources: news.sources.filter(item => item.title && item.url),
        subtitle: news.subtitleFr,
        subtitle_fa: news.subtitleFa,
        title: news.titleFr || "Titre de l’actualité",
        title_fa: news.titleFa
    };
}

function getAdminNewsCompletion(
    issues: readonly AdminNewsValidationIssue[]
): number {
    const errorCount = issues.filter(issue => issue.severity === "error").length;
    const warningCount = issues.length - errorCount;

    return Math.max(0, 100 - errorCount * 12 - warningCount * 4);
}

function validateReference(
    issues: AdminNewsValidationIssue[],
    availableItems: readonly AdminContentItemRpcRow[] | undefined,
    type: "grammar_lesson" | "vocabulary_pack",
    contentKey: string,
    field: string
): void {
    if (!contentKey.trim()) {
        issues.push({
            field,
            message: type === "grammar_lesson"
                ? "Aucune leçon liée : le bloc restera informatif."
                : "Aucun pack lié : le mot ne sera pas navigable.",
            severity: "warning"
        });
        return;
    }

    if (
        availableItems
        && !availableItems.some(item =>
            item.content_type === type
            && item.content_key === contentKey.trim()
            && item.published_revision_number !== null
        )
    ) {
        issues.push(errorIssue(
            field,
            `La cible ${contentKey.trim()} n’existe pas parmi les contenus publiés.`
        ));
    }
}

function requireText(
    issues: AdminNewsValidationIssue[],
    field: string,
    value: string,
    minimumLength: number
): void {
    if (value.trim().length < minimumLength) {
        issues.push(errorIssue(
            field,
            `Ce champ doit contenir au moins ${minimumLength} caractère(s).`
        ));
    }
}

function requireMatch(
    issues: AdminNewsValidationIssue[],
    field: string,
    value: string,
    pattern: RegExp,
    message: string
): void {
    if (!pattern.test(value.trim())) {
        issues.push(errorIssue(field, message));
    }
}

function optionalLevel(
    issues: AdminNewsValidationIssue[],
    field: string,
    value: string
): void {
    if (value && !cefrLevels.includes(value as Level)) {
        issues.push(errorIssue(field, "Le niveau CECRL est invalide."));
    }
}

function errorIssue(
    field: string,
    message: string
): AdminNewsValidationIssue {
    return { field, message, severity: "error" };
}

function isIsoDate(value: string): boolean {
    if (!/^\d{4}-\d{2}-\d{2}$/u.test(value)) {
        return false;
    }

    const date = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(date.valueOf())
        && date.toISOString().slice(0, 10) === value;
}

function isHttpsUrl(value: string): boolean {
    try {
        return new URL(value).protocol === "https:";
    } catch {
        return false;
    }
}

function isReversedLevelRange(value: string): boolean {
    const [start, end] = value.trim().split("-");

    if (!start || !end) {
        return false;
    }

    const startRank = cefrRank.get(start as Level);
    const endRank = cefrRank.get(end as Level);

    return startRank !== undefined
        && endRank !== undefined
        && startRank > endRank;
}

function getNewsCalendar(value: string): {
    week: number;
    year: number;
} {
    if (!isIsoDate(value)) {
        return { week: 0, year: 0 };
    }

    const date = new Date(`${value}T00:00:00Z`);
    const thursday = new Date(date);
    const weekday = (date.getUTCDay() + 6) % 7;
    thursday.setUTCDate(date.getUTCDate() - weekday + 3);
    const year = thursday.getUTCFullYear();
    const firstThursday = new Date(Date.UTC(year, 0, 4));
    const firstWeekday = (firstThursday.getUTCDay() + 6) % 7;
    firstThursday.setUTCDate(firstThursday.getUTCDate() - firstWeekday + 3);

    return {
        week: 1 + Math.round(
            (thursday.valueOf() - firstThursday.valueOf())
            / 604_800_000
        ),
        year
    };
}

function parseObject(value: string): Record<string, Json | undefined> | null {
    try {
        return asObject(JSON.parse(value) as Json);
    } catch {
        return null;
    }
}

function asObject(
    value: Json | undefined
): Record<string, Json | undefined> | null {
    return typeof value === "object"
        && value !== null
        && !Array.isArray(value)
        ? value
        : null;
}

function firstString(...values: unknown[]): string {
    return values.find(value => typeof value === "string") as string | undefined
        ?? "";
}

function readSources(value: Json | undefined): AdminNewsSourceValue[] {
    return readObjectArray(value).map(item => ({
        title: firstString(item.title),
        url: firstString(item.url)
    }));
}

function readVocabulary(value: Json | undefined): AdminNewsVocabularyValue[] {
    return readObjectArray(value).map(item => ({
        fa: firstString(item.fa),
        fr: firstString(item.fr),
        level: firstString(item.level),
        packId: firstString(item.packId)
    }));
}

function readGrammar(value: Json | undefined): AdminNewsGrammarValue[] {
    return readObjectArray(value).map(item => ({
        example: firstString(item.example),
        explanation: firstString(item.explanation),
        grammarId: firstString(item.grammarId),
        level: firstString(item.level),
        title: firstString(item.title),
        translation: firstString(item.translation)
    }));
}

function readObjectArray(
    value: Json | undefined
): Array<Record<string, Json | undefined>> {
    return Array.isArray(value)
        ? value.map(asObject).filter(
            (item): item is Record<string, Json | undefined> => item !== null
        )
        : [];
}

function compactObject(
    value: Record<string, string>
): Record<string, string> {
    return Object.fromEntries(
        Object.entries(value)
            .map(([key, item]) => [key, item.trim()])
            .filter(([, item]) => item.length > 0)
    );
}

function toGrammarPreview(
    value: AdminNewsGrammarValue
): NewsGrammarItem {
    return {
        example: value.example,
        explanation: value.explanation || undefined,
        grammarId: value.grammarId || undefined,
        level: cefrLevels.includes(value.level as Level)
            ? value.level as Level
            : undefined,
        title: value.title,
        translation: value.translation || undefined
    };
}

function toVocabularyPreview(
    value: AdminNewsVocabularyValue
): NewsVocabularyItem {
    return {
        fa: value.fa,
        fr: value.fr,
        level: cefrLevels.includes(value.level as Level)
            ? value.level as Level
            : undefined,
        packId: value.packId || undefined
    };
}

export {
    buildAdminNewsPayload,
    cefrLevels,
    createNewsArticlePreview,
    getAdminNewsCompletion,
    newsIdPattern,
    readAdminNewsEditor,
    updateAdminNewsEditor,
    validateAdminNewsEditor
};

export type {
    AdminNewsEditorValue,
    AdminNewsGrammarValue,
    AdminNewsSourceValue,
    AdminNewsValidationIssue,
    AdminNewsVocabularyValue
};
