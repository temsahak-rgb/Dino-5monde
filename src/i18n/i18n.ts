import { faMessages } from "./fa.js";
import {
    frMessages,
    type TranslationKey
} from "./fr.js";
import type { Language } from "../types/global.js";

export {
    applyDocumentLanguage,
    getI18nLanguage,
    getTextDirection,
    localizedTextClass,
    localizedValue,
    setI18nLanguage,
    t
};

/**
 * Central internationalization runtime.
 *
 * This file provides the translation API used by the application interface.
 * Educational content remains stored in the data files and is not duplicated
 * in the translation catalogs.
 */

type TranslationParams = Readonly<Record<string, string | number>>;

type TextDirection = "ltr" | "rtl";

/**
 * Translation catalogs indexed by supported interface language.
 *
 * The French catalog defines the canonical `TranslationKey` type, while every
 * additional locale is required to implement the same set of keys.
 */
const i18nMessages: Record<
    Language,
    Record<TranslationKey, string>
> = {
    fr: frMessages,
    fa: faMessages
};

/**
 * Returns the currently persisted interface language.
 *
 * Unsupported or missing values fall back to French.
 *
 * @returns The active application language.
 */
function getI18nLanguage(): Language {
    return localStorage.getItem("language") === "fa"
        ? "fa"
        : "fr";
}

/**
 * Returns the writing direction associated with a language.
 *
 * @param language - Language whose writing direction should be resolved.
 * @returns `rtl` for Persian and `ltr` for French.
 */
function getTextDirection(
    language: Language = getI18nLanguage()
): TextDirection {
    return language === "fa"
        ? "rtl"
        : "ltr";
}

/**
 * Replaces interpolation placeholders in a translated message.
 *
 * Example:
 *
 * `interpolate("Voyage ({count} leçons)", { count: 12 })`
 *
 * becomes:
 *
 * `Voyage (12 leçons)`
 *
 * Unknown placeholders are intentionally preserved so translation mistakes
 * remain visible during development instead of silently disappearing.
 *
 * @param message - Translation template containing optional `{name}` tokens.
 * @param params - Values used to replace interpolation tokens.
 * @returns The interpolated message.
 */
function interpolateTranslation(
    message: string,
    params: TranslationParams
): string {
    return message.replace(
        /\{([a-zA-Z0-9_]+)\}/g,
        (
            placeholder: string,
            parameterName: string
        ): string => {
            const value = params[parameterName];

            return value === undefined
                ? placeholder
                : String(value);
        }
    );
}

/**
 * Returns a translated interface message.
 *
 * The translation key is statically checked against the French reference
 * catalog. Optional parameters can be used for values such as counts, levels
 * or sequence numbers.
 *
 * @param key - Canonical translation key.
 * @param params - Optional interpolation values.
 * @returns The translated and interpolated message.
 */
function t(
    key: TranslationKey,
    params: TranslationParams = {}
): string {
    const language = getI18nLanguage();

    const message =
        i18nMessages[language][key]
        ?? frMessages[key];

    return interpolateTranslation(
        message,
        params
    );
}

/**
 * Synchronizes the root HTML element with the active interface language.
 *
 * This keeps browser accessibility information, text direction and the page
 * title aligned with the selected locale.
 *
 * @param language - Language to apply to the document.
 */
function applyDocumentLanguage(
    language: Language = getI18nLanguage()
): void {
    document.documentElement.lang = language;
    document.documentElement.dir =
        getTextDirection(language);

    document.title =
        i18nMessages[language]["app.title"];
}

/**
 * Persists and immediately applies a new interface language.
 *
 * Rendering the current application screen remains the responsibility of the
 * caller because different screens currently have different navigation flows.
 *
 * @param language - New interface language.
 */
function setI18nLanguage(
    language: Language
): void {
    localStorage.setItem(
        "language",
        language
    );

    applyDocumentLanguage(language);
}

/**
 * Returns a localized value from a bilingual data object.
 *
 * Interface strings should use `t()`. This helper exists only for educational
 * content already stored with French and Persian variants in JSON data.
 *
 * @param frenchValue - French content value.
 * @param persianValue - Persian content value.
 * @param fallback - Optional value used when both localized values are empty.
 * @returns The best value for the active interface language.
 */
function localizedValue(
    frenchValue?: string | null,
    persianValue?: string | null,
    fallback = ""
): string {
    const language = getI18nLanguage();

    if (language === "fa") {
        return (
            persianValue
            || frenchValue
            || fallback
        );
    }

    return (
        frenchValue
        || persianValue
        || fallback
    );
}

/**
 * Returns the CSS typography class matching the current writing direction.
 *
 * @returns `persian-text` for Persian or `ltr-lock` for French.
 */
function localizedTextClass(): string {
    return getI18nLanguage() === "fa"
        ? "persian-text"
        : "ltr-lock";
}

/*
 * Synchronize an already persisted language as soon as the i18n runtime loads.
 */
applyDocumentLanguage();
