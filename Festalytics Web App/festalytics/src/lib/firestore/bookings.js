import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/firebase";

const BOOKINGS_COLLECTION = "bookings";

/**
 * @param {string} docId
 * @param {object} data
 * @returns {object}
 */
export function mapBookingDocToRow(docId, data) {
  const isWalkIn =
    data.bookingSource === "walk-in" ||
    data.eventDetails?.source === "Walk-in ERP";

  const source = isWalkIn
    ? "Walk-in ERP"
    : data.bookingSource === "online" || data.eventDetails?.source === "Online Portal"
    ? "Online Portal"
    : data.bookingSource || data.eventDetails?.source || "Online Portal";

  return {
    docId,
    id: data.id || docId,
    customer: {
      name: data.customer?.name || "Client",
      email: data.customer?.contact || "No Email",
      avatar: null,
    },
    service: data.eventDetails?.category || "Wedding Event",
    bookedDate: data.bookedDate || "Today",
    eventDate: data.eventDetails?.date || "",
    timing: data.eventDetails?.timing || "",
    status: data.status || "Confirmed",
    source,
    amount: data.financials?.grandTotal || 0,
    isWalkIn,
    raw: data,
  };
}

/**
 * Persists a walk-in booking to root collection `bookings` (auto-generated doc ID).
 * Binds the venue slug on both `targetVenueId` and `eventDetails.venueId`.
 *
 * @param {string} venueSlug - e.g. "zaydan-banquet-hall"
 * @param {object} bookingPayload
 * @returns {Promise<{ bookingDocId: string }>}
 */
export async function submitWalkInBooking(venueSlug, bookingPayload) {
  if (typeof venueSlug !== "string" || !venueSlug.trim()) {
    throw new Error('submitWalkInBooking: "venueSlug" is required.');
  }
  if (!bookingPayload || typeof bookingPayload !== "object") {
    throw new Error("submitWalkInBooking: bookingPayload is required.");
  }

  try {
    const slug = venueSlug.trim();
    const record = {
      ...bookingPayload,
      targetVenueId: slug,
      eventDetails: {
        ...bookingPayload.eventDetails,
        venueId: slug,
      },
      timestamp: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, BOOKINGS_COLLECTION), record);
    return { bookingDocId: docRef.id };
  } catch (error) {
    console.error("[submitWalkInBooking] Failed to persist booking:", error);
    throw error;
  }
}

/**
 * Real-time stream of bookings for a venue (walk-in and other) by `targetVenueId`.
 *
 * @param {string} venueSlug
 * @param {(rows: object[]) => void} callback
 * @param {(error: Error) => void} [onError]
 * @returns {() => void}
 */
export function listenToVenueBookings(venueSlug, callback, onError) {
  if (typeof venueSlug !== "string" || !venueSlug.trim()) {
    const error = new Error(
      'listenToVenueBookings: "venueSlug" is required and must be a non-empty string.'
    );
    console.error("[listenToVenueBookings]", error);
    if (typeof onError === "function") onError(error);
    return () => {};
  }

  if (typeof callback !== "function") {
    throw new Error('listenToVenueBookings: "callback" must be a function.');
  }

  try {
    const bookingsQuery = query(
      collection(db, BOOKINGS_COLLECTION),
      where("targetVenueId", "==", venueSlug.trim())
    );

    return onSnapshot(
      bookingsQuery,
      (querySnapshot) => {
        const rows = querySnapshot.docs.map((d) =>
          mapBookingDocToRow(d.id, d.data())
        );
        callback(rows);
      },
      (error) => {
        console.error("[listenToVenueBookings] Snapshot listener error:", error);
        if (typeof onError === "function") onError(error);
      }
    );
  } catch (error) {
    console.error("[listenToVenueBookings] Failed to attach listener:", error);
    if (typeof onError === "function") onError(error);
    return () => {};
  }
}

/**
 * Loads older booking documents that only stored venue on eventDetails.venueId.
 * @param {string} venueSlug
 * @returns {Promise<object[]>}
 */
export async function fetchLegacyVenueBookings(venueSlug) {
  const slug = venueSlug?.trim();
  if (!slug) return [];

  try {
    const snap = await getDocs(collection(db, BOOKINGS_COLLECTION));
    const rows = [];
    snap.forEach((docSnap) => {
      const data = docSnap.data();
      const matchesVenue =
        data.targetVenueId === slug || data.eventDetails?.venueId === slug;
      if (matchesVenue && !data.targetVenueId) {
        rows.push(mapBookingDocToRow(docSnap.id, data));
      }
    });
    return rows;
  } catch (error) {
    console.error("[fetchLegacyVenueBookings] Failed to load legacy bookings:", error);
    throw error;
  }
}
