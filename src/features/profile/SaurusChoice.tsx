import {
    saurusKeys,
    type SaurusKey
} from "../../core/saurusAllocation.js";
import {
    useI18n
} from "../../i18n/I18nProvider.js";
import {
    Button,
    Card
} from "../../ui/components/Controls.js";
import {
    SaurusPortrait
} from "./SaurusPortrait.js";
import {
    saurusPresentations
} from "./saurusPresentation.js";

interface SaurusChoiceProps {
    busy: boolean;
    error: boolean;
    onChange: (species: SaurusKey) => void;
    onConfirm: () => void;
    onRestart: () => void;
    recommendation: SaurusKey;
    selectedSaurus: SaurusKey | null;
}

function SaurusChoice({
    busy,
    error,
    onChange,
    onConfirm,
    onRestart,
    recommendation,
    selectedSaurus
}: SaurusChoiceProps) {
    const { t } = useI18n();
    const recommendedPresentation =
        saurusPresentations[
            recommendation
        ];

    return (
        <div className="grid gap-5">
            <Card className="border-dino-300 bg-dino-50 p-5 text-center sm:p-6">
                <p className="text-xs font-bold uppercase tracking-[0.08em] text-dino-700">
                    {t(
                        "saurus.choice.recommendation"
                    )}
                </p>
                <div className="mt-3">
                    <SaurusPortrait
                        label={t(
                            recommendedPresentation.labelKey
                        )}
                        species={recommendation}
                    />
                </div>
                <h2 className="mt-2 text-2xl font-bold text-ink">
                    {t(
                        recommendedPresentation.labelKey
                    )}
                </h2>
            </Card>

            <fieldset>
                <legend className="text-lg font-bold text-ink">
                    {t("saurus.choice.title")}
                </legend>
                <p className="mt-1 text-sm text-muted">
                    {t("saurus.choice.hint")}
                </p>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                    {saurusKeys.map(species => {
                        const presentation =
                            saurusPresentations[species];
                        const selected =
                            selectedSaurus === species;

                        return (
                            <label
                                className={`relative cursor-pointer rounded-card border p-4 text-center transition ${selected ? "border-dino-500 bg-dino-50 ring-2 ring-dino-200" : "border-line bg-surface hover:border-dino-300"}`}
                                key={species}
                            >
                                <input
                                    className="sr-only"
                                    checked={selected}
                                    name="saurus"
                                    onChange={() => {
                                        onChange(species);
                                    }}
                                    type="radio"
                                    value={species}
                                />
                                {species === recommendation ? (
                                    <span className="absolute end-2 top-2 rounded-full bg-dino-600 px-2 py-1 text-[0.65rem] font-bold text-white">
                                        {t(
                                            "saurus.choice.recommended"
                                        )}
                                    </span>
                                ) : null}
                                <SaurusPortrait
                                    size={88}
                                    species={species}
                                />
                                <strong className="mt-2 block text-sm text-ink">
                                    {t(
                                        presentation.labelKey
                                    )}
                                </strong>
                                <span className="mt-1 block text-xs leading-5 text-muted">
                                    {t(
                                        presentation.traitKey
                                    )}
                                </span>
                            </label>
                        );
                    })}
                </div>
            </fieldset>

            {error ? (
                <p
                    className="rounded-control border border-danger bg-danger-soft p-3 text-sm font-semibold text-danger"
                    role="alert"
                >
                    {t("saurus.choice.error")}
                </p>
            ) : null}

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                <Button
                    disabled={busy}
                    onClick={onRestart}
                    variant="secondary"
                >
                    {t("saurus.choice.restart")}
                </Button>
                <Button
                    disabled={
                        busy
                        || !selectedSaurus
                    }
                    onClick={onConfirm}
                >
                    {busy
                        ? t("common.loading")
                        : t(
                            "saurus.choice.confirm"
                        )}
                </Button>
            </div>
        </div>
    );
}

export {
    SaurusChoice
};

export type {
    SaurusChoiceProps
};
