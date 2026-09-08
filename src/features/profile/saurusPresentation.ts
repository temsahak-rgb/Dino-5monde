import type {
    SaurusKey
} from "../../core/saurusAllocation.js";

const saurusPresentations: Record<
    SaurusKey,
    {
        accentClass: string;
        icon: string;
        labelKey:
            | "saurus.velociraptor.name"
            | "saurus.triceratops.name"
            | "saurus.brachiosaurus.name";
        traitKey:
            | "saurus.velociraptor.trait"
            | "saurus.triceratops.trait"
            | "saurus.brachiosaurus.trait";
    }
> = {
    "velociraptor-explorer": {
        accentClass:
            "[--dino-mascot-green:#38bdf8] [--dino-mascot-green-dark:#075985] [--dino-mascot-green-light:#bae6fd]",
        icon: "⚡",
        labelKey:
            "saurus.velociraptor.name",
        traitKey:
            "saurus.velociraptor.trait"
    },
    "triceratops-perseverant": {
        accentClass:
            "[--dino-mascot-green:#fb7185] [--dino-mascot-green-dark:#9f1239] [--dino-mascot-green-light:#fecdd3]",
        icon: "🛡️",
        labelKey:
            "saurus.triceratops.name",
        traitKey:
            "saurus.triceratops.trait"
    },
    "brachiosaurus-curious": {
        accentClass:
            "[--dino-mascot-green:#a78bfa] [--dino-mascot-green-dark:#5b21b6] [--dino-mascot-green-light:#ddd6fe]",
        icon: "💡",
        labelKey:
            "saurus.brachiosaurus.name",
        traitKey:
            "saurus.brachiosaurus.trait"
    }
};

export {
    saurusPresentations
};
