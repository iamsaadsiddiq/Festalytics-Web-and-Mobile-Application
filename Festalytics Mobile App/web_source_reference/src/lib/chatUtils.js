/**
 * Deterministic chat room id: chat_{venueSlug}_{customerUserId}
 */
export function buildChatId(venueSlug, customerUserId) {
  if (!venueSlug || !customerUserId) {
    throw new Error("venueSlug and customerUserId are required to build a chat id.");
  }
  return `chat_${venueSlug}_${customerUserId}`;
}

export function formatChatRelativeTime(timestamp) {
  if (!timestamp) return "";
  const date =
    typeof timestamp?.toDate === "function"
      ? timestamp.toDate()
      : timestamp instanceof Date
        ? timestamp
        : new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "";

  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) {
    return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  }
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function formatMessageTime(timestamp) {
  if (!timestamp) return "";
  const date =
    typeof timestamp?.toDate === "function"
      ? timestamp.toDate()
      : timestamp instanceof Date
        ? timestamp
        : new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export function counterOfferStatusLabel(status) {
  const s = String(status || "pending_customer_response").toLowerCase();
  if (s === "accepted") return "Accepted";
  if (s === "rejected") return "Rejected";
  return "Pending Customer Response";
}

export function mapChatRoomToSidebarThread(room) {
  const unread = Number(room.unreadByVendor || 0) > 0;
  const hasPendingCounterOffer = Boolean(room.hasPendingCounterOffer);
  const lastSenderRole = room.lastSenderRole || null;

  return {
    id: room.id,
    chatId: room.id,
    name: room.customerName || "Customer",
    avatar: room.customerAvatar || null,
    lastMessage: room.lastMessage || "No messages yet",
    time: formatChatRelativeTime(room.lastMessageTimestamp),
    subject: room.subject || "Event inquiry",
    unread,
    archived: Boolean(room.archivedByVendor),
    hasPendingCounterOffer,
    lastSenderRole,
    pendingQuery:
      hasPendingCounterOffer || (unread && lastSenderRole === "customer"),
    customerId: room.customerId,
    venueSlug: room.venueSlug,
    bookingRef: room.bookingRef || null,
  };
}

export function mapFirestoreMessageToUi(msg, { venueSlug, customerName, customerAvatar }) {
  const isSystem = msg.type === "system" || msg.senderId === "system";
  const isVendor =
    !isSystem &&
    (msg.senderId === venueSlug ||
      msg.senderRole === "vendor" ||
      msg.type === "counter_offer");

  if (msg.type === "counter_offer") {
    return {
      id: msg.id,
      type: "counter_offer",
      sender: isVendor ? "vendor" : "customer",
      senderId: msg.senderId,
      time: formatMessageTime(msg.timestamp),
      timestamp: msg.timestamp,
      counterOffer: msg.counterOffer || {},
    };
  }

  return {
    id: msg.id,
    type: msg.type || "text",
    sender: isSystem ? "system" : isVendor ? "vendor" : "customer",
    senderId: msg.senderId,
    text: msg.text || "",
    time: formatMessageTime(msg.timestamp),
    timestamp: msg.timestamp,
    customerName,
    customerAvatar,
  };
}
