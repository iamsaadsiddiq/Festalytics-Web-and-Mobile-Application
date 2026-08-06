"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { INBOX_FILTERS, filterInboxThreads, countThreadsByFilter } from "@/lib/messageInboxFilters";

const FILTER_ITEMS = [
  { id: INBOX_FILTERS.ALL, icon: "mail", label: "All Messages", fill: 1 },
  { id: INBOX_FILTERS.UNREAD, icon: "mark_email_unread", label: "Unread" },
  { id: INBOX_FILTERS.PENDING, icon: "pending_actions", label: "Pending Queries" },
  { id: INBOX_FILTERS.ARCHIVED, icon: "archive", label: "Archived" },
];

const ChatSidebar = ({
  threads = [],
  activeThread = null,
  onSelectThread,
  loading = false,
  error = null,
  inboxFilter = INBOX_FILTERS.ALL,
  onFilterChange,
  onCompose,
}) => {
  const activeKey = activeThread?.chatId || activeThread?.id;

  const counts = useMemo(() => countThreadsByFilter(threads), [threads]);
  const filteredThreads = useMemo(
    () => filterInboxThreads(threads, inboxFilter),
    [threads, inboxFilter]
  );

  const unreadTotal = threads.filter((t) => t.unread && !t.archived).length;

  return (
    <aside className="w-[340px] flex flex-col bg-white rounded-3xl shadow-xl overflow-hidden border border-outline-variant h-full text-slate-700 font-sans">
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-black text-on-surface tracking-tight">Inbox</h2>
          <span className="bg-primary text-white text-[10px] font-black px-4 py-1.5 rounded-full shadow-lg shadow-primary/20 uppercase tracking-widest">
            {unreadTotal} New
          </span>
        </div>

        <motion.button
          type="button"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onCompose}
          className="w-full bg-primary text-white font-black py-4 rounded-full flex items-center justify-center gap-2 shadow-[0_8px_24px_rgba(224,64,160,0.3)] text-xs tracking-[0.2em] cursor-pointer border-0"
        >
          <span className="material-symbols-outlined text-lg">edit_square</span>
          COMPOSE
        </motion.button>

        <div className="space-y-1.5">
          {FILTER_ITEMS.map((filter) => {
            const isActive = inboxFilter === filter.id;
            const count = counts[filter.id] ?? 0;
            return (
              <button
                key={filter.id}
                type="button"
                onClick={() => onFilterChange?.(filter.id)}
                className={`w-full flex items-center gap-4 px-5 py-3 rounded-full transition-all group border-0 text-left cursor-pointer
                  ${
                    isActive
                      ? "bg-primary-fixed text-on-primary-fixed-variant font-black shadow-sm"
                      : "text-on-surface-variant hover:bg-surface-container font-bold bg-transparent"
                  }
                `}
              >
                <span
                  className="material-symbols-outlined text-xl"
                  style={{ fontVariationSettings: `'FILL' ${isActive ? 1 : 0}` }}
                >
                  {filter.icon}
                </span>
                <span className="text-xs tracking-wide uppercase flex-1">{filter.label}</span>
                {count > 0 && (
                  <span
                    className={`text-[10px] font-black px-2 py-0.5 rounded-full min-w-[22px] text-center ${
                      isActive ? "bg-primary text-white" : "bg-surface-container-high text-outline"
                    }`}
                  >
                    {count}
                  </span>
                )}
                {filter.id === INBOX_FILTERS.UNREAD && unreadTotal > 0 && !isActive && (
                  <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-6 custom-scrollbar">
        {error && (
          <p className="px-4 py-2 text-xs font-bold text-rose-600 text-center">{error}</p>
        )}
        {loading && (
          <p className="px-4 py-6 text-[10px] font-black uppercase tracking-widest text-outline text-center">
            Syncing inbox…
          </p>
        )}
        {!loading && filteredThreads.length === 0 && (
          <p className="px-4 py-6 text-xs text-outline text-center font-medium">
            {inboxFilter === INBOX_FILTERS.ARCHIVED
              ? "No archived conversations."
              : inboxFilter === INBOX_FILTERS.UNREAD
                ? "No unread messages."
                : inboxFilter === INBOX_FILTERS.PENDING
                  ? "No pending queries right now."
                  : "No conversations yet. Use Compose or open a booking."}
          </p>
        )}
        <div className="space-y-2">
          {filteredThreads.map((thread) => {
            const threadKey = thread.chatId || thread.id;
            const isActive = activeKey && activeKey === threadKey;
            return (
              <motion.div
                key={threadKey}
                whileHover={{ scale: 1.02 }}
                onClick={() => onSelectThread?.(thread)}
                className={`p-5 rounded-2xl cursor-pointer transition-all border-l-4 text-left
                  ${
                    isActive
                      ? "bg-surface-container-low border-primary shadow-md ring-1 ring-primary/5"
                      : "hover:bg-surface-container border-transparent"
                  }
                `}
              >
                <div className="flex gap-4">
                  <div className="relative flex-shrink-0">
                    {thread.avatar ? (
                      <img
                        src={thread.avatar}
                        alt={thread.name}
                        className="w-14 h-14 rounded-[1.25rem] object-cover border-2 border-primary-fixed shadow-sm"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-[1.25rem] bg-secondary/10 text-secondary border border-secondary-fixed flex items-center justify-center font-black text-sm uppercase">
                        {(thread.name || "CU").substring(0, 2)}
                      </div>
                    )}
                    <div
                      className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white
                      ${thread.unread ? "bg-primary" : thread.pendingQuery ? "bg-amber-500" : "bg-green-500"}
                    `}
                    />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <div className="flex justify-between items-start mb-1">
                      <p className="font-black text-on-surface truncate text-sm tracking-tight">
                        {thread.name}
                      </p>
                      <span
                        className={`text-[9px] font-black whitespace-nowrap uppercase tracking-widest 
                        ${isActive ? "text-primary" : "text-outline"}
                      `}
                      >
                        {thread.time}
                      </span>
                    </div>
                    <p className="text-[10px] font-black text-on-surface-variant/70 truncate uppercase tracking-[0.05em]">
                      {thread.subject}
                    </p>
                    <p className="text-xs text-outline leading-snug line-clamp-2 mt-1.5 font-medium">
                      {thread.lastMessage}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </aside>
  );
};

export default ChatSidebar;
