import {
  collection,
  doc,
  setDoc,
  updateDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  getDoc,
} from "firebase/firestore";
import { db } from "@/firebase";

const QUOTATIONS_COLLECTION = "quotations";
export const QUOTATION_STATUS = {
  PENDING: "pending_vendor_approval",
  CONFIRMED: "confirmed",
  DECLINED: "declined",
  COUNTER: "counter_offer",
};

/** @deprecated use QUOTATION_STATUS.PENDING */
export const INITIAL_STATUS = QUOTATION_STATUS.PENDING;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Maps Firestore quotation status → ERP table / drawer label.
 * @param {string} [firestoreStatus]
 * @returns {string}
 */
export function mapQuotationStatusToUi(firestoreStatus) {
  const s = String(firestoreStatus || "").toLowerCase().replace(/\s+/g, "_");
  if (s === QUOTATION_STATUS.CONFIRMED || s === "confirmed") {
    return "Confirmed";
  }
  if (s === QUOTATION_STATUS.DECLINED || s === "declined") {
    return "Declined";
  }
  if (s === QUOTATION_STATUS.COUNTER || s === "counter_offer" || s === "counter offer") {
    return "Counter Offer";
  }
  if (s === QUOTATION_STATUS.PENDING || s === "pending" || s === "quote_request") {
    return "Quote Request";
  }
  return "Quote Request";
}

/**
 * @param {string} uiStatus
 * @returns {boolean}
 */
export function isQuotationActionable(uiStatus) {
  const s = String(uiStatus || "").toLowerCase();
  return (
    s === "quote request" ||
    s === "pending" ||
    s === "counter offer"
  );
}

function assertCustomerQuotationPayload(payload) {
  if (!payload || typeof payload !== "object") {
    throw new Error("submitCustomerQuotation: payload must be a non-null object.");
  }

  const requiredStringFields = [
    ["userId", payload.userId],
    ["customerName", payload.customerName],
    ["targetVenueId", payload.targetVenueId],
    ["eventDate", payload.eventDate],
  ];

  for (const [field, value] of requiredStringFields) {
    if (typeof value !== "string" || !value.trim()) {
      throw new Error(`submitCustomerQuotation: "${field}" is required and must be a non-empty string.`);
    }
  }

  if (!DATE_PATTERN.test(payload.eventDate.trim())) {
    throw new Error('submitCustomerQuotation: "eventDate" must be formatted as YYYY-MM-DD.');
  }

  const guestCount = Number(payload.guestCount);
  if (!Number.isFinite(guestCount) || guestCount < 1) {
    throw new Error('submitCustomerQuotation: "guestCount" must be a positive number.');
  }

  if (payload.selectedMenu === undefined || payload.selectedMenu === null) {
    throw new Error('submitCustomerQuotation: "selectedMenu" is required.');
  }
}

export async function submitCustomerQuotation(payload) {
  try {
    assertCustomerQuotationPayload(payload);

    const quotationsRef = collection(db, QUOTATIONS_COLLECTION);
    const docRef = doc(quotationsRef);

    const quotationRecord = {
      quotationId: docRef.id,
      userId: payload.userId.trim(),
      customerName: payload.customerName.trim(),
      targetVenueId: payload.targetVenueId.trim(),
      eventDate: payload.eventDate.trim(),
      guestCount: Number(payload.guestCount),
      selectedMenu: payload.selectedMenu,
      status: QUOTATION_STATUS.PENDING,
      timestamp: serverTimestamp(),
    };

    if (payload.eventTitle) quotationRecord.eventTitle = String(payload.eventTitle).trim();
    if (payload.eventType) quotationRecord.eventType = String(payload.eventType).trim();
    if (payload.eventTime) quotationRecord.eventTime = String(payload.eventTime).trim();
    if (payload.eventLocation) quotationRecord.eventLocation = String(payload.eventLocation).trim();
    if (payload.selectedAddons) quotationRecord.selectedAddons = payload.selectedAddons;
    if (payload.financials) quotationRecord.financials = payload.financials;
    if (payload.source) quotationRecord.source = String(payload.source).trim();

    await setDoc(docRef, quotationRecord);

    return { quotationId: docRef.id };
  } catch (error) {
    console.error("[submitCustomerQuotation] Failed to persist quotation:", error);
    throw error;
  }
}

/**
 * Pending-only stream (analytics widgets). Bookings ERP should use listenToVenueQuotations.
 */
export function listenToIncomingQuotations(vendorSlug, callback, onError) {
  return listenToVenueQuotations(
    vendorSlug,
    (all) => {
      const pending = all.filter(
        (q) =>
          String(q.status || "").toLowerCase() === QUOTATION_STATUS.PENDING
      );
      callback(pending);
    },
    onError
  );
}

/**
 * All quotations for a venue slug — item stays in list when status changes.
 */
export function listenToVenueQuotations(vendorSlug, callback, onError) {
  if (typeof vendorSlug !== "string" || !vendorSlug.trim()) {
    const error = new Error(
      'listenToVenueQuotations: "vendorSlug" is required and must be a non-empty string.'
    );
    console.error("[listenToVenueQuotations]", error);
    if (typeof onError === "function") onError(error);
    return () => {};
  }

  if (typeof callback !== "function") {
    throw new Error('listenToVenueQuotations: "callback" must be a function.');
  }

  try {
    const quotationsRef = collection(db, QUOTATIONS_COLLECTION);
    const venueQuery = query(
      quotationsRef,
      where("targetVenueId", "==", vendorSlug.trim())
    );

    const unsubscribe = onSnapshot(
      venueQuery,
      (querySnapshot) => {
        const quotations = querySnapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        callback(quotations);
      },
      (error) => {
        console.error("[listenToVenueQuotations] Snapshot listener error:", error);
        if (typeof onError === "function") {
          onError(error);
        }
      }
    );

    return unsubscribe;
  } catch (error) {
    console.error("[listenToVenueQuotations] Failed to attach listener:", error);
    if (typeof onError === "function") {
      onError(error);
    }
    return () => {};
  }
}

/**
 * @param {string} docId
 * @param {string} status - use QUOTATION_STATUS values
 * @param {object} [extra]
 */
export async function updateQuotationStatus(docId, status, extra = {}) {
  if (!docId) throw new Error("updateQuotationStatus: docId is required.");
  const ref = doc(db, QUOTATIONS_COLLECTION, docId);
  await updateDoc(ref, {
    status,
    updatedAt: serverTimestamp(),
    ...extra,
  });
}

/**
 * @param {string} docId
 * @returns {Promise<object|null>}
 */
export async function getQuotationById(docId) {
  const snap = await getDoc(doc(db, QUOTATIONS_COLLECTION, docId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

/**
 * Real-time listener for a single quotation (user storefront / manage-event).
 */
export function listenToQuotationById(docId, callback, onError) {
  if (!docId) return () => {};
  const ref = doc(db, QUOTATIONS_COLLECTION, docId);
  return onSnapshot(
    ref,
    (snap) => {
      if (!snap.exists()) {
        callback(null);
        return;
      }
      callback({ id: snap.id, ...snap.data() });
    },
    (error) => {
      console.error("[listenToQuotationById]", error);
      if (typeof onError === "function") onError(error);
    }
  );
}

export function mapQuotationToBookingRow(quotation) {
  const menu = quotation.selectedMenu;
  const packageName =
    typeof menu === "object"
      ? menu?.packageName || menu?.name || "Quotation Request"
      : String(menu ?? "Quotation Request");
  const perPlatePrice =
    typeof menu === "object" ? Number(menu?.perPlatePrice) || 0 : 0;
  const guestCount = Number(quotation.guestCount) || 0;
  const financialsTotal = Number(quotation.financials?.grandTotal);
  const estimatedAmount =
    Number.isFinite(financialsTotal) && financialsTotal > 0
      ? financialsTotal
      : perPlatePrice > 0
        ? perPlatePrice * guestCount
        : 0;

  const uiStatus = mapQuotationStatusToUi(quotation.status);
  const isConfirmed =
    String(quotation.status || "").toLowerCase() === QUOTATION_STATUS.CONFIRMED;

  return {
    docId: quotation.id,
    id: quotation.quotationId || quotation.id,
    customer: {
      name: quotation.customerName || "Customer",
      email: quotation.eventLocation || quotation.userId || "Storefront Quotation",
      avatar: null,
    },
    service: packageName,
    bookedDate: "Today",
    eventDate: quotation.eventDate || "",
    timing: quotation.eventTime || "",
    status: isConfirmed ? "Confirmed / Scheduled" : uiStatus,
    source: "Online Portal",
    amount: estimatedAmount,
    isQuotation: true,
    raw: {
      quotationId: quotation.quotationId || quotation.id,
      userId: quotation.userId,
      targetVenueId: quotation.targetVenueId,
      firestoreStatus: quotation.status,
      eventDetails: {
        guests: guestCount,
        date: quotation.eventDate,
        timing: quotation.eventTime,
      },
      catering: {
        packageName,
        packageId: typeof menu === "object" ? menu?.packageId : undefined,
        perPlatePrice,
        dishes: typeof menu === "object" ? menu?.dishes || [] : [],
      },
      selectedMenu: menu,
      financials: quotation.financials,
      eventTitle: quotation.eventTitle,
      eventLocation: quotation.eventLocation,
    },
  };
}
