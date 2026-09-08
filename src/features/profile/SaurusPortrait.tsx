import type {
    SaurusKey
} from "../../core/saurusAllocation.js";
import {
    DinoMascot
} from "../../ui/components/DinoMascot.js";
import {
    saurusPresentations
} from "./saurusPresentation.js";

interface SaurusPortraitProps {
    label?: string;
    size?: number;
    species: SaurusKey;
}

function SaurusPortrait({
    label,
    size = 112,
    species
}: SaurusPortraitProps) {
    const presentation =
        saurusPresentations[species];

    return (
        <span className="pointer-events-none relative inline-flex">
            <DinoMascot
                className={presentation.accentClass}
                label={label}
                size={size}
            />
            <span
                className="absolute end-0 top-0 grid size-9 place-items-center rounded-full border-2 border-white bg-surface text-lg shadow-card"
                aria-hidden="true"
            >
                {presentation.icon}
            </span>
        </span>
    );
}

export {
    SaurusPortrait
};

export type {
    SaurusPortraitProps
};
