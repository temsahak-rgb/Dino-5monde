import {
    getSaurusEvolution,
    type SaurusKey
} from "../../core/saurusAllocation.js";
import {
    useI18n
} from "../../i18n/I18nProvider.js";
import {
    Card,
    ProgressBar
} from "../../ui/components/Controls.js";
import {
    SaurusPortrait
} from "./SaurusPortrait.js";
import {
    saurusPresentations
} from "./saurusPresentation.js";

interface SaurusIdentityCardProps {
    completedActivities: number;
    compact?: boolean;
    species: SaurusKey;
}

const phaseKeys = {
    explorer:
        "saurus.phase.explorer",
    guide:
        "saurus.phase.guide",
    hatchling:
        "saurus.phase.hatchling"
} as const;

function SaurusIdentityCard({
    completedActivities,
    compact = false,
    species
}: SaurusIdentityCardProps) {
    const { t } = useI18n();
    const evolution =
        getSaurusEvolution(
            completedActivities
        );
    const presentation =
        saurusPresentations[species];
    const speciesName =
        t(presentation.labelKey);

    return (
        <Card
            className={
                compact
                    ? "p-5"
                    : "overflow-hidden p-5 sm:p-6"
            }
            aria-label={t(
                "saurus.identity.label"
            )}
        >
            <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:text-start">
                <SaurusPortrait
                    label={speciesName}
                    size={compact ? 92 : 128}
                    species={species}
                />
                <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold uppercase tracking-[0.08em] text-dino-700">
                        {t("saurus.identity.title")}
                    </p>
                    <h2 className="mt-1 text-xl font-bold text-ink sm:text-2xl">
                        {speciesName}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-muted">
                        {t(presentation.traitKey)}
                    </p>
                    <div className="mt-4 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                        <span className="rounded-full bg-dino-100 px-3 py-1 text-xs font-bold text-dino-800">
                            {t("saurus.phase.label", {
                                phase: t(
                                    phaseKeys[
                                        evolution.phase
                                    ]
                                )
                            })}
                        </span>
                        <span className="text-xs font-semibold text-muted">
                            {t(
                                "saurus.identity.visible"
                            )}
                        </span>
                    </div>
                </div>
            </div>

            {!compact ? (
                <div className="mt-6 rounded-card bg-canvas p-4">
                    {evolution.nextThreshold === null ? (
                        <p className="text-sm font-bold text-dino-800">
                            {t(
                                "saurus.phase.complete"
                            )}
                        </p>
                    ) : (
                        <>
                            <div className="mb-3 flex items-center justify-between gap-3 text-sm">
                                <strong className="text-ink">
                                    {t(
                                        "saurus.phase.progress"
                                    )}
                                </strong>
                                <span className="font-semibold text-muted">
                                    {t(
                                        "saurus.phase.remaining",
                                        {
                                            count:
                                                evolution.nextThreshold
                                                - evolution.completedActivities
                                        }
                                    )}
                                </span>
                            </div>
                            <ProgressBar
                                value={
                                    evolution.progressToNextPhase
                                }
                                max={
                                    evolution.nextThreshold
                                    - evolution.currentThreshold
                                }
                                label={t(
                                    "saurus.phase.progress"
                                )}
                            />
                        </>
                    )}
                </div>
            ) : null}
        </Card>
    );
}

export {
    SaurusIdentityCard
};

export type {
    SaurusIdentityCardProps
};
