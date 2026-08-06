"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import ChatSidebar from "@/components/vendor/messages/ChatSidebar";
import ChatThread from "@/components/vendor/messages/ChatThread";
import ChatQuickReplies from "@/components/vendor/messages/ChatQuickReplies";
import ComposeChatModal from "@/components/vendor/messages/ComposeChatModal";
import { useVendorVenue } from "@/hooks/useVendorVenue";
import { useVendorInbox } from "@/hooks/useVendorInbox";
import { useChatMessages } from "@/hooks/useChatMessages";
import {
  ensureChatRoom,
  markVendorInboxRead,
  sendTextMessage,
  setChatArchived,
} from "@/lib/firestore/chats";
import { buildChatId } from "@/lib/chatUtils";
import { INBOX_FILTERS, filterInboxThreads } from "@/lib/messageInboxFilters";

const MessagesPage = () => {
  const { venueId, isLoading: venueLoading } = useVendorVenue();
  const { threads, loading: inboxLoading, error: inboxError } = useVendorInbox(venueId);
  const [activeThread, setActiveThread] = useState(null);
  const [sending, setSending] = useState(false);
  const [actionPending, setActionPending] = useState(false);
  const [handoffDone, setHandoffDone] = useState(false);
  const [inboxFilter, setInboxFilter] = useState(INBOX_FILTERS.ALL);
  const [composeOpen, setComposeOpen] = useState(false);
  const [toast, setToast] = useState(null);

  const activeChatId = activeThread?.chatId || activeThread?.id || null;

  const filteredThreads = useMemo(
    () => filterInboxThreads(threads, inboxFilter),
    [threads, inboxFilter]
  );

  const { messages, loading: messagesLoading, error: messagesError } = useChatMessages(
    activeChatId,
    {
      venueSlug: venueId,
      customerName: activeThread?.name,
      customerAvatar: activeThread?.avatar,
    }
  );

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  useEffect(() => {
    if (handoffDone || venueLoading || !venueId) return;

    const chatReq = localStorage.getItem("activeChatThread");
    if (!chatReq) {
      setHandoffDone(true);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const parsed = JSON.parse(chatReq);
        localStorage.removeItem("activeChatThread");

        const customerId = parsed.customerId;
        if (!customerId) {
          setHandoffDone(true);
          return;
        }

        const chatId =
          parsed.chatId || buildChatId(parsed.venueSlug || venueId, customerId);

        await ensureChatRoom({
          chatId,
          venueSlug: parsed.venueSlug || venueId,
          customerId,
          customerName: parsed.name || parsed.customerName || "Customer",
          subject: parsed.subject || `Booking #${parsed.bookingId || "—"} Discussion`,
          bookingRef: parsed.bookingId || parsed.bookingRef || null,
          customerAvatar: parsed.avatar || null,
        });

        if (cancelled) return;

        setInboxFilter(INBOX_FILTERS.ALL);
        setActiveThread({
          id: chatId,
          chatId,
          name: parsed.name || parsed.customerName || "Customer",
          avatar: parsed.avatar || null,
          lastMessage: parsed.lastMessage || "Conversation started",
          time: "Just now",
          subject: parsed.subject || `Booking #${parsed.bookingId || "—"} Discussion`,
          unread: false,
          archived: false,
          customerId,
          venueSlug: parsed.venueSlug || venueId,
          bookingRef: parsed.bookingId || null,
        });
      } catch (e) {
        console.error("[MessagesPage] chat handoff:", e);
      } finally {
        if (!cancelled) setHandoffDone(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [venueId, venueLoading, handoffDone]);

  useEffect(() => {
    if (!handoffDone || activeThread || inboxLoading) return;
    if (filteredThreads.length > 0) {
      setActiveThread(filteredThreads[0]);
    } else {
      setActiveThread(null);
    }
  }, [handoffDone, activeThread, inboxLoading, filteredThreads]);

  useEffect(() => {
    if (!activeThread) return;
    const stillVisible = filteredThreads.some(
      (t) => (t.chatId || t.id) === (activeThread.chatId || activeThread.id)
    );
    if (!stillVisible) {
      setActiveThread(filteredThreads[0] || null);
    }
  }, [filteredThreads, activeThread]);

  const handleSelectThread = useCallback(
    async (thread) => {
      setActiveThread(thread);
      const chatId = thread.chatId || thread.id;
      if (!chatId) return;
      try {
        await markVendorInboxRead(chatId);
      } catch (err) {
        console.error("[MessagesPage] mark read:", err);
      }
    },
    []
  );

  const handleSendMessage = useCallback(
    async (text) => {
      if (!activeChatId || !venueId || !text?.trim()) return;

      setSending(true);
      try {
        await sendTextMessage({
          chatId: activeChatId,
          senderId: venueId,
          text,
          senderRole: "vendor",
        });
      } catch (err) {
        console.error("[MessagesPage] send:", err);
        showToast("Failed to send message.", "error");
      } finally {
        setSending(false);
      }
    },
    [activeChatId, venueId, showToast]
  );

  const handleArchive = useCallback(async () => {
    if (!activeChatId) return;
    setActionPending(true);
    try {
      await setChatArchived(activeChatId, true);
      showToast("Conversation archived.");
      setActiveThread(null);
      setInboxFilter(INBOX_FILTERS.ARCHIVED);
    } catch (err) {
      showToast(err.message || "Could not archive.", "error");
    } finally {
      setActionPending(false);
    }
  }, [activeChatId, showToast]);

  const handleUnarchive = useCallback(async () => {
    if (!activeChatId) return;
    setActionPending(true);
    try {
      await setChatArchived(activeChatId, false);
      showToast("Conversation restored to inbox.");
      setInboxFilter(INBOX_FILTERS.ALL);
    } catch (err) {
      showToast(err.message || "Could not restore.", "error");
    } finally {
      setActionPending(false);
    }
  }, [activeChatId, showToast]);

  const handleDelete = useCallback(async () => {
    if (!activeChatId) return;
    if (!window.confirm("Archive this conversation? You can find it under Archived.")) {
      return;
    }
    await handleArchive();
  }, [activeChatId, handleArchive]);

  const handleStartComposeChat = useCallback(
    async (thread) => {
      setInboxFilter(INBOX_FILTERS.ALL);
      setActiveThread(thread);
      const chatId = thread.chatId || thread.id;
      if (chatId) {
        try {
          await markVendorInboxRead(chatId);
        } catch {
          /* ignore */
        }
      }
      showToast("Chat opened.");
    },
    [showToast]
  );

  if (venueLoading) {
    return (
      <div className="flex h-[calc(100vh-120px)] items-center justify-center text-outline font-black uppercase tracking-widest text-xs">
        Loading inbox…
      </div>
    );
  }

  if (!venueId) {
    return (
      <div className="flex h-[calc(100vh-120px)] items-center justify-center text-outline font-medium text-sm px-8 text-center">
        Link your venue account to use messaging.
      </div>
    );
  }

  return (
    <>
      {toast && (
        <div
          className={`fixed top-24 right-8 z-[80] px-5 py-3 rounded-2xl shadow-lg text-sm font-bold ${
            toast.type === "error"
              ? "bg-rose-600 text-white"
              : "bg-emerald-600 text-white"
          }`}
        >
          {toast.message}
        </div>
      )}

      <div className="flex h-[calc(100vh-120px)] gap-6 overflow-hidden text-slate-700 font-sans">
        <ChatSidebar
          threads={threads}
          activeThread={activeThread}
          onSelectThread={handleSelectThread}
          loading={inboxLoading}
          error={inboxError}
          inboxFilter={inboxFilter}
          onFilterChange={setInboxFilter}
          onCompose={() => setComposeOpen(true)}
        />

        <ChatThread
          activeThread={activeThread}
          messages={messages}
          venueSlug={venueId}
          loading={messagesLoading}
          error={messagesError}
          sending={sending}
          onSendMessage={handleSendMessage}
          onArchive={handleArchive}
          onUnarchive={handleUnarchive}
          onDelete={handleDelete}
          actionPending={actionPending}
        />

        <div className="hidden 2xl:block">
          <ChatQuickReplies
            venueId={venueId}
            onSelectReply={handleSendMessage}
            disabled={!activeChatId || sending}
          />
        </div>
      </div>

      <ComposeChatModal
        open={composeOpen}
        onClose={() => setComposeOpen(false)}
        venueId={venueId}
        existingThreads={threads}
        onStartChat={handleStartComposeChat}
      />
    </>
  );
};

export default MessagesPage;
