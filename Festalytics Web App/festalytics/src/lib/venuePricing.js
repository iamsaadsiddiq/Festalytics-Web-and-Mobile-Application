const DEFAULT_PRICING = {
  hallRent: 250000,
  acCost: 25000,
  generatorCost: 15000,
  decorAvailable: true,
  decorPrice: 120000,
  soundAvailable: true,
  soundPrice: 25000,
  securityAvailable: true,
  securityPrice: 20000,
  chickenPrice: 1400,
  beefPrice: 2000,
  muttonPrice: 3000,
  mehndiPrice: 1200,
};

function buildStandardPackages(pricing) {
  const chickenPrice = pricing.chickenPrice ?? 1400;
  const beefPrice = pricing.beefPrice ?? 2000;
  const muttonPrice = pricing.muttonPrice ?? 3000;
  const mehndiPrice = pricing.mehndiPrice ?? 1200;

  return [
    {
      id: "pkg-2",
      name: "Mehndi Feast Chicken Menu",
      type: "Chicken",
      perPlatePrice: chickenPrice,
      dishes: ["Chicken Pulao", "Chicken Seekh Kabab", "Fresh Salad", "Mint Raita", "Jalebi"],
    },
    {
      id: "pkg-1",
      name: "Barat Luxury Beef Menu",
      type: "Beef",
      perPlatePrice: beefPrice,
      dishes: ["Beef Biryani", "Beef Qorma", "Raita & Salad", "Assorted Naan", "Shahi Kheer"],
    },
    {
      id: "pkg-3",
      name: "Royal Mutton Walima Menu",
      type: "Mutton",
      perPlatePrice: muttonPrice,
      dishes: ["Mutton Mandi", "Mutton Karahi", "Hummus & Pita", "Special Salad", "Shahi Tukray"],
    },
    {
      id: "pkg-4",
      name: "Mehndi Special Menu",
      type: "Mehndi",
      perPlatePrice: mehndiPrice,
      dishes: ["Puri Halwa Chana", "Gol Gappay Setup", "Dahi Bhallay", "Kashmiri Chai", "Live Jalebi"],
    },
  ];
}

export function getActivePricing(dbVenue) {
  const p = dbVenue?.pricing || {};
  return {
    ...DEFAULT_PRICING,
    ...p,
    hallRent: Number(p.hallRent ?? DEFAULT_PRICING.hallRent),
    acCost: Number(p.acCost ?? DEFAULT_PRICING.acCost),
    generatorCost: Number(p.generatorCost ?? DEFAULT_PRICING.generatorCost),
    decorPrice: Number(p.decorPrice ?? DEFAULT_PRICING.decorPrice),
    soundPrice: Number(p.soundPrice ?? DEFAULT_PRICING.soundPrice),
    securityPrice: Number(p.securityPrice ?? DEFAULT_PRICING.securityPrice),
    chickenPrice: Number(p.chickenPrice ?? DEFAULT_PRICING.chickenPrice),
    beefPrice: Number(p.beefPrice ?? DEFAULT_PRICING.beefPrice),
    muttonPrice: Number(p.muttonPrice ?? DEFAULT_PRICING.muttonPrice),
    mehndiPrice: Number(p.mehndiPrice ?? DEFAULT_PRICING.mehndiPrice),
    decorAvailable: p.decorAvailable !== false,
    soundAvailable: p.soundAvailable !== false,
    securityAvailable: p.securityAvailable !== false,
  };
}

/**
 * @param {object|null} dbVenue - Firestore venues/{slug} data
 * @param {object|null} hallFallback - merged public hall (one_dish_* fields)
 */
export function resolveCateringPackages(dbVenue, hallFallback = null) {
  const pricing = getActivePricing(dbVenue);
  if (hallFallback) {
    if (hallFallback.one_dish_chicken) pricing.chickenPrice = parseInt(hallFallback.one_dish_chicken, 10) || pricing.chickenPrice;
    if (hallFallback.one_dish_beef) pricing.beefPrice = parseInt(hallFallback.one_dish_beef, 10) || pricing.beefPrice;
    if (hallFallback.one_dish_mutton) pricing.muttonPrice = parseInt(hallFallback.one_dish_mutton, 10) || pricing.muttonPrice;
  }

  const standardPkgs = buildStandardPackages(pricing);
  const dbPkgs = dbVenue?.cateringPackages || [];

  if (dbPkgs.length === 0) {
    return standardPkgs;
  }

  const customTypes = dbPkgs.map((p) => (p.type || "").toLowerCase());
  const filteredStandards = standardPkgs.filter(
    (std) => !customTypes.includes(std.type.toLowerCase())
  );

  const mappedDbPkgs = dbPkgs.map((pkg) => {
    const pkgType = pkg.type || "";
    let price = Number(pkg.perPlatePrice) || 0;
    if (pkgType === "Chicken" && dbVenue?.pricing?.chickenPrice) price = dbVenue.pricing.chickenPrice;
    else if (pkgType === "Beef" && dbVenue?.pricing?.beefPrice) price = dbVenue.pricing.beefPrice;
    else if (pkgType === "Mutton" && dbVenue?.pricing?.muttonPrice) price = dbVenue.pricing.muttonPrice;
    else if (pkgType === "Mehndi" && dbVenue?.pricing?.mehndiPrice) price = dbVenue.pricing.mehndiPrice;

    const matchingStd = standardPkgs.find((s) => s.type.toLowerCase() === pkgType.toLowerCase());
    return {
      ...pkg,
      id: pkg.id || `pkg-${pkgType.toLowerCase()}`,
      perPlatePrice: price,
      dishes: pkg.dishes?.length ? pkg.dishes : matchingStd?.dishes || [],
      categories: pkg.categories?.length ? pkg.categories : matchingStd?.categories || [],
    };
  });

  return [...mappedDbPkgs, ...filteredStandards];
}

export const VENUE_HIRE_ONLY = {
  id: "venue-hire-only",
  name: "Venue Hire Only",
  type: "None",
  perPlatePrice: 0,
  dishes: [],
};

export function formatRs(amount) {
  const n = Number(amount) || 0;
  return `Rs. ${n.toLocaleString("en-PK")}`;
}

const DEFAULT_ADDONS = {
  ac: false,
  generator: false,
  decor: false,
  sound: false,
  security: false,
};

/**
 * @param {object} params
 * @param {object|null} params.dbVenue
 * @param {number|string} params.guestCount
 * @param {object|null} params.selectedPkg
 * @param {object} [params.addons]
 */
export function computeEventBudget({ dbVenue, guestCount, selectedPkg, addons = DEFAULT_ADDONS }) {
  const pricing = getActivePricing(dbVenue);
  const guests = Math.max(1, parseInt(guestCount, 10) || 1);
  const pkg = selectedPkg || VENUE_HIRE_ONLY;
  const mergedAddons = { ...DEFAULT_ADDONS, ...addons };

  const hallRent = pricing.hallRent || 0;
  const perPlate = Number(pkg.perPlatePrice) || 0;
  const cateringSubtotal = perPlate > 0 ? perPlate * guests : 0;
  const utilitiesCost =
    (mergedAddons.ac ? pricing.acCost : 0) + (mergedAddons.generator ? pricing.generatorCost : 0);
  const addonsCost =
    (mergedAddons.decor && pricing.decorAvailable ? pricing.decorPrice : 0) +
    (mergedAddons.sound && pricing.soundAvailable ? pricing.soundPrice : 0) +
    (mergedAddons.security && pricing.securityAvailable ? pricing.securityPrice : 0);
  const grandTotal = hallRent + cateringSubtotal + utilitiesCost + addonsCost;

  const breakdown = [];

  breakdown.push({
    item: "Hall Rent",
    amount: hallRent,
    display: formatRs(hallRent),
  });

  if (perPlate > 0) {
    breakdown.push({
      item: `Catering: ${pkg.name} (${guests} × ${formatRs(perPlate)})`,
      amount: cateringSubtotal,
      display: formatRs(cateringSubtotal),
    });
  } else if (pkg.id === VENUE_HIRE_ONLY.id) {
    breakdown.push({
      item: "Catering: Venue Hire Only",
      amount: 0,
      display: formatRs(0),
    });
  }

  if (mergedAddons.ac) {
    breakdown.push({ item: "Air Conditioning", amount: pricing.acCost, display: formatRs(pricing.acCost) });
  }
  if (mergedAddons.generator) {
    breakdown.push({ item: "Generator", amount: pricing.generatorCost, display: formatRs(pricing.generatorCost) });
  }
  if (mergedAddons.decor && pricing.decorAvailable) {
    breakdown.push({ item: "Decor Package", amount: pricing.decorPrice, display: formatRs(pricing.decorPrice) });
  }
  if (mergedAddons.sound && pricing.soundAvailable) {
    breakdown.push({ item: "Sound System", amount: pricing.soundPrice, display: formatRs(pricing.soundPrice) });
  }
  if (mergedAddons.security && pricing.securityAvailable) {
    breakdown.push({ item: "Security", amount: pricing.securityPrice, display: formatRs(pricing.securityPrice) });
  }

  return {
    hallRent,
    cateringSubtotal,
    utilitiesCost,
    addonsCost,
    grandTotal,
    breakdown,
    pricing,
    guestCount: guests,
  };
}

export function getAddonOptions(dbVenue) {
  const pricing = getActivePricing(dbVenue);
  return [
    { key: "ac", label: "Air Conditioning", price: pricing.acCost, available: true },
    { key: "generator", label: "Generator", price: pricing.generatorCost, available: true },
    {
      key: "decor",
      label: "Decor Package",
      price: pricing.decorPrice,
      available: pricing.decorAvailable,
    },
    {
      key: "sound",
      label: "Sound System",
      price: pricing.soundPrice,
      available: pricing.soundAvailable,
    },
    {
      key: "security",
      label: "Security",
      price: pricing.securityPrice,
      available: pricing.securityAvailable,
    },
  ].filter((o) => o.available);
}
