import models from "../models/index.js";

const { ClothingItem } = models;

const TEMPERATURE_BANDS = [
    { max: 45, insulation: "heavy" },
    { max: 65, insulation: "medium" },
    { max: Infinity, insulation: "light" }
];

const REQUIRED_CATEGORIES = ["top", "bottom"];
const OPTIONAL_CATEGORIES = ["outerwear", "footwear", "accessory"];

/**
 * Determines the insulation level to target based on the temperature reading.
 * @param {number} temperature - Degrees Fahrenheit describing current conditions.
 * @returns {'light'|'medium'|'heavy'} Suggested insulation weight for outfit building.
 */
const pickInsulationLevel = (temperature) => {
    if (typeof temperature !== "number" || Number.isNaN(temperature)) {
        return "light";
    }
    const match = TEMPERATURE_BANDS.find((band) => temperature <= band.max);
    return match ? match.insulation : "light";
};

/**
 * Groups wardrobe items by category so outfit assembly can access them quickly.
 * @param {object[]} items - Wardrobe items retrieved for the user.
 * @returns {Record<string, object[]>} Items keyed by category.
 */
const summarizeWardrobe = (items) => {
    return items.reduce((acc, item) => {
        if (!acc[item.category]) {
            acc[item.category] = [];
        }
        acc[item.category].push(item);
        return acc;
    }, {});
};

/**
 * Scores a clothing item against the selection criteria to find the best match.
 * @param {object} item - Clothing item under evaluation.
 * @param {object} criteria - Selection rules derived from the weather needs.
 * @returns {{score: number, rationale: string[]}} Score and reasoning for the item.
 */
const computeScore = (item, criteria) => {
    let score = 0;
    const rationale = [];

    if (item.insulation_level === criteria.targetInsulation) {
        score += 3;
        rationale.push("Matches insulation level");
    } else if (criteria.targetInsulation === "heavy" && item.insulation_level === "medium") {
        score += 1;
        rationale.push("Slightly lighter insulation");
    } else if (criteria.targetInsulation === "medium" && item.insulation_level !== "light") {
        score += 1;
        rationale.push("Warmer coverage");
    }

    if (criteria.preferWaterproof && item.waterproof) {
        score += 2;
        rationale.push("Waterproof protection");
    }

    if (criteria.preferUvProtection && item.uv_protection) {
        score += 1;
        rationale.push("UV shielding");
    }

    if (criteria.preferredFormality && item.formality === criteria.preferredFormality) {
        score += 1;
        rationale.push("Matches formality");
    }

    return { score, rationale };
};

/**
 * Formats a human-readable message describing when category filters were relaxed.
 * @param {string} category - Clothing category being evaluated.
 * @param {string} reason - Explanation for the relaxation.
 * @param {string} [notes] - Optional additional context to append.
 * @returns {string} Gap message surfaced to the user.
 */
const relaxFilters = (category, reason, notes) => {
    return `${category.charAt(0).toUpperCase()}${category.slice(1)}: ${reason}${notes ? ` (${notes})` : ""}`;
};

/**
 * Derives clothing needs and preferences from the provided weather snapshot.
 * @param {object} [weather={}] - Latest weather metrics available for the user.
 * @returns {object} Normalized needs flags that downstream logic can consume.
 */
const determineNeeds = (weather = {}) => {
    const temperature = Number(weather.temperature ?? weather.temperature_2m);
    const precipitationChance = Number(weather.precipitation_chance ?? weather.precipitation_probability ?? 0);
    const windSpeed = Number(weather.wind_speed ?? weather.wind_speed_10m ?? 0);
    const uvIndex = Number(weather.uv_index ?? weather.uv);

    const targetInsulation = pickInsulationLevel(temperature);
    const requireWaterproof = precipitationChance >= 50;
    const preferWaterproof = precipitationChance >= 30;
    const preferUvProtection = uvIndex >= 6;
    const needsOuterwear = temperature <= 60 || windSpeed >= 18 || precipitationChance >= 40;
    const needsFootwearProtection = precipitationChance >= 40;

    return {
        temperature,
        targetInsulation,
        requireWaterproof,
        preferWaterproof,
        preferUvProtection,
        needsOuterwear,
        needsFootwearProtection
    };
};

/**
 * Builds selection criteria for a category using the derived weather needs.
 * @param {string} category - Wardrobe category under consideration.
 * @param {object} needs - Output from determineNeeds describing weather constraints.
 * @returns {object} Criteria object that guides filtering and scoring.
 */
const buildCategoryCriteria = (category, needs) => {
    const criteria = {
        mustMatch: [],
        preferWaterproof: false,
        preferUvProtection: false,
        targetInsulation: needs.targetInsulation,
        preferredFormality: null,
        relaxations: []
    };

    if (category === "outerwear") {
        if (needs.requireWaterproof) {
            criteria.mustMatch.push((item) => item.waterproof === true);
            criteria.relaxations.push({
                reason: "No waterproof outerwear saved",
                relax: (item) => item
            });
        } else if (needs.preferWaterproof) {
            criteria.preferWaterproof = true;
        }
    }

    if (category === "footwear") {
        if (needs.needsFootwearProtection) {
            criteria.headline = "Waterproof or weather-ready footwear recommended";
            criteria.preferWaterproof = true;
        }
    }

    if (category === "accessory") {
        if (needs.preferUvProtection) {
            criteria.preferUvProtection = true;
        }
    }

    if (category === "top" || category === "bottom") {
        if (needs.requireWaterproof) {
            criteria.preferWaterproof = true;
        }
    }

    return criteria;
};

/**
 * Applies mandatory criteria to narrow the candidate items for a category.
 * @param {object[]} items - Wardrobe items belonging to the given category.
 * @param {string} category - Category label used for generated messaging.
 * @param {object} criteria - Criteria produced by buildCategoryCriteria.
 * @returns {{candidates: object[], gaps: string[], relaxed: boolean}} Filter results and any gaps.
 */
const filterCandidates = (items, category, criteria) => {
    if (!items || !items.length) {
        return { candidates: [], gaps: [`No ${category} items saved`], relaxed: false };
    }

    let candidates = items;
    let relaxed = false;
    const gaps = [];

    if (criteria.mustMatch.length) {
        const strictMatches = items.filter((item) => criteria.mustMatch.every((rule) => rule(item)));
        if (strictMatches.length) {
            candidates = strictMatches;
        } else {
            relaxed = true;
            gaps.push(relaxFilters(category, "No items meeting required weather protection"));
        }
    }

    return { candidates, gaps, relaxed };
};

/**
 * Chooses the highest scoring item for a category and records any gap messages.
 * @param {object[]} items - Candidate items considered for the category.
 * @param {string} category - Category being resolved for the outfit.
 * @param {object} criteria - Criteria guiding scoring and filter relaxations.
 * @returns {{item: object|null, gaps: string[]}} Selected item and supporting gap messages.
 */
const chooseTopItem = (items, category, criteria) => {
    const { candidates, gaps, relaxed } = filterCandidates(items, category, criteria);
    if (!candidates.length) {
        return { item: null, gaps };
    }

    const scored = candidates.map((item) => {
        const { score, rationale } = computeScore(item, criteria);
        return { item, score, rationale };
    });

    const bestScore = Math.max(...scored.map((entry) => entry.score));
    const topOptions = scored.filter((entry) => entry.score === bestScore);
    const choice = topOptions[Math.floor(Math.random() * topOptions.length)] ?? topOptions[0];

    if (!choice) {
        return { item: null, gaps };
    }

    return {
        item: {
            id: choice.item.id,
            name: choice.item.name,
            category: choice.item.category,
            insulation_level: choice.item.insulation_level,
            waterproof: choice.item.waterproof,
            uv_protection: choice.item.uv_protection,
            formality: choice.item.formality,
            color: choice.item.color,
            notes: choice.item.notes,
            rationale: choice.rationale
        },
        gaps: relaxed ? gaps : []
    };
};

/**
 * Generates a weather-aware outfit recommendation for the supplied user.
 * @param {{userId: number|string, weather: object}} params - User context and weather input.
 * @returns {Promise<{outfit: object[], gaps: string[], context: object}>} Outfit suggestions plus context.
 */
const buildClothingSuggestions = async ({ userId, weather }) => {
    const wardrobe = await ClothingItem.findAll({ where: { user_id: userId } });
    const grouped = summarizeWardrobe(wardrobe);
    const needs = determineNeeds(weather);

    const outfit = [];
    const gaps = [];

    const baseCategories = [...REQUIRED_CATEGORIES];
    if (needs.needsOuterwear) {
        baseCategories.push("outerwear");
    }
    if (wardrobe.some((item) => item.category === "footwear")) {
        baseCategories.push("footwear");
    }
    if (needs.preferUvProtection && wardrobe.some((item) => item.category === "accessory")) {
        baseCategories.push("accessory");
    }

    baseCategories.forEach((category) => {
        const criteria = buildCategoryCriteria(category, needs);
        const { item, gaps: categoryGaps } = chooseTopItem(grouped[category] || [], category, criteria);
        if (item) {
            outfit.push(item);
        } else {
            gaps.push(...categoryGaps);
        }
    });

    OPTIONAL_CATEGORIES.forEach((category) => {
        if (baseCategories.includes(category)) {
            return;
        }
        const available = grouped[category] || [];
        if (!available.length) {
            return;
        }
        const criteria = buildCategoryCriteria(category, needs);
        const { item } = chooseTopItem(available, category, criteria);
        if (item) {
            outfit.push({ ...item, optional: true });
        }
    });

    if (!outfit.length) {
        gaps.push("No saved clothing items match today's weather yet. Add more items to your closet to get outfit suggestions.");
    }

    return {
        outfit,
        gaps,
        context: {
            temperature: needs.temperature,
            targetInsulation: needs.targetInsulation,
            requireWaterproof: needs.requireWaterproof,
            preferWaterproof: needs.preferWaterproof,
            preferUvProtection: needs.preferUvProtection
        }
    };
};

export default {
    buildClothingSuggestions
};
