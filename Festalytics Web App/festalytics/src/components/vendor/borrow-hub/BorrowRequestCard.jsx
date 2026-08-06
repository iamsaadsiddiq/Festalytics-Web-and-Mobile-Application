"use client";

import React from "react";
import { borrowStatusLabel, BORROW_STATUS } from "@/lib/firestore/borrowHub";

export default function BorrowRequestCard({
  request,
  role,
  venueId,
  onAccept,
  onDecline,
  onCancel,
  onHandover,
  onReturn,
  isProcessing,
}) {
  const isLender = role === "lender";
  const counterparty = isLender
    ? request.borrowerDisplayName || request.borrowerVenueId
    : request.lenderDisplayName || request.lenderVenueId;

  const statusClass =
    request.status === BORROW_STATUS.PENDING
      ? "bg-amber-100 text-amber-800 border-amber-200"
      : request.status === BORROW_STATUS.ACCEPTED || request.status === BORROW_STATUS.IN_USE
        ? "bg-emerald-100 text-emerald-800 border-emerald-200"
        : request.status === BORROW_STATUS.RETURNED
          ? "bg-slate-100 text-slate-700 border-slate-200"
          : "bg-red-50 text-red-700 border-red-200";

  return (
    <div className="bg-white rounded-3xl border border-outline-variant/40 p-6 shadow-sm space-y-4">
      <div className="flex flex-wrap justify-between gap-3 items-start">
        <div>
          <p className="text-[10px] font-black text-outline uppercase tracking-widest">
            {isLender ? "Request from" : "Lending from"}
          </p>
          <h4 className="text-lg font-black text-on-surface">{counterparty}</h4>
          <p className="text-sm font-bold text-secondary mt-1">{request.item?.title}</p>
        </div>
        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase border ${statusClass}`}>
          {borrowStatusLabel(request.status)}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div>
          <p className="text-outline font-bold uppercase text-[9px]">Qty</p>
          <p className="font-black">{request.item?.quantityRequested}</p>
        </div>
        <div>
          <p className="text-outline font-bold uppercase text-[9px]">Event date</p>
          <p className="font-black">{request.eventContext?.eventDate || "—"}</p>
        </div>
        <div>
          <p className="text-outline font-bold uppercase text-[9px]">Urgency</p>
          <p className="font-black capitalize">{request.eventContext?.urgency || "—"}</p>
        </div>
        <div>
          <p className="text-outline font-bold uppercase text-[9px]">Terms</p>
          <p className="font-black capitalize">{request.terms?.mode || "—"}</p>
        </div>
      </div>

      {request.eventContext?.notes && (
        <p className="text-sm text-on-surface-variant bg-surface-container-low rounded-2xl p-4">
          {request.eventContext.notes}
        </p>
      )}

      <div className="flex flex-wrap gap-2 pt-2">
        {isLender && request.status === BORROW_STATUS.PENDING && (
          <>
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => onAccept?.(request)}
              className="px-5 py-2.5 rounded-full bg-primary text-white text-xs font-black uppercase tracking-wider disabled:opacity-50"
            >
              Accept
            </button>
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => onDecline?.(request)}
              className="px-5 py-2.5 rounded-full bg-white border border-error text-error text-xs font-black uppercase tracking-wider disabled:opacity-50"
            >
              Decline
            </button>
          </>
        )}
        {!isLender && request.status === BORROW_STATUS.PENDING && (
          <button
            type="button"
            disabled={isProcessing}
            onClick={() => onCancel?.(request)}
            className="px-5 py-2.5 rounded-full border border-outline-variant text-xs font-black uppercase tracking-wider disabled:opacity-50"
          >
            Cancel request
          </button>
        )}
        {request.status === BORROW_STATUS.ACCEPTED && (
          <button
            type="button"
            disabled={isProcessing}
            onClick={() => onHandover?.(request)}
            className="px-5 py-2.5 rounded-full bg-secondary text-white text-xs font-black uppercase tracking-wider disabled:opacity-50"
          >
            Mark handed over
          </button>
        )}
        {(request.status === BORROW_STATUS.IN_USE ||
          request.status === BORROW_STATUS.ACCEPTED) && (
          <button
            type="button"
            disabled={isProcessing}
            onClick={() => onReturn?.(request)}
            className="px-5 py-2.5 rounded-full bg-emerald-600 text-white text-xs font-black uppercase tracking-wider disabled:opacity-50"
          >
            Mark returned
          </button>
        )}
      </div>
    </div>
  );
}
