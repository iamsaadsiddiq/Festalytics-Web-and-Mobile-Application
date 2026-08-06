"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { listenToVenueQuotations, mapQuotationToBookingRow } from "@/lib/firestore/quotations";
import { buildChatId } from "@/lib/chatUtils";
import { ensureChatRoom } from "@/lib/firestore/chats";

export default function ComposeChatModal({ open, onClose, venueId, existingThreads = [], onStartChat }) {
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [starting, setStarting] = useState(null);

  useEffect(() => {
    if (!open || !venueId) return undefined;

    setLoading(true);
    const unsub = listenToVenueQuotations(
      venueId,
      (quotations) => {
        const rows = quotations.map(mapQuotationToBookingRow);
        const byUser = new Map();
        for (const row of rows) {
          const uid = row.raw?.userId;
          if (!uid) continue;
          if (!byUser.has(uid)) {
            byUser.set(uid, {
              userId: uid,
              name: row.customer?.name || "Customer",
              bookingRef: row.id,
              service: row.service,
              eventDate: row.eventDate,
            });
          }
        }
        setCustomers(Array.from(byUser.values()));
        setLoading(false);
      },
      () => setLoading(false)
    );

    return () => unsub();
  }, [open, venueId]);

  const existingIds = new Set(
    existingThreads.map((t) => t.customerId).filter(Boolean)
  );

  const filtered = customers.filter((c) => {
    const term = search.trim().toLowerCase();
    if (!term) return true;
    return (
      c.name.toLowerCase().includes(term) ||
      c.bookingRef?.toLowerCase().includes(term)
    );
  });

  const handleStart = async (customer) => {
    if (!venueId || !customer.userId) return;
    setStarting(customer.userId);
    try {
      const chatId = buildChatId(venueId, customer.userId);
      await ensureChatRoom({
        chatId,
        venueSlug: venueId,
        customerId: customer.userId,
        customerName: customer.name,
        subject: `Booking #${customer.bookingRef} Discussion`,
        bookingRef: customer.bookingRef,
      });
      onStartChat?.({
        id: chatId,
        chatId,
        name: customer.name,
        customerId: customer.userId,
        subject: `Booking #${customer.bookingRef} Discussion`,
        bookingRef: customer.bookingRef,
        lastMessage: "Conversation started",
        time: "Just now",
        unread: false,
        venueSlug: venueId,
      });
      onClose?.();
    } catch (err) {
      console.error("[ComposeChatModal]", err);
    } finally {
      setStarting(null);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-outline-variant overflow-hidden"
          >
            <div className="p-6 border-b border-outline-variant bg-primary text-white">
              <h3 className="text-xl font-black tracking-tight">Compose message</h3>
              <p className="text-xs opacity-90 mt-1">
                Start a chat with a customer from your quotation requests
              </p>
            </div>

            <div className="p-4 border-b border-outline-variant">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or booking ref…"
                className="w-full px-4 py-3 rounded-full border border-outline-variant text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="max-h-[320px] overflow-y-auto p-4 space-y-2 custom-scrollbar">
              {loading ? (
                <p className="text-center text-sm text-outline py-8">Loading customers…</p>
              ) : filtered.length === 0 ? (
                <p className="text-center text-sm text-outline py-8">
                  No customers with linked accounts found. Customers must submit a
                  quotation while signed in.
                </p>
              ) : (
                filtered.map((c) => {
                  const hasThread = existingIds.has(c.userId);
                  return (
                    <button
                      key={c.userId}
                      type="button"
                      disabled={starting === c.userId}
                      onClick={() => handleStart(c)}
                      className="w-full flex items-center justify-between gap-3 p-4 rounded-2xl border border-outline-variant/60 hover:border-primary hover:bg-primary-fixed/30 transition-all text-left cursor-pointer disabled:opacity-50 bg-white"
                    >
                      <div>
                        <p className="font-black text-on-surface text-sm">{c.name}</p>
                        <p className="text-[10px] text-outline uppercase tracking-wider mt-0.5">
                          {c.service} · {c.eventDate || "Date TBD"}
                        </p>
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-primary shrink-0">
                        {starting === c.userId
                          ? "Opening…"
                          : hasThread
                            ? "Open chat"
                            : "Start chat"}
                      </span>
                    </button>
                  );
                })
              )}
            </div>

            <div className="p-4 border-t border-outline-variant flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 rounded-full font-bold text-sm text-on-surface-variant hover:bg-surface-container border-0 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
