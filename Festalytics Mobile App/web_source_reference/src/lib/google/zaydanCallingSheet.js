/** Venue slug for Zaydan Banquet Hall in Firestore `venues` collection */
export const ZAYDAN_VENUE_SLUG = "zaydan-banquet-hall";

export const ZAYDAN_CALLING_SHEET_HEADERS = [
  "Record Type",
  "ID",
  "Client Name",
  "Contact / User",
  "Event Date",
  "Timing",
  "Guests",
  "Package",
  "Total (Rs)",
  "Origin",
  "Status",
  "Venue ID",
  "Last Updated",
];

/**
 * @param {object} quotation - Firestore quotation document
 * @returns {string[]}
 */
export function quotationToCallingRow(quotation) {
  const menu = quotation.selectedMenu;
  const packageName =
    typeof menu === "object"
      ? menu?.packageName || menu?.name || "—"
      : String(menu ?? "—");

  const total =
    quotation.financials?.grandTotal != null
      ? String(quotation.financials.grandTotal)
      : "0";

  return [
    "Quotation",
    quotation.quotationId || quotation.id || "—",
    quotation.customerName || "—",
    quotation.customerContact || quotation.userId || "—",
    quotation.eventDate || "—",
    quotation.eventTime || "—",
    String(quotation.guestCount ?? "—"),
    packageName,
    total,
    quotation.source || "Online Portal",
    quotation.status || "pending_vendor_approval",
    quotation.targetVenueId || ZAYDAN_VENUE_SLUG,
    new Date().toISOString(),
  ];
}

/**
 * @param {object} booking - Firestore booking document
 * @param {string} [docId]
 * @returns {string[]}
 */
export function bookingToCallingRow(booking, docId) {
  const isWalkIn =
    booking.bookingSource === "walk-in" ||
    booking.eventDetails?.source === "Walk-in ERP";

  return [
    isWalkIn ? "Walk-in Booking" : "Booking",
    booking.id || docId || "—",
    booking.customer?.name || "—",
    booking.customer?.contact || "—",
    booking.eventDetails?.date || "—",
    booking.eventDetails?.timing || "—",
    String(booking.eventDetails?.guests ?? "—"),
    booking.catering?.packageName || "—",
    String(booking.financials?.grandTotal ?? 0),
    isWalkIn ? "Walk-in ERP" : booking.bookingSource || booking.eventDetails?.source || "online",
    booking.status || "—",
    booking.targetVenueId || booking.eventDetails?.venueId || ZAYDAN_VENUE_SLUG,
    new Date().toISOString(),
  ];
}

/**
 * Client-side helper: append one row to Zaydan calling sheet (no-op if not Zaydan venue).
 * @param {string[]} row
 * @param {string} venueSlug
 */
export async function appendZaydanCallingRow(row, venueSlug) {
  if (venueSlug !== ZAYDAN_VENUE_SLUG) return { skipped: true };

  const res = await fetch("/api/zaydan-calling-sheet", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "append", rows: [row] }),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || "Failed to append to Zaydan calling sheet");
  }
  return data;
}

/**
 * Client-side helper: full replace sync of all Zaydan records.
 * @param {{ quotations?: object[], bookings?: object[] }} payload
 */
export async function syncAllZaydanToCallingSheet(payload) {
  const res = await fetch("/api/zaydan-calling-sheet", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "fullSync", ...payload }),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || "Failed to sync Zaydan calling sheet");
  }
  return data;
}
