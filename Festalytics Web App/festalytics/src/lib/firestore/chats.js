import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  addDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  increment,
} from "firebase/firestore";
import { db } from "@/firebase";
import { buildChatId } from "@/lib/chatUtils";

const CHATS_COLLECTION = "chats";

export { buildChatId };

export const COUNTER_OFFER_STATUS = {
  PENDING: "pending_customer_response",
  ACCEPTED: "accepted",
  REJECTED: "rejected",
};

function timestampToMs(value) {
  if (!value) return 0;
  if (typeof value.toMillis === "function") return value.toMillis();
  if (typeof value.seconds === "number") return value.seconds * 1000;
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

/** Sort inbox rooms newest-first (client-side; avoids composite index until deployed). */
export function sortChatRoomsByLastMessage(rooms) {
  return [...rooms].sort(
    (a, b) => timestampToMs(b.lastMessageTimestamp) - timestampToMs(a.lastMessageTimestamp)
  );
}

/**
 * @param {string} venueSlug
 * @param {(rooms: object[]) => void} callback
 * @param {(err: Error) => void} [onError]
 */
export function listenVendorInbox(venueSlug, callback, onError) {
  if (!venueSlug) {
    if (typeof onError === "function") {
      onError(new Error("venueSlug is required for inbox listener."));
    }
    return () => {};
  }

  // Equality filter only — no composite index required. Sort in memory.
  const inboxQuery = query(
    collection(db, CHATS_COLLECTION),
    where("venueSlug", "==", venueSlug)
  );

  return onSnapshot(
    inboxQuery,
    (snap) => {
      const rooms = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      callback(sortChatRoomsByLastMessage(rooms));
    },
    (err) => {
      console.error("[listenVendorInbox]", err);
      if (typeof onError === "function") onError(err);
    }
  );
}

/**
 * @param {string} chatId
 * @param {(messages: object[]) => void} callback
 * @param {(err: Error) => void} [onError]
 */
function sortMessagesChronologically(messages) {
  return [...messages].sort((a, b) => {
    const ta = timestampToMs(a.timestamp);
    const tb = timestampToMs(b.timestamp);
    if (ta !== tb) return ta - tb;
    return String(a.id).localeCompare(String(b.id));
  });
}

export function listenChatMessages(chatId, callback, onError) {
  if (!chatId) return () => {};

  const messagesRef = collection(db, CHATS_COLLECTION, chatId, "messages");

  return onSnapshot(
    messagesRef,
    (snap) => {
      const messages = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      callback(sortMessagesChronologically(messages));
    },
    (err) => {
      console.error("[listenChatMessages]", err);
      if (typeof onError === "function") onError(err);
    }
  );
}

/**
 * @param {object} params
 */
export async function ensureChatRoom({
  chatId,
  venueSlug,
  customerId,
  customerName,
  subject,
  bookingRef,
  customerAvatar,
}) {
  const id = chatId || buildChatId(venueSlug, customerId);
  const ref = doc(db, CHATS_COLLECTION, id);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    await setDoc(ref, {
      chatId: id,
      venueSlug,
      customerId,
      customerName: customerName || "Customer",
      customerAvatar: customerAvatar || null,
      subject: subject || "Event inquiry",
      bookingRef: bookingRef || null,
      lastMessage: "",
      lastMessageTimestamp: serverTimestamp(),
      unreadByVendor: 0,
      unreadByCustomer: 0,
      archivedByVendor: false,
      hasPendingCounterOffer: false,
      lastSenderRole: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } else {
    await updateDoc(ref, {
      venueSlug,
      customerId,
      customerName: customerName || snap.data().customerName || "Customer",
      ...(bookingRef ? { bookingRef } : {}),
      updatedAt: serverTimestamp(),
    });
  }

  return id;
}

/**
 * @param {object} params
 */
export async function sendTextMessage({
  chatId,
  senderId,
  text,
  senderRole,
}) {
  if (!chatId || !senderId || !text?.trim()) {
    throw new Error("chatId, senderId, and text are required.");
  }

  const trimmed = text.trim();
  const roomRef = doc(db, CHATS_COLLECTION, chatId);

  try {
    await addDoc(collection(db, CHATS_COLLECTION, chatId, "messages"), {
      type: "text",
      senderId,
      senderRole: senderRole || "customer",
      text: trimmed,
      timestamp: serverTimestamp(),
    });

    const roomPatch = {
      lastMessage: trimmed.slice(0, 200),
      lastMessageTimestamp: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastSenderRole: senderRole === "vendor" ? "vendor" : "customer",
    };

    if (senderRole === "vendor") {
      roomPatch.unreadByCustomer = increment(1);
      roomPatch.unreadByVendor = 0;
    } else {
      roomPatch.unreadByVendor = increment(1);
      roomPatch.unreadByCustomer = 0;
    }

    await updateDoc(roomRef, roomPatch);
  } catch (error) {
    console.error("[sendTextMessage]", error);
    throw error;
  }
}

/**
 * Vendor sends a structured counter-offer card into the thread.
 */
export async function sendCounterOfferMessage({
  chatId,
  venueSlug,
  counterOffer,
}) {
  if (!chatId || !venueSlug) throw new Error("chatId and venueSlug are required.");

  const payload = {
    bookingRefId: counterOffer.bookingRefId || "",
    revisedGuestPrice: Number(counterOffer.revisedGuestPrice) || 0,
    status: COUNTER_OFFER_STATUS.PENDING,
    quotationId: counterOffer.quotationId || null,
    guestCount: counterOffer.guestCount ?? null,
  };

  const preview = `Counter offer: Rs. ${payload.revisedGuestPrice.toLocaleString("en-PK")}`;

  try {
    await addDoc(collection(db, CHATS_COLLECTION, chatId, "messages"), {
      type: "counter_offer",
      senderId: venueSlug,
      senderRole: "vendor",
      text: preview,
      counterOffer: payload,
      timestamp: serverTimestamp(),
    });

    await updateDoc(doc(db, CHATS_COLLECTION, chatId), {
      lastMessage: preview,
      lastMessageTimestamp: serverTimestamp(),
      unreadByCustomer: increment(1),
      unreadByVendor: 0,
      hasPendingCounterOffer: true,
      lastSenderRole: "vendor",
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("[sendCounterOfferMessage]", error);
    throw error;
  }
}

/**
 * Customer accepts or rejects a counter-offer message.
 */
export async function respondToCounterOffer({
  chatId,
  messageId,
  status,
  customerId,
}) {
  const allowed = [COUNTER_OFFER_STATUS.ACCEPTED, COUNTER_OFFER_STATUS.REJECTED];
  if (!allowed.includes(status)) {
    throw new Error("status must be accepted or rejected.");
  }

  const messageRef = doc(db, CHATS_COLLECTION, chatId, "messages", messageId);
  const roomRef = doc(db, CHATS_COLLECTION, chatId);

  try {
    const msgSnap = await getDoc(messageRef);
    if (!msgSnap.exists() || msgSnap.data().type !== "counter_offer") {
      throw new Error("Counter offer message not found.");
    }

    const existing = msgSnap.data().counterOffer || {};
    await updateDoc(messageRef, {
      counterOffer: {
        ...existing,
        status,
        respondedAt: new Date().toISOString(),
        respondedBy: customerId,
      },
    });

    const statusText =
      status === COUNTER_OFFER_STATUS.ACCEPTED ? "accepted" : "rejected";

    await addDoc(collection(db, CHATS_COLLECTION, chatId, "messages"), {
      type: "system",
      senderId: "system",
      text: `Customer ${statusText} the counter offer (${existing.bookingRefId || "booking"}).`,
      timestamp: serverTimestamp(),
    });

    await updateDoc(roomRef, {
      lastMessage: `Counter offer ${statusText}`,
      lastMessageTimestamp: serverTimestamp(),
      unreadByVendor: increment(1),
      unreadByCustomer: 0,
      hasPendingCounterOffer: false,
      lastSenderRole: "system",
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("[respondToCounterOffer]", error);
    throw error;
  }
}

export async function markVendorInboxRead(chatId) {
  if (!chatId) return;
  try {
    await updateDoc(doc(db, CHATS_COLLECTION, chatId), {
      unreadByVendor: 0,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("[markVendorInboxRead]", error);
    throw error;
  }
}

export async function setChatArchived(chatId, archived = true) {
  if (!chatId) return;
  try {
    await updateDoc(doc(db, CHATS_COLLECTION, chatId), {
      archivedByVendor: Boolean(archived),
      updatedAt: serverTimestamp(),
      ...(archived ? { unreadByVendor: 0 } : {}),
    });
  } catch (error) {
    console.error("[setChatArchived]", error);
    throw error;
  }
}

export async function markCustomerInboxRead(chatId) {
  if (!chatId) return;
  try {
    await updateDoc(doc(db, CHATS_COLLECTION, chatId), {
      unreadByCustomer: 0,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("[markCustomerInboxRead]", error);
    throw error;
  }
}
