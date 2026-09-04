export {
    knownNewsContentLinkDebt
};
export type {
    NewsContentLinkDebt
};

interface NewsContentLinkDebt {
    grammar: readonly string[];
    vocabulary: readonly string[];
}

/**
 * Existing unresolved cross-content references.
 *
 * This is a ratchet, not an exemption: the integrity test rejects every new
 * orphan and also rejects stale entries once a link has been created. Remove
 * items from this baseline as the corresponding corpus targets are added.
 */
const knownNewsContentLinkDebt: Readonly<
    Record<string, NewsContentLinkDebt>
> = {
    "2026-w34-azadi-tower": {
        grammar: [
            "a1-se-trouver",
            "a2-passe-compose-passif",
            "a1-avoir-taille",
            "a1-on-peut",
            "a1-negation",
            "a2-pronoun-qui",
            "b2-pronoun-dont",
            "b2-bien-que",
            "b2-tandis-que",
            "c1-loin-de",
            "c1-participe-present",
            "b2-mise-en-relief",
            "c1-ne-peut-pas-etre"
        ],
        vocabulary: [
            "une tour",
            "un monument",
            "un symbole",
            "la capitale",
            "un architecte",
            "être construit(e)",
            "une arche",
            "une ligne géométrique",
            "moderne",
            "se trouver",
            "à l'ouest de",
            "au début",
            "ériger / être érigé",
            "un édifice",
            "emblématique",
            "s'inscrire dans",
            "un héritage historique",
            "un courant architectural",
            "établir un dialogue entre",
            "être rebaptisé",
            "témoigner de",
            "une transformation profonde",
            "se distinguer par",
            "une structure monumentale",
            "un arc",
            "une forme géométrique",
            "réinterpréter",
            "reproduire fidèlement",
            "résolument moderne",
            "une façade",
            "une esthétique",
            "une conception architecturale",
            "susciter l'intérêt",
            "l'admiration"
        ]
    }
};
