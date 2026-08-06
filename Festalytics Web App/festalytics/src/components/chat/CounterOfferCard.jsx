"use client";

import React, { useState } from "react";
import { counterOfferStatusLabel } from "@/lib/chatUtils";
import { COUNTER_OFFER_STATUS } from "@/lib/firestore/chats";

/**
 * @param {object} props
 * @param {object} props.counterOffer
 * @param {"vendor"|"customer"} props.viewerRole
 * @param {boolean} [props.isOwnMessage]
 * @param {(status: string) => Promise<void>} [props.onRespond]
 */
export default function CounterOfferCard({
  counterOffer = {},
  viewerRole = "vendor",
  isOwnMessage = false,
  onRespond,
}) {
  const [submitting, setSubmitting] = useState(false);
  const status = counterOffer.status || COUNTER_OFFER_STATUS.PENDING;
  const label = counterOfferStatusLabel(status);
  const isPending = status === COUNTER_OFFER_STATUS.PENDING;
  const isAccepted = status === COUNTER_OFFER_STATUS.ACCEPTED;
  const isRejected = status === COUNTER_OFFER_STATUS.REJECTED;

  const handleRespond = async (nextStatus) => {
    if (!onRespond || submitting) return;
    setSubmitting(true);
    try {
      await onRespond(nextStatus);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-sm rounded-2xl border border-outline-variant/60 bg-white shadow-md overflow-hidden">
      <div className="px-5 py-3 border-b border-outline-variant/40 bg-surface-container-lowest">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
          Counter quotation
        </p>
      </div>

      <div className="p-5 space-y-4">
        <div className="grid grid-cols-1 gap-3">
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-outline">
              Total revised guest price
            </p>
            <p className="text-2xl font-black text-on-surface mt-1">
              Rs. {Number(counterOffer.revisedGuestPrice || 0).toLocaleString("en-PK")}
            </p>
            {counterOffer.guestCount != null && (
              <p className="text-xs text-outline mt-1">
                Based on {counterOffer.guestCount} guests
              </p>
            )}
          </div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-outline">
              Booking reference
            </p>
            <p className="text-sm font-bold text-on-surface mt-1 font-mono">
              {counterOffer.bookingRefId || "—"}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 pt-1">
          <span className="text-[9px] font-black uppercase tracking-widest text-outline">
            Status
          </span>
          <span
            className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
              isAccepted
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : isRejected
                  ? "bg-rose-50 text-rose-700 border-rose-200"
                  : "bg-amber-50 text-amber-700 border-amber-200"
            }`}
          >
            {label}
          </span>
        </div>

        {viewerRole === "customer" && isPending && !isOwnMessage && onRespond && (
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              disabled={submitting}
              onClick={() => handleRespond(COUNTER_OFFER_STATUS.REJECTED)}
              className="flex-1 py-2.5 rounded-xl border-2 border-rose-200 text-rose-600 text-[10px] font-black uppercase tracking-wider hover:bg-rose-50 disabled:opacity-50"
            >
              Reject
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={() => handleRespond(COUNTER_OFFER_STATUS.ACCEPTED)}
              className="flex-1 py-2.5 rounded-xl bg-primary text-white text-[10px] font-black uppercase tracking-wider shadow-lg shadow-primary/20 hover:brightness-110 disabled:opacity-50"
            >
              Accept
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
