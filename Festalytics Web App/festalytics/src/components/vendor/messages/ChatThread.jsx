"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import CounterOfferCard from "@/components/chat/CounterOfferCard";

const ChatThread = ({
  activeThread = null,
  messages = [],
  venueSlug = "",
  loading = false,
  error = null,
  sending = false,
  onSendMessage,
  onArchive,
  onUnarchive,
  onDelete,
  actionPending = false,
}) => {
  const [inputText, setInputText] = useState("");
  const [showMenu, setShowMenu] = useState(false);
  const scrollRef = useRef(null);
  const isArchived = Boolean(activeThread?.archived);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, activeThread?.chatId]);

  const handleSend = async () => {
    if (!inputText.trim() || sending) return;
    const text = inputText;
    setInputText("");
    if (onSendMessage) {
      await onSendMessage(text);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!activeThread) {
    return (
      <section className="flex-1 flex flex-col bg-white rounded-3xl shadow-xl border border-outline-variant overflow-hidden items-center justify-center p-8 text-center text-slate-400 font-sans">
        <span className="material-symbols-outlined text-6xl text-slate-300 mb-4">forum</span>
        <p className="text-sm font-black uppercase tracking-wider">
          Select a conversation thread to start chatting
        </p>
      </section>
    );
  }

  return (
    <section className="flex-1 flex flex-col bg-white rounded-3xl shadow-xl border border-outline-variant overflow-hidden text-slate-700 font-sans">
      <div className="p-6 px-8 border-b border-outline-variant flex justify-between items-center bg-surface-container-lowest/50 backdrop-blur-md">
        <div className="flex items-center gap-5">
          <div className="relative">
            {activeThread.avatar ? (
              <img
                alt={activeThread.name}
                className="w-12 h-12 rounded-[1.25rem] object-cover border-2 border-primary-fixed shadow-md"
                src={activeThread.avatar}
              />
            ) : (
              <div className="w-12 h-12 rounded-[1.25rem] bg-secondary/10 text-secondary border border-secondary-fixed flex items-center justify-center font-black text-sm uppercase">
                {(activeThread.name || "CU").substring(0, 2)}
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-sm" />
          </div>
          <div>
            <h3 className="font-black text-on-surface leading-tight text-lg tracking-tight">
              {activeThread.name}
            </h3>
            <p className="text-[10px] font-black text-secondary uppercase tracking-[0.1em] mt-1">
              {activeThread.subject}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 relative">
          {isArchived ? (
            <button
              type="button"
              disabled={actionPending}
              onClick={() => onUnarchive?.()}
              title="Move back to inbox"
              className="p-3 text-outline hover:text-primary hover:bg-primary-fixed rounded-full transition-all border-0 bg-transparent cursor-pointer disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-xl">unarchive</span>
            </button>
          ) : (
            <button
              type="button"
              disabled={actionPending}
              onClick={() => onArchive?.()}
              title="Archive conversation"
              className="p-3 text-outline hover:text-primary hover:bg-primary-fixed rounded-full transition-all border-0 bg-transparent cursor-pointer disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-xl">archive</span>
            </button>
          )}
          <button
            type="button"
            disabled={actionPending}
            onClick={() => onDelete?.()}
            title="Archive and remove from active inbox"
            className="p-3 text-outline hover:text-rose-600 hover:bg-rose-50 rounded-full transition-all border-0 bg-transparent cursor-pointer disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-xl">delete</span>
          </button>
          <button
            type="button"
            onClick={() => setShowMenu((v) => !v)}
            className="p-3 text-outline hover:text-primary hover:bg-primary-fixed rounded-full transition-all border-0 bg-transparent cursor-pointer"
          >
            <span className="material-symbols-outlined text-xl">more_vert</span>
          </button>
          {showMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 top-full mt-1 z-50 w-52 bg-white border border-outline-variant rounded-2xl shadow-xl py-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false);
                    if (activeThread?.bookingRef) {
                      window.open(`/vendor-dashboard/bookings`, "_self");
                    }
                  }}
                  className="w-full px-4 py-3 text-left text-sm font-bold text-on-surface hover:bg-surface-container-low border-0 bg-transparent cursor-pointer"
                >
                  View in bookings
                </button>
                {isArchived ? (
                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false);
                      onUnarchive?.();
                    }}
                    className="w-full px-4 py-3 text-left text-sm font-bold text-primary hover:bg-primary-fixed border-0 bg-transparent cursor-pointer"
                  >
                    Restore to inbox
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false);
                      onArchive?.();
                    }}
                    className="w-full px-4 py-3 text-left text-sm font-bold text-on-surface hover:bg-surface-container-low border-0 bg-transparent cursor-pointer"
                  >
                    Archive conversation
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 flex flex-col overflow-y-auto p-8 space-y-8 custom-scrollbar bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-opacity-5"
      >
        {loading && (
          <p className="text-center text-[10px] font-black uppercase tracking-widest text-outline">
            Loading messages…
          </p>
        )}
        {error && (
          <p className="text-center text-xs font-bold text-rose-600">{error}</p>
        )}
        {!loading && messages.length === 0 && (
          <p className="text-center text-xs text-outline font-medium">
            No messages yet. Send a reply to start the conversation.
          </p>
        )}

        {messages.map((msg) => {
          if (msg.type === "system" || msg.sender === "system") {
            return (
              <div key={msg.id} className="flex justify-center">
                <div className="bg-tertiary-fixed text-on-tertiary-fixed-variant px-8 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-tertiary/10 border border-tertiary/20">
                  {msg.text}
                </div>
              </div>
            );
          }

          if (msg.type === "counter_offer") {
            const isMe = msg.sender === "vendor";
            return (
              <div
                key={msg.id}
                className={`flex gap-5 max-w-[90%] ${isMe ? "flex-row-reverse ml-auto" : ""}`}
              >
                {!isMe && (
                  <div className="w-10 h-10 rounded-2xl bg-secondary/10 text-secondary border border-secondary flex items-center justify-center font-black text-xs uppercase flex-shrink-0 shadow-sm">
                    {(activeThread.name || "CU").substring(0, 2)}
                  </div>
                )}
                <div className={`space-y-2 ${isMe ? "items-end flex flex-col" : ""}`}>
                  <CounterOfferCard
                    counterOffer={msg.counterOffer}
                    viewerRole="vendor"
                    isOwnMessage={isMe}
                  />
                  <p className="text-[9px] font-black text-outline uppercase tracking-widest ml-2">
                    {msg.time}
                  </p>
                </div>
              </div>
            );
          }

          const isMe = msg.sender === "vendor" || msg.senderId === venueSlug;

          return (
            <div
              key={msg.id}
              className={`flex gap-5 max-w-[85%] ${isMe ? "flex-row-reverse ml-auto" : ""}`}
            >
              {!isMe && (
                <>
                  {activeThread.avatar ? (
                    <img
                      alt={activeThread.name}
                      className="w-10 h-10 rounded-2xl object-cover flex-shrink-0 shadow-sm"
                      src={activeThread.avatar}
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-2xl bg-secondary/10 text-secondary border border-secondary flex items-center justify-center font-black text-xs uppercase flex-shrink-0 shadow-sm">
                      {(activeThread.name || "CU").substring(0, 2)}
                    </div>
                  )}
                </>
              )}
              <div className={`space-y-2 ${isMe ? "items-end flex flex-col" : ""}`}>
                <div
                  className={`px-6 py-4 rounded-[2rem] shadow-sm border ${
                    isMe
                      ? "bg-primary text-white rounded-tr-none shadow-xl shadow-primary/20 border-primary/10"
                      : "bg-secondary-container text-on-secondary-container rounded-tl-none border-secondary/10"
                  }`}
                >
                  <p className="text-sm font-medium leading-relaxed whitespace-pre-line">
                    {msg.text}
                  </p>
                </div>
                <p className="text-[9px] font-black text-outline uppercase tracking-widest ml-2">
                  {msg.time}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-6 bg-white border-t border-outline-variant">
        <div className="bg-surface-container-low p-3 rounded-[2.5rem] border border-outline-variant/50 shadow-inner">
          <div className="flex items-center gap-1 px-4 pb-2 border-b border-outline-variant/20 mb-2">
            {["format_bold", "format_italic", "link", "attach_file", "mood"].map((icon) => (
              <button
                key={icon}
                type="button"
                className="p-2 text-on-surface-variant hover:text-primary hover:bg-white rounded-xl transition-all border-0 bg-transparent cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">{icon}</span>
              </button>
            ))}
          </div>
          <div className="flex items-end gap-4 px-4 py-2">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={sending}
              className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-medium resize-none min-h-[44px] max-h-32 pt-2 scroll-smooth outline-none text-slate-700 disabled:opacity-60"
              placeholder="Type your message here..."
              rows={1}
            />
            <motion.button
              whileHover={{ scale: sending ? 1 : 1.1 }}
              whileTap={{ scale: sending ? 1 : 0.9 }}
              type="button"
              onClick={handleSend}
              disabled={sending || !inputText.trim()}
              className="bg-primary text-white w-12 h-12 rounded-full flex items-center justify-center shadow-lg shadow-primary/30 flex-shrink-0 mb-1 cursor-pointer border-0 disabled:opacity-50"
            >
              <span className="material-symbols-outlined fill-1">send</span>
            </motion.button>
          </div>
        </div>
        <div className="flex justify-between items-center mt-3 px-6">
          <p className="text-[9px] font-black text-outline uppercase tracking-widest">
            Press Enter to send • Shift + Enter for new line
          </p>
        </div>
      </div>
    </section>
  );
};

export default ChatThread;
