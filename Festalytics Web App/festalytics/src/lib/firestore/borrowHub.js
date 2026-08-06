import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  query,
  where,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  getDocs,
} from "firebase/firestore";
import { db } from "@/firebase";

export const BORROW_REQUESTS_COLLECTION = "borrow_requests";
export const INVENTORY_LISTINGS_COLLECTION = "inventory_listings";

export const BORROW_STATUS = {
  PENDING: "pending_lender_approval",
  DECLINED: "declined",
  CANCELLED: "cancelled",
  APPROVED: "approved",
  IN_USE: "in_use",
  RETURNED_SETTLED: "returned_and_settled",
  ACCEPTED: "approved",
  RETURNED: "returned_and_settled",
  LEGACY_ACCEPTED: "accepted",
  LEGACY_RETURNED: "returned",
};

export const INVENTORY_CATEGORIES = [
  { id: "seating", label: "Seating" },
  { id: "power", label: "Power / Generators" },
  { id: "av", label: "Sound & AV" },
  { id: "decor", label: "Decor" },
  { id: "other", label: "Other" },
];

export const LISTING_TYPES = [
  { id: "lend", label: "Lend (free)" },
  { id: "rent", label: "Rent" },
  { id: "both", label: "Lend or rent" },
];

/**
 * @param {string} lenderVenueId
 * @param {string} itemId
 */
function sortByCreatedDesc(a, b) {
  const ta = a.createdAt?.toMillis?.() ?? a.createdAt?.seconds * 1000 ?? 0;
  const tb = b.createdAt?.toMillis?.() ?? b.createdAt?.seconds * 1000 ?? 0;
  return tb - ta;
}

export function listingDocId(lenderVenueId, itemId) {
  return `${lenderVenueId}_${itemId}`;
}

/**
 * @returns {string}
 */
export function generateInventoryItemId() {
  return `inv-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * @param {string} venueId
 * @param {object} item
 * @param {object} venueMeta
 */
function buildListingPayload(venueId, item, venueMeta = {}) {
  const profile = venueMeta.profile || {};
  const availableStockQuantity =
    Number(item.availableStockQuantity ?? item.quantityAvailable) || 0;
  const totalStockQuantity =
    Number(item.totalStockQuantity ?? item.quantityTotal) || 0;
  return {
    lenderVenueId: venueId,
    itemId: item.itemId,
    title: item.title,
    category: item.category || "other",
    availableStockQuantity,
    totalStockQuantity,
    quantityAvailable: availableStockQuantity,
    quantityTotal: totalStockQuantity,
    listingType: item.listingType || "lend",
    pricePerUnit: item.pricePerUnit ?? null,
    unit: item.unit || "units",
    assetImages: Array.isArray(item.assetImages) ? item.assetImages : [],
    assetVideoUrl: item.assetVideoUrl || "",
    b2bContactNumber:
      item.b2bContactNumber ||
      venueMeta.borrowHub?.contactPhone ||
      profile.phone_1 ||
      "",
    isActive: item.isActive !== false,
    borrowHubEnabled: venueMeta.borrowHub?.enabled === true,
    lenderDisplayName:
      venueMeta.borrowHub?.displayName ||
      venueMeta.name ||
      profile.hall_name ||
      venueId.replace(/-/g, " "),
    lenderArea: profile.area || venueMeta.city || "",
    lenderPhone: venueMeta.borrowHub?.contactPhone || profile.phone_1 || "",
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Sync flattened listings from venue inventory array.
 * @param {string} venueId
 * @param {object[]} inventory
 * @param {object} venueMeta
 */
export async function syncInventoryListings(venueId, inventory, venueMeta) {
  if (!venueId) return;

  const enabled = venueMeta?.borrowHub?.enabled === true;
  const activeItems = (inventory || []).filter((i) => i.isActive !== false);

  for (const item of activeItems) {
    if (!enabled) continue;
    const id = listingDocId(venueId, item.itemId);
    await setDoc(
      doc(db, INVENTORY_LISTINGS_COLLECTION, id),
      buildListingPayload(venueId, item, venueMeta),
      { merge: true }
    );
  }

  const snap = await getDocs(
    query(
      collection(db, INVENTORY_LISTINGS_COLLECTION),
      where("lenderVenueId", "==", venueId)
    )
  );
  const activeIds = new Set(
    enabled ? activeItems.map((i) => listingDocId(venueId, i.itemId)) : []
  );
  for (const d of snap.docs) {
    if (!activeIds.has(d.id)) {
      await deleteDoc(d.ref);
    }
  }
}

/**
 * Persist venue catalog + sync flattened inventory_listings for peer discovery.
 * @param {string} venueId
 * @param {{ inventory: object[], borrowHub: object, venueMeta?: object, forceEnable?: boolean }} opts
 */
export async function publishBorrowHubCatalog(
  venueId,
  { inventory, borrowHub, venueMeta = {}, forceEnable = false }
) {
  if (!venueId) throw new Error("Venue not found. Complete vendor onboarding first.");

  const nextHub = {
    ...borrowHub,
    ...(forceEnable ? { enabled: true } : {}),
    updatedAt: new Date().toISOString(),
  };

  const ref = doc(db, "venues", venueId);
  await setDoc(
    ref,
    {
      borrowableInventory: inventory,
      borrowHub: nextHub,
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );

  await syncInventoryListings(venueId, inventory, {
    ...venueMeta,
    borrowHub: nextHub,
    borrowableInventory: inventory,
  });

  return { borrowHub: nextHub };
}

/**
 * @param {string} venueId
 * @param {object} borrowHubSettings
 */
export async function saveBorrowHubSettings(venueId, borrowHubSettings) {
  const ref = doc(db, "venues", venueId);
  await setDoc(
    ref,
    {
      borrowHub: {
        ...borrowHubSettings,
        updatedAt: new Date().toISOString(),
      },
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );
}

/**
 * @param {string} venueId
 * @returns {Promise<{ venueMeta: object, inventory: object[], isNetworkParticipant: boolean }>}
 */
export async function fetchVenueInventorySnapshot(venueId) {
  if (!venueId) throw new Error("Venue not linked.");
  const snap = await getDoc(doc(db, "venues", venueId));
  if (!snap.exists()) throw new Error("Venue not found.");
  const data = snap.data();
  return {
    venueMeta: data,
    inventory: Array.isArray(data.borrowableInventory) ? data.borrowableInventory : [],
    isNetworkParticipant: data.isNetworkParticipant === true,
  };
}

export async function enableNetworkParticipation(venueId) {
  if (!venueId) throw new Error("Venue not linked.");
  await updateDoc(doc(db, "venues", venueId), {
    isNetworkParticipant: true,
    updatedAt: new Date().toISOString(),
  });

  const { venueMeta, inventory } = await fetchVenueInventorySnapshot(venueId);
  if (inventory.length > 0) {
    await saveBorrowableInventory(
      venueId,
      inventory,
      { ...venueMeta, isNetworkParticipant: true },
      { forceEnable: true }
    );
  }
}

/**
 * Appends one catalog item and syncs `inventory_listings` for Borrow Hub discovery.
 * @param {string} venueId
 * @param {object} item
 */
export async function appendBorrowableInventoryItem(venueId, item) {
  const { venueMeta, inventory, isNetworkParticipant } =
    await fetchVenueInventorySnapshot(venueId);
  const next = [...inventory, item];
  return saveBorrowableInventory(venueId, next, venueMeta, {
    forceEnable: isNetworkParticipant,
  });
}

/**
 * @param {string} venueId
 * @param {object[]} inventory
 * @param {object} venueMeta full venue for sync
 * @param {{ forceEnable?: boolean }} [opts]
 */
export async function saveBorrowableInventory(
  venueId,
  inventory,
  venueMeta,
  opts = {}
) {
  const borrowHub = {
    ...(venueMeta?.borrowHub || {}),
    ...(opts.forceEnable ? { enabled: true } : {}),
  };

  return publishBorrowHubCatalog(venueId, {
    inventory,
    borrowHub,
    venueMeta,
    forceEnable: opts.forceEnable === true,
  });
}

/**
 * Hub discovery — all active listings; exclude own venue client-side or in callback.
 * @param {string} excludeVenueId
 * @param {(listings: object[]) => void} callback
 * @param {(err: Error) => void} [onError]
 */
export function listenHubListings(excludeVenueId, callback, onError) {
  const q = query(
    collection(db, INVENTORY_LISTINGS_COLLECTION),
    where("isActive", "==", true)
  );

  const mapRows = (snap) =>
    snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((row) => row.borrowHubEnabled === true)
      .filter((row) => row.lenderVenueId && row.lenderVenueId !== excludeVenueId)
      .filter(
        (row) => (row.availableStockQuantity ?? row.quantityAvailable ?? 0) > 0
      );

  return onSnapshot(
    q,
    (snap) => callback(mapRows(snap)),
    (err) => {
      console.error("[listenHubListings]", err);
      if (onError) onError(err);
    }
  );
}

/**
 * @param {string} lenderVenueId
 * @param {(requests: object[]) => void} callback
 */
export function listenIncomingBorrowRequests(lenderVenueId, callback, onError) {
  if (!lenderVenueId) return () => {};

  const q = query(
    collection(db, BORROW_REQUESTS_COLLECTION),
    where("lenderVenueId", "==", lenderVenueId)
  );

  return onSnapshot(
    q,
    (snap) => {
      const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      rows.sort((a, b) => sortByCreatedDesc(a, b));
      callback(rows);
    },
    (err) => {
      console.error("[listenIncomingBorrowRequests]", err);
      if (onError) onError(err);
    }
  );
}

/**
 * @param {string} borrowerVenueId
 * @param {(requests: object[]) => void} callback
 */
export function listenOutgoingBorrowRequests(borrowerVenueId, callback, onError) {
  if (!borrowerVenueId) return () => {};

  const q = query(
    collection(db, BORROW_REQUESTS_COLLECTION),
    where("borrowerVenueId", "==", borrowerVenueId)
  );

  return onSnapshot(
    q,
    (snap) => {
      const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      rows.sort((a, b) => sortByCreatedDesc(a, b));
      callback(rows);
    },
    (err) => {
      console.error("[listenOutgoingBorrowRequests]", err);
      if (onError) onError(err);
    }
  );
}

/**
 * @param {object} params
 */
export async function createBorrowRequest(params) {
  const {
    borrowerVenueId,
    borrowerUserId,
    lenderVenueId,
    lenderOwnerId,
    item,
    eventContext,
    terms,
    borrowerDisplayName,
  } = params;

  if (!borrowerVenueId || !lenderVenueId || !item?.itemId) {
    throw new Error("Missing required borrow request fields.");
  }
  if (borrowerVenueId === lenderVenueId) {
    throw new Error("You cannot borrow from your own venue.");
  }

  const qty = Number(item.quantityRequested) || 0;
  if (qty < 1) throw new Error("Quantity must be at least 1.");

  const listingRef = doc(
    db,
    INVENTORY_LISTINGS_COLLECTION,
    listingDocId(lenderVenueId, item.itemId)
  );
  const listingSnap = await getDoc(listingRef);
  if (!listingSnap.exists()) {
    throw new Error("This item is no longer listed on the Borrow Hub.");
  }
  const listing = listingSnap.data();
  const available =
    Number(listing.availableStockQuantity ?? listing.quantityAvailable) || 0;
  if (available < qty) {
    throw new Error(
      `Only ${available} available right now.`
    );
  }

  const payload = {
    requestId: null,
    status: BORROW_STATUS.PENDING,
    borrowerVenueId,
    lenderVenueId,
    borrowerUserId,
    lenderOwnerId: lenderOwnerId || null,
    borrowerDisplayName: borrowerDisplayName || borrowerVenueId,
    lenderDisplayName: listing.lenderDisplayName || lenderVenueId,
    item: {
      itemId: item.itemId,
      title: item.title || listing.title,
      category: item.category || listing.category,
      quantityRequested: qty,
      listingType: item.listingType || listing.listingType,
      pricePerUnit: item.pricePerUnit ?? listing.pricePerUnit ?? null,
      unit: item.unit || listing.unit || "units",
    },
    eventContext: {
      eventDate: eventContext?.eventDate || "",
      eventTiming: eventContext?.eventTiming || null,
      linkedBookingId: eventContext?.linkedBookingId || null,
      urgency: eventContext?.urgency || "planned",
      notes: eventContext?.notes || "",
    },
    terms: {
      mode:
        terms?.mode ||
        (listing.listingType === "rent" ? "rent" : "lend"),
      agreedTotal: terms?.agreedTotal ?? null,
      currency: "PKR",
      returnBy: terms?.returnBy || null,
      pickupBy: terms?.pickupBy || null,
      transportResponsibility: terms?.transportResponsibility || "borrower",
    },
    activityLog: [
      {
        at: new Date().toISOString(),
        actorVenueId: borrowerVenueId,
        action: "created",
        message: "Borrow request submitted.",
      },
    ],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    respondedAt: null,
    handedOverAt: null,
    returnedAt: null,
    cancelledAt: null,
    respondedByUserId: null,
    cancelledBy: null,
    declineReason: null,
  };

  const ref = await addDoc(collection(db, BORROW_REQUESTS_COLLECTION), payload);
  await updateDoc(ref, { requestId: ref.id });
  return { requestId: ref.id };
}

function appendLog(existing, entry) {
  return [...(existing || []), entry];
}

/**
 * @param {string} requestId
 * @param {string} lenderVenueId
 * @param {string} userId
 */
export async function acceptBorrowRequest(requestId, lenderVenueId, userId) {
  const requestRef = doc(db, BORROW_REQUESTS_COLLECTION, requestId);

  await runTransaction(db, async (tx) => {
    const reqSnap = await tx.get(requestRef);
    if (!reqSnap.exists()) throw new Error("Request not found.");
    const req = reqSnap.data();
    if (req.lenderVenueId !== lenderVenueId) {
      throw new Error("Not authorized to accept this request.");
    }
    if (req.status !== BORROW_STATUS.PENDING) {
      throw new Error("Request is no longer pending.");
    }

    const qty = Number(req.item?.quantityRequested) || 0;
    const itemId = req.item?.itemId;
    const listingRef = doc(
      db,
      INVENTORY_LISTINGS_COLLECTION,
      listingDocId(lenderVenueId, itemId)
    );
    const venueRef = doc(db, "venues", lenderVenueId);

    const listingSnap = await tx.get(listingRef);
    const venueSnap = await tx.get(venueRef);

    if (!listingSnap.exists()) throw new Error("Listing not found.");
    const listing = listingSnap.data();
    const available =
      Number(listing.availableStockQuantity ?? listing.quantityAvailable) || 0;
    if (available < qty) {
      throw new Error(`Insufficient stock. Only ${available} available.`);
    }

    tx.update(listingRef, {
      availableStockQuantity: available - qty,
      quantityAvailable: available - qty,
      updatedAt: new Date().toISOString(),
    });

    if (venueSnap.exists()) {
      const venue = venueSnap.data();
      const inventory = (venue.borrowableInventory || []).map((inv) => {
        if (inv.itemId === itemId) {
          const current = Number(
            inv.availableStockQuantity ?? inv.quantityAvailable
          ) || 0;
          const next = Math.max(0, current - qty);
          return {
            ...inv,
            availableStockQuantity: next,
            quantityAvailable: next,
            updatedAt: new Date().toISOString(),
          };
        }
        return inv;
      });
      tx.update(venueRef, {
        borrowableInventory: inventory,
        updatedAt: new Date().toISOString(),
      });
    }

    tx.update(requestRef, {
      status: BORROW_STATUS.ACCEPTED,
      respondedAt: serverTimestamp(),
      respondedByUserId: userId,
      updatedAt: serverTimestamp(),
      activityLog: appendLog(req.activityLog, {
        at: new Date().toISOString(),
        actorVenueId: lenderVenueId,
        action: "approved",
        message: "Lender approved and allocated stock.",
      }),
    });
  });
}

/**
 * @param {string} requestId
 * @param {string} lenderVenueId
 * @param {string} userId
 * @param {string} [declineReason]
 */
export async function declineBorrowRequest(
  requestId,
  lenderVenueId,
  userId,
  declineReason = ""
) {
  const ref = doc(db, BORROW_REQUESTS_COLLECTION, requestId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("Request not found.");
  const req = snap.data();
  if (req.lenderVenueId !== lenderVenueId) throw new Error("Not authorized.");
  if (req.status !== BORROW_STATUS.PENDING) {
    throw new Error("Only pending requests can be declined.");
  }

  await updateDoc(ref, {
    status: BORROW_STATUS.DECLINED,
    declineReason,
    respondedAt: serverTimestamp(),
    respondedByUserId: userId,
    updatedAt: serverTimestamp(),
    activityLog: appendLog(req.activityLog, {
      at: new Date().toISOString(),
      actorVenueId: lenderVenueId,
      action: "declined",
      message: declineReason || "Request declined.",
    }),
  });
}

/**
 * @param {string} requestId
 * @param {string} borrowerVenueId
 */
export async function cancelBorrowRequest(requestId, borrowerVenueId) {
  const ref = doc(db, BORROW_REQUESTS_COLLECTION, requestId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("Request not found.");
  const req = snap.data();
  if (req.borrowerVenueId !== borrowerVenueId) throw new Error("Not authorized.");
  if (req.status !== BORROW_STATUS.PENDING) {
    throw new Error("Only pending requests can be cancelled.");
  }

  await updateDoc(ref, {
    status: BORROW_STATUS.CANCELLED,
    cancelledAt: serverTimestamp(),
    cancelledBy: "borrower",
    updatedAt: serverTimestamp(),
    activityLog: appendLog(req.activityLog, {
      at: new Date().toISOString(),
      actorVenueId: borrowerVenueId,
      action: "cancelled",
      message: "Borrower cancelled the request.",
    }),
  });
}

async function restoreInventory(tx, lenderVenueId, itemId, qty) {
  const listingRef = doc(
    db,
    INVENTORY_LISTINGS_COLLECTION,
    listingDocId(lenderVenueId, itemId)
  );
  const venueRef = doc(db, "venues", lenderVenueId);

  const listingSnap = await tx.get(listingRef);
  const venueSnap = await tx.get(venueRef);

  if (listingSnap.exists()) {
    const listing = listingSnap.data();
    const current =
      Number(listing.availableStockQuantity ?? listing.quantityAvailable) || 0;
    tx.update(listingRef, {
      availableStockQuantity: current + qty,
      quantityAvailable: current + qty,
      updatedAt: new Date().toISOString(),
    });
  }

  if (venueSnap.exists()) {
    const venue = venueSnap.data();
    const inventory = (venue.borrowableInventory || []).map((inv) => {
      if (inv.itemId === itemId) {
        const total =
          Number(inv.totalStockQuantity ?? inv.quantityTotal) || 0;
        const current = Number(
          inv.availableStockQuantity ?? inv.quantityAvailable
        ) || 0;
        const next = Math.min(
          total || Infinity,
          current + qty
        );
        return {
          ...inv,
          availableStockQuantity: next,
          quantityAvailable: next,
          updatedAt: new Date().toISOString(),
        };
      }
      return inv;
    });
    tx.update(venueRef, {
      borrowableInventory: inventory,
      updatedAt: new Date().toISOString(),
    });
  }
}

/**
 * @param {string} requestId
 * @param {string} actorVenueId
 */
export async function markBorrowRequestInUse(requestId, actorVenueId) {
  const ref = doc(db, BORROW_REQUESTS_COLLECTION, requestId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("Request not found.");
  const req = snap.data();
  const allowed =
    req.borrowerVenueId === actorVenueId || req.lenderVenueId === actorVenueId;
  if (!allowed) throw new Error("Not authorized.");
  if (![BORROW_STATUS.APPROVED, BORROW_STATUS.LEGACY_ACCEPTED].includes(req.status)) {
    throw new Error("Request must be approved first.");
  }

  await updateDoc(ref, {
    status: BORROW_STATUS.IN_USE,
    handedOverAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    activityLog: appendLog(req.activityLog, {
      at: new Date().toISOString(),
      actorVenueId,
      action: "in_use",
      message: "Item marked as handed over / in use.",
    }),
  });
}

/**
 * @param {string} requestId
 * @param {string} actorVenueId
 */
export async function markBorrowRequestReturned(requestId, actorVenueId) {
  const requestRef = doc(db, BORROW_REQUESTS_COLLECTION, requestId);

  await runTransaction(db, async (tx) => {
    const reqSnap = await tx.get(requestRef);
    if (!reqSnap.exists()) throw new Error("Request not found.");
    const req = reqSnap.data();
    const allowed =
      req.borrowerVenueId === actorVenueId || req.lenderVenueId === actorVenueId;
    if (!allowed) throw new Error("Not authorized.");
    if (
      ![
        BORROW_STATUS.IN_USE,
        BORROW_STATUS.APPROVED,
        BORROW_STATUS.LEGACY_ACCEPTED,
      ].includes(req.status)
    ) {
      throw new Error("Request must be in use or approved to mark returned.");
    }

    const qty = Number(req.item?.quantityRequested) || 0;
    const itemId = req.item?.itemId;
    const lenderVenueId = req.lenderVenueId;

    if (
      [
        BORROW_STATUS.IN_USE,
        BORROW_STATUS.APPROVED,
        BORROW_STATUS.LEGACY_ACCEPTED,
      ].includes(req.status)
    ) {
      await restoreInventory(tx, lenderVenueId, itemId, qty);
    }

    tx.update(requestRef, {
      status: BORROW_STATUS.RETURNED_SETTLED,
      returnedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      activityLog: appendLog(req.activityLog, {
        at: new Date().toISOString(),
        actorVenueId,
        action: "returned_and_settled",
        message: "Item marked returned and stock settled.",
      }),
    });
  });
}

/**
 * @param {string} status
 */
export function borrowStatusLabel(status) {
  const map = {
    [BORROW_STATUS.PENDING]: "Pending approval",
    [BORROW_STATUS.DECLINED]: "Declined",
    [BORROW_STATUS.CANCELLED]: "Cancelled",
    [BORROW_STATUS.APPROVED]: "Approved",
    [BORROW_STATUS.IN_USE]: "In use",
    [BORROW_STATUS.RETURNED_SETTLED]: "Returned & settled",
    [BORROW_STATUS.LEGACY_ACCEPTED]: "Approved",
    [BORROW_STATUS.LEGACY_RETURNED]: "Returned & settled",
  };
  return map[status] || status;
}
