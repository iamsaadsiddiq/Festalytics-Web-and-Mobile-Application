import { BORROW_STATUS } from "@/lib/firestore/borrowHub";

export const CATEGORY_PILLS = [
  { id: "all", label: "All Assets" },
  { id: "power", label: "Electrical & Power", match: ["power"] },
  { id: "seating", label: "Seating & Furniture", match: ["seating"] },
  { id: "decor", label: "Luxury Decor Setup", match: ["decor"] },
  { id: "catering", label: "Catering & Cooking Gear", match: ["other", "av"] },
];

const CATEGORY_IMAGES = {
  power:
    "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&q=80",
  seating:
    "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=600&q=80",
  decor:
    "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=600&q=80",
  av: "https://images.unsplash.com/photo-1571266028245-e68f8574c9b8?w=600&q=80",
  other:
    "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=600&q=80",
};

export function listingImageUrl(listing) {
  if (Array.isArray(listing.assetImages) && listing.assetImages.length > 0) {
    return listing.assetImages[0];
  }
  return CATEGORY_IMAGES[listing.category] || CATEGORY_IMAGES.other;
}

export function formatPriceLabel(listing) {
  if (listing.listingType === "lend") return "Free to borrow";
  if (listing.pricePerUnit > 0) {
    return `Rs. ${Number(listing.pricePerUnit).toLocaleString()} / ${listing.unit || "unit"}`;
  }
  return "Contact for pricing";
}

export function filterListings(listings, search, categoryId) {
  const q = (search || "").trim().toLowerCase();
  const pill = CATEGORY_PILLS.find((p) => p.id === categoryId) || CATEGORY_PILLS[0];

  return listings.filter((item) => {
    const catOk =
      pill.id === "all" || (pill.match && pill.match.includes(item.category));
    if (!catOk) return false;
    if (!q) return true;
    const hay = [
      item.title,
      item.lenderDisplayName,
      item.lenderArea,
      item.category,
    ]
      .join(" ")
      .toLowerCase();
    return hay.includes(q);
  });
}

function toMillis(ts) {
  if (!ts) return 0;
  if (typeof ts.toMillis === "function") return ts.toMillis();
  if (ts.seconds) return ts.seconds * 1000;
  return new Date(ts).getTime() || 0;
}

export function computeBorrowMetrics(incomingRequests, outgoingRequests) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const todayStr = now.toISOString().slice(0, 10);

  let earnedThisMonth = 0;
  for (const r of incomingRequests) {
    const done = [
      BORROW_STATUS.APPROVED,
      BORROW_STATUS.LEGACY_ACCEPTED,
      BORROW_STATUS.IN_USE,
      BORROW_STATUS.RETURNED_SETTLED,
      BORROW_STATUS.LEGACY_RETURNED,
    ].includes(r.status);
    if (!done) continue;
    if (toMillis(r.respondedAt || r.createdAt) < monthStart) continue;
    const qty = Number(r.item?.quantityRequested) || 0;
    const price =
      Number(r.terms?.agreedTotal) ||
      Number(r.item?.pricePerUnit) * qty ||
      0;
    earnedThisMonth += price;
  }

  const pendingIncoming = incomingRequests.filter(
    (r) => r.status === BORROW_STATUS.PENDING
  );

  const incomingToday = pendingIncoming.filter(
    (r) => r.eventContext?.eventDate === todayStr
  ).length;

  const activeLentOut = incomingRequests.filter((r) =>
    [BORROW_STATUS.APPROVED, BORROW_STATUS.LEGACY_ACCEPTED, BORROW_STATUS.IN_USE].includes(
      r.status
    )
  ).length;

  return {
    earnedThisMonth,
    incomingTodayCount: incomingToday || pendingIncoming.length,
    activeLentOut,
    pendingIncomingCount: pendingIncoming.length,
    outgoingActiveCount: outgoingRequests.filter((r) =>
      [BORROW_STATUS.PENDING, BORROW_STATUS.APPROVED, BORROW_STATUS.LEGACY_ACCEPTED, BORROW_STATUS.IN_USE].includes(
        r.status
      )
    ).length,
  };
}

export function outgoingStatusPill(status) {
  switch (status) {
    case BORROW_STATUS.PENDING:
      return {
        label: "Awaiting Peer Approval",
        className: "bg-amber-100 text-amber-800 border-amber-200",
      };
    case BORROW_STATUS.APPROVED:
    case BORROW_STATUS.LEGACY_ACCEPTED:
    case BORROW_STATUS.IN_USE:
      return {
        label: "Dispatched / Active in Use",
        className: "bg-emerald-100 text-emerald-800 border-emerald-200",
      };
    case BORROW_STATUS.RETURNED_SETTLED:
    case BORROW_STATUS.LEGACY_RETURNED:
      return {
        label: "Returned",
        className: "bg-slate-100 text-slate-700 border-slate-200",
      };
    case BORROW_STATUS.DECLINED:
    case BORROW_STATUS.CANCELLED:
      return {
        label: status === BORROW_STATUS.DECLINED ? "Declined" : "Cancelled",
        className: "bg-rose-50 text-rose-700 border-rose-200",
      };
    default:
      return { label: status, className: "bg-slate-100 text-slate-600" };
  }
}
