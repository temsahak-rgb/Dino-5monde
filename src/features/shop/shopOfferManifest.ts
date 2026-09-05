import type {
    ShopLessonContentType,
    ShopLessonLevel
} from "../../services/backend/shopRepository.js";

interface ShopOfferReference {
    contentId: string;
    contentType: ShopLessonContentType;
    id: string;
    level: ShopLessonLevel;
    priceCredits: number;
}

/**
 * Public routing manifest for the current virtual-credit catalogue.
 *
 * The database remains authoritative for localized copy, availability,
 * balances and entitlements. Keeping only the sold content references in the
 * bundle lets free lessons render immediately without waiting for Supabase.
 * Backend contract tests keep this list aligned with the migration.
 */
const shopOfferManifest:
    readonly ShopOfferReference[] = [
        {
            contentId: "C1-G-001",
            contentType: "grammar",
            id: "grammar-c1-g-001",
            level: "C1",
            priceCredits: 30
        },
        {
            contentId: "C1-G-004",
            contentType: "grammar",
            id: "grammar-c1-g-004",
            level: "C1",
            priceCredits: 25
        },
        {
            contentId:
                "pack_81_rhetorique_persuasion",
            contentType: "vocabulary",
            id:
                "vocabulary-b2-pack-81-rhetorique-persuasion",
            level: "B2",
            priceCredits: 20
        },
        {
            contentId:
                "paleontology_fossils",
            contentType: "vocabulary",
            id:
                "vocabulary-c1-paleontology-fossils",
            level: "C1",
            priceCredits: 25
        }
    ];

function findShopOffer(
    contentType: ShopLessonContentType,
    contentId: string,
    level?: string
): ShopOfferReference | null {
    return shopOfferManifest.find(
        offer =>
            offer.contentType === contentType
            && offer.contentId === contentId
            && (
                !level
                || offer.level === level
            )
    ) ?? null;
}

export {
    findShopOffer,
    shopOfferManifest,
    type ShopOfferReference
};
