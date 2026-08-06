import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
  limit,
} from "firebase/firestore";
import { db } from "@/firebase";
import { ZAYDAN_VENUE_SLUG } from "@/lib/google/zaydanCallingSheet";

export { ZAYDAN_VENUE_SLUG };

const PLACEHOLDER_IMAGE =
  "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&q=80";

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

const DEFAULT_CATERING_PACKAGES = [
  {
    id: "pkg-chicken",
    name: "Chicken Menu Package",
    type: "Chicken",
    perPlatePrice: 1400,
    dishes: ["Chicken Karahi", "Chicken Biryani", "Fresh Salad", "Mint Raita", "Shahi Kheer"],
  },
  {
    id: "pkg-beef",
    name: "Beef Signature Menu",
    type: "Beef",
    perPlatePrice: 2000,
    dishes: ["Beef Biryani", "Beef Kabab Platters", "Special Salad", "Roghni Naan"],
  },
  {
    id: "pkg-mutton",
    name: "Royal Mutton Walima Menu",
    type: "Mutton",
    perPlatePrice: 3000,
    dishes: ["Mutton Mandi", "Mutton Karahi", "Hummus & Pita", "Shahi Tukray"],
  },
];

const DEFAULT_MENU_CATEGORIES = [
  {
    id: "cat-1",
    name: "Main Course",
    icon: "dinner_dining",
    items: [
      {
        id: "item-1",
        name: "Chicken Karahi",
        description: "Wok-fried chicken with ginger, green chillies and traditional spices.",
        price: 350,
        active: true,
      },
      {
        id: "item-2",
        name: "Chicken Biryani",
        description: "Aromatic basmati rice layered with spiced chicken and saffron.",
        price: 300,
        active: true,
      },
    ],
  },
  {
    id: "cat-2",
    name: "Sides & Salads",
    icon: "bakery_dining",
    items: [
      {
        id: "item-4",
        name: "Fresh Salad",
        description: "Seasonal garden fresh vegetables.",
        price: 50,
        active: true,
      },
    ],
  },
];

const DEFAULT_FEATURES = [
  "Premium Sound System",
  "Custom Mood Lighting",
  "Valet Parking Access",
  "Integrated Stage",
  "Full Bar Setup",
];

const DEFAULT_FAQS = [
  {
    id: "faq-1",
    question: "Is catering included in the base venue hire price?",
    answer:
      "Catering is not included in the base venue rate. You can choose to add our custom catering packages.",
    active: true,
  },
  {
    id: "faq-2",
    question: "What is the maximum capacity of the venue?",
    answer:
      "Capacity depends on your hall setup. Contact us for exact seated and standing numbers.",
    active: true,
  },
];

/**
 * @param {string} name
 * @returns {string}
 */
export function slugifyHallName(name) {
  return (name || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * @param {string} baseSlug
 * @returns {Promise<string>}
 */
export async function ensureUniqueVenueSlug(baseSlug) {
  if (!baseSlug) {
    throw new Error("Hall name must produce a valid URL slug.");
  }

  let candidate = baseSlug;
  let suffix = 2;

  while (true) {
    const snap = await getDoc(doc(db, "venues", candidate));
    if (!snap.exists()) {
      return candidate;
    }
    candidate = `${baseSlug}-${suffix}`;
    suffix += 1;
  }
}

/**
 * @param {object} input
 * @returns {object}
 */
export function buildDefaultVenueDocument(input) {
  const {
    hallName,
    area,
    address,
    capacity,
    phone = "",
    description = "",
    ownerId,
    venueSlug,
  } = input;

  const cap = parseInt(capacity, 10) || 500;
  const desc =
    description.trim() ||
    `${hallName} is a premium wedding and event venue in ${area}, offering elegant setups and bespoke catering.`;

  return {
    name: hallName,
    hallName,
    description: desc,
    streetAddress: address,
    city: area,
    postalCode: "54000",
    capacity: cap,
    venueType: "Banquet Hall",
    categories: ["BANQUET HALL", "CATERING", "DECOR"],
    website: `https://festalytics.com/venue/${venueSlug}`,
    profile: {
      hall_name: hallName,
      address,
      area,
      phone_1: phone || mobileFallback(input),
      capacity: cap,
      description: desc,
    },
    pricing: { ...DEFAULT_PRICING },
    cateringPackages: DEFAULT_CATERING_PACKAGES.map((p) => ({ ...p })),
    menuPackage: {
      name: "Chicken Menu Package",
      status: true,
      categories: DEFAULT_MENU_CATEGORIES.map((c) => ({
        ...c,
        items: c.items.map((i) => ({ ...i })),
      })),
    },
    features: [...DEFAULT_FEATURES],
    faqs: DEFAULT_FAQS.map((f, i) => ({
      ...f,
      id: `faq-${i + 1}`,
      question: f.question.replace("the venue", hallName),
    })),
    images: [
      {
        id: "img-1",
        url: PLACEHOLDER_IMAGE,
        label: `${hallName} — Main Hall`,
        isPrimary: true,
      },
    ],
    blockedDates: [],
    blackoutDates: [],
    bookedDates: [],
    operatingHours: {
      defaultFrom: "9:00 AM",
      defaultTo: "6:00 PM",
    },
    dayOverrides: {},
    serviceActive: true,
    ownerId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function mobileFallback(input) {
  return input.businessPhone || input.mobileNumber || "";
}

/**
 * Provisions venue + links user. Call after users/{uid} base doc exists.
 * @param {string} userId
 * @param {object} businessInput
 * @returns {Promise<{ venueId: string }>}
 */
export async function provisionVendorVenue(userId, businessInput) {
  if (!userId) {
    throw new Error("provisionVendorVenue: userId is required.");
  }

  const hallName = (businessInput.hallName || "").trim();
  const area = (businessInput.area || "").trim();
  const address = (businessInput.address || "").trim();
  const capacity = businessInput.capacity;

  if (!hallName) throw new Error("Hall / business name is required.");
  if (!area) throw new Error("City / area is required.");
  if (!address) throw new Error("Street address is required.");
  if (!capacity || parseInt(capacity, 10) < 1) {
    throw new Error("Seated capacity must be at least 1.");
  }

  const baseSlug = slugifyHallName(hallName);
  const venueSlug = await ensureUniqueVenueSlug(baseSlug);

  const venuePayload = buildDefaultVenueDocument({
    hallName,
    area,
    address,
    capacity,
    phone: businessInput.businessPhone || businessInput.mobileNumber,
    description: businessInput.description,
    ownerId: userId,
    venueSlug,
    mobileNumber: businessInput.mobileNumber,
  });

  await setDoc(doc(db, "venues", venueSlug), venuePayload);
  await setDoc(
    doc(db, "users", userId),
    {
      venueId: venueSlug,
      hallName,
      onboardingComplete: true,
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );

  return { venueId: venueSlug };
}

/**
 * Links an existing venue document to the vendor user (fixes legacy accounts missing users.venueId).
 * @param {string} userId
 * @param {string} venueSlug
 */
export async function linkVendorToVenue(userId, venueSlug) {
  if (!userId || !venueSlug) {
    throw new Error("User and venue are required.");
  }

  const venueRef = doc(db, "venues", venueSlug);
  const venueSnap = await getDoc(venueRef);
  if (!venueSnap.exists()) {
    throw new Error(`Venue "${venueSlug}" was not found in Firestore.`);
  }

  const venue = venueSnap.data();
  if (venue.ownerId && venue.ownerId !== userId) {
    throw new Error("This venue is already linked to another vendor account.");
  }

  await setDoc(
    venueRef,
    { ownerId: userId, updatedAt: new Date().toISOString() },
    { merge: true }
  );
  await setDoc(
    doc(db, "users", userId),
    {
      venueId: venueSlug,
      onboardingComplete: true,
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );

  return { venueId: venueSlug };
}

/**
 * Resolves tenant venue for a vendor and self-heals users.venueId when possible.
 * @param {string} userId
 * @param {object} [userData]
 * @returns {Promise<string|null>}
 */
export async function resolveVendorVenueId(userId, userData = {}) {
  if (!userId) return null;
  if (userData.venueId) return userData.venueId;
  if (userData.pendingVendorOnboarding) return null;

  try {
    const ownedSnap = await getDocs(
      query(collection(db, "venues"), where("ownerId", "==", userId), limit(5))
    );
    if (!ownedSnap.empty) {
      const slug = ownedSnap.docs[0].id;
      await setDoc(
        doc(db, "users", userId),
        {
          venueId: slug,
          onboardingComplete: true,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
      return slug;
    }
  } catch (err) {
    console.warn("[resolveVendorVenueId] ownerId query failed:", err);
  }

  try {
    const zaydanSnap = await getDoc(doc(db, "venues", ZAYDAN_VENUE_SLUG));
    if (!zaydanSnap.exists()) return null;

    const zaydan = zaydanSnap.data();
    if (zaydan.ownerId === userId) {
      await setDoc(
        doc(db, "users", userId),
        {
          venueId: ZAYDAN_VENUE_SLUG,
          onboardingComplete: true,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
      return ZAYDAN_VENUE_SLUG;
    }

    // Legacy: Zaydan ERP existed before per-user venueId. Re-link first vendor account with no tenant.
    if (
      userData.role === "vendor" &&
      !zaydan.ownerId &&
      !userData.venueId
    ) {
      await linkVendorToVenue(userId, ZAYDAN_VENUE_SLUG);
      return ZAYDAN_VENUE_SLUG;
    }
  } catch (err) {
    console.warn("[resolveVendorVenueId] Zaydan check failed:", err);
  }

  return null;
}
