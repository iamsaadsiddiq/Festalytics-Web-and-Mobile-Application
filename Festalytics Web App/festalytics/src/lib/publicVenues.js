"use client";

const PLACEHOLDER_HALL_IMAGE =
  "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&q=80";

export function getPublicVenueDocId(venueObj) {
  if (!venueObj) return null;

  const name = venueObj.hall_name ? venueObj.hall_name.toLowerCase() : "";
  if (venueObj.hall_id === "1" || name.includes("zaydan banquet hall")) {
    return "zaydan-banquet-hall";
  }
  if (venueObj.hall_id === "2" || name.includes("qasar e zaydan")) {
    return "qasar-e-zaydan";
  }

  return (
    venueObj.hall_id?.toString() ||
    venueObj.hall_name?.toLowerCase().trim().replace(/\s+/g, "-")
  );
}

function primaryImageFromVenue(dbData) {
  const images = dbData.images || [];
  const primary = images.find((img) => img?.isPrimary);
  const picked = primary || images[0];

  if (typeof picked === "string") return picked;
  return picked?.url || PLACEHOLDER_HALL_IMAGE;
}

export function firestoreVenueToPublicHall(docId, dbData = {}) {
  const profile = dbData.profile || {};
  const pricing = dbData.pricing || {};
  const cateringPackages = dbData.cateringPackages || [];

  return {
    hall_id: docId,
    hall_name: profile.hall_name || dbData.hallName || dbData.name || docId.replace(/-/g, " "),
    category: dbData.venueType || "Banquet Hall",
    description:
      profile.description ||
      dbData.description ||
      "A registered wedding and event venue on Festalytics.",
    full_address: profile.address || dbData.streetAddress || dbData.address || "",
    area: profile.area || dbData.city || "Lahore",
    capacity_sitting: String(profile.capacity || dbData.capacity || 500),
    phone_1: profile.phone_1 || dbData.businessPhone || "",
    price_range: pricing.hallRent
      ? `PKR ${Number(pricing.hallRent).toLocaleString()} base rent`
      : "Contact for Pricing",
    images: (dbData.images || []).map((img) => (typeof img === "string" ? img : img?.url)).filter(Boolean),
    one_dish_chicken:
      cateringPackages.find((p) => p.type?.toLowerCase().includes("chicken"))?.perPlatePrice ||
      pricing.chickenPrice ||
      "2000",
    one_dish_beef:
      cateringPackages.find((p) => p.type?.toLowerCase().includes("beef"))?.perPlatePrice ||
      pricing.beefPrice ||
      "2850",
    one_dish_mutton:
      cateringPackages.find((p) => p.type?.toLowerCase().includes("mutton"))?.perPlatePrice ||
      pricing.muttonPrice ||
      "4100",
    serviceActive: dbData.serviceActive !== false,
    isFromDb: true,
    isFromFirestoreOnly: true,
  };
}

export function mergePublicVenues(localHalls, dbVenuesMap) {
  const localDocIds = new Set(localHalls.map((hall) => getPublicVenueDocId(hall)));

  const updatedLocalHalls = localHalls
    .map((hall) => {
      const docId = getPublicVenueDocId(hall);
      const dbData = dbVenuesMap[docId];
      if (!dbData) return hall;

      const fromDb = firestoreVenueToPublicHall(docId, dbData);
      return {
        ...hall,
        ...fromDb,
        hall_id: hall.hall_id,
        images: fromDb.images.length > 0 ? fromDb.images : hall.images,
      };
    })
    .filter((hall) => hall.serviceActive !== false);

  const firestoreOnlyHalls = Object.entries(dbVenuesMap)
    .filter(([docId]) => !localDocIds.has(docId))
    .map(([docId, dbData]) => firestoreVenueToPublicHall(docId, dbData))
    .filter((hall) => hall.serviceActive !== false);

  return [...updatedLocalHalls, ...firestoreOnlyHalls];
}

export function buildVenueImagePath(hall) {
  const firstImage = hall.images?.[0] || PLACEHOLDER_HALL_IMAGE;
  if (firstImage && !firstImage.includes("placeholder")) {
    return firstImage.replace("/Marriage Hall/", "/Marriage_hall/");
  }

  const normalizedName = hall.hall_name ? hall.hall_name.toLowerCase().trim() : "";
  return normalizedName
    ? `/Marriage_hall/${normalizedName}/1.jpeg`
    : PLACEHOLDER_HALL_IMAGE;
}
