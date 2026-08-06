/**
 * Maps Firestore venues/{slug} documents ↔ My Services UI state.
 * No venue-specific defaults — empty profile stays empty until vendor fills it in.
 */

export const EMPTY_PRICING = {
  hallRent: 0,
  acCost: 0,
  generatorCost: 0,
  decorAvailable: false,
  decorPrice: 0,
  soundAvailable: false,
  soundPrice: 0,
  securityAvailable: false,
  securityPrice: 0,
  chickenPrice: 0,
  beefPrice: 0,
  muttonPrice: 0,
  mehndiPrice: 0,
};

/**
 * @param {import("firebase/firestore").DocumentData | undefined} data
 * @returns {object}
 */
export function hydrateVenueFromFirestore(data) {
  if (!data) {
    return {
      businessName: "",
      vendorDescription: "",
      serviceActive: true,
      capacity: 0,
      pricing: { ...EMPTY_PRICING },
      cateringPackages: [],
      features: [],
      faqs: [],
      images: [],
      categories: [],
      activePackageName: "",
      activePackageStatus: true,
      streetAddress: "",
      city: "",
      postalCode: "",
      venueType: "",
      venueCategories: [],
      reviews: [],
      stats: { totalBookings: 0, totalRevenue: 0, averageRating: 0 },
    };
  }

  const profile = data.profile || {};
  const businessName =
    data.name ||
    data.hallName ||
    profile.hall_name ||
    "";

  const vendorDescription =
    data.description ||
    data.vendorDescription ||
    profile.description ||
    "";

  const menu = data.menuPackage || {};
  const categories = Array.isArray(menu.categories) ? menu.categories : [];

  const images = Array.isArray(data.images)
    ? data.images.map((img, idx) => ({
        id: img.id || `img-${idx + 1}`,
        url: typeof img === "string" ? img : img?.url || "",
        label: typeof img === "string" ? "" : img?.label || "",
        isPrimary: idx === 0 || Boolean(img?.isPrimary),
      }))
    : [];

  return {
    businessName,
    vendorDescription,
    serviceActive: data.serviceActive !== false,
    capacity: data.capacity ?? profile.capacity ?? 0,
    pricing: data.pricing ? { ...EMPTY_PRICING, ...data.pricing } : { ...EMPTY_PRICING },
    cateringPackages: Array.isArray(data.cateringPackages) ? data.cateringPackages : [],
    features: Array.isArray(data.features) ? data.features : [],
    faqs: Array.isArray(data.faqs) ? data.faqs : [],
    images,
    categories,
    activePackageName: menu.name || "",
    activePackageStatus: menu.status !== false,
    streetAddress: data.streetAddress || profile.address || "",
    city: data.city || profile.area || "",
    postalCode: data.postalCode || "",
    venueType: data.venueType || "",
    venueCategories: Array.isArray(data.categories) ? data.categories : [],
    reviews: Array.isArray(data.reviews) ? data.reviews : [],
    stats: {
      totalBookings: data.stats?.totalBookings ?? 0,
      totalRevenue: data.stats?.totalRevenue ?? 0,
      averageRating: data.stats?.averageRating ?? 0,
    },
  };
}

/**
 * @param {object} state
 * @returns {object} Firestore merge payload
 */
export function buildVenueSavePayload(state) {
  const {
    businessName,
    vendorDescription,
    pricing,
    activePackageName,
    activePackageStatus,
    categories,
    cateringPackages,
    features,
    serviceActive,
    faqs,
    images,
    capacity,
    streetAddress,
    city,
    postalCode,
    venueType,
    venueCategories,
    reviews,
    venueId,
  } = state;

  const packageType = activePackageName.includes("Beef")
    ? "Beef"
    : activePackageName.includes("Mutton")
      ? "Mutton"
      : activePackageName.includes("Mehndi")
        ? "Mehndi"
        : "Chicken";

  const headPrice =
    packageType === "Beef"
      ? pricing.beefPrice || 0
      : packageType === "Mutton"
        ? pricing.muttonPrice || 0
        : packageType === "Mehndi"
          ? pricing.mehndiPrice || 0
          : pricing.chickenPrice || 0;

  const syncCateringPackages = (cateringPackages || []).map((pkg) => {
    const pkgType = pkg.type || "";
    let syncedPrice = pkg.perPlatePrice;
    if (pkgType === "Chicken") syncedPrice = pricing.chickenPrice || 0;
    else if (pkgType === "Beef") syncedPrice = pricing.beefPrice || 0;
    else if (pkgType === "Mutton") syncedPrice = pricing.muttonPrice || 0;
    else if (pkgType === "Mehndi") syncedPrice = pricing.mehndiPrice || 0;
    return { ...pkg, perPlatePrice: syncedPrice };
  });

  const activePkg = {
    id: `pkg-${packageType.toLowerCase()}`,
    name: activePackageName || "Menu Package",
    type: packageType,
    perPlatePrice: headPrice,
    categories,
    dishes: (categories || [])
      .flatMap((c) => (c.items || []).filter((it) => it.active).map((it) => it.name))
      .slice(0, 8),
  };

  const updatedPackages = [
    activePkg,
    ...syncCateringPackages.filter(
      (p) => p.type !== packageType && p.id !== "pkg-active" && p.id !== activePkg.id
    ),
  ];

  const cap = parseInt(capacity, 10) || 0;

  return {
    name: businessName,
    hallName: businessName,
    description: vendorDescription,
    vendorDescription,
    pricing,
    menuPackage: {
      name: activePackageName || "Menu Package",
      status: activePackageStatus,
      categories: categories || [],
    },
    cateringPackages: updatedPackages,
    features: features || [],
    serviceActive,
    faqs: faqs || [],
    images: (images || []).map((im, i) => ({
      ...im,
      isPrimary: i === 0,
    })),
    capacity: cap,
    streetAddress,
    city,
    postalCode,
    venueType,
    categories: venueCategories,
    reviews: reviews || [],
    profile: {
      hall_name: businessName,
      address: streetAddress,
      area: city,
      capacity: cap,
      description: vendorDescription,
    },
    website: venueId ? `https://festalytics.com/venue/${venueId}` : undefined,
    updatedAt: new Date().toISOString(),
    _derivedPackages: updatedPackages,
  };
}
