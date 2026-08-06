"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useBorrowHub } from "@/hooks/useBorrowHub";
import {
  enableNetworkParticipation,
  createBorrowRequest,
  acceptBorrowRequest,
  declineBorrowRequest,
  cancelBorrowRequest,
  markBorrowRequestInUse,
  markBorrowRequestReturned,
  BORROW_STATUS,
} from "@/lib/firestore/borrowHub";
import {
  CATEGORY_PILLS,
  filterListings,
  computeBorrowMetrics,
  listingImageUrl,
  formatPriceLabel,
  outgoingStatusPill,
} from "@/lib/borrowHubUtils";

export default function BorrowHubPage() {
  const hub = useBorrowHub();
  const [isProcessing, setIsProcessing] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });
  const [trackerTab, setTrackerTab] = useState("incoming");
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("all");

  const [requestModal, setRequestModal] = useState(null);
  const [reqQty, setReqQty] = useState(1);
  const [reqDate, setReqDate] = useState("");
  const [reqNotes, setReqNotes] = useState("");
  const [reqUrgency, setReqUrgency] = useState("planned");
  const isNetworkParticipant = hub.isNetworkParticipant;

  const metrics = useMemo(
    () => computeBorrowMetrics(hub.incomingRequests, hub.outgoingRequests),
    [hub.incomingRequests, hub.outgoingRequests]
  );

  const filteredListings = useMemo(
    () => filterListings(hub.hubListings, search, categoryId),
    [hub.hubListings, search, categoryId]
  );

  const pendingIncoming = useMemo(
    () =>
      hub.incomingRequests.filter((r) => r.status === BORROW_STATUS.PENDING),
    [hub.incomingRequests]
  );

  const activeIncoming = useMemo(
    () =>
      hub.incomingRequests.filter((r) =>
        [
          BORROW_STATUS.APPROVED,
          BORROW_STATUS.LEGACY_ACCEPTED,
          BORROW_STATUS.IN_USE,
        ].includes(r.status)
      ),
    [hub.incomingRequests]
  );

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), 3500);
  };

  const handleSubmitRequest = async () => {
    if (!requestModal || !hub.venueId || !hub.userId) return;
    if (!reqDate) {
      showToast("Please select a required event date.", "error");
      return;
    }
    setIsProcessing(true);
    try {
      await createBorrowRequest({
        borrowerVenueId: hub.venueId,
        borrowerUserId: hub.userId,
        lenderVenueId: requestModal.lenderVenueId,
        lenderOwnerId: null,
        borrowerDisplayName: hub.venueDisplayName,
        item: {
          itemId: requestModal.itemId,
          title: requestModal.title,
          category: requestModal.category,
          quantityRequested: Number(reqQty) || 1,
          listingType: requestModal.listingType,
          pricePerUnit: requestModal.pricePerUnit,
          unit: requestModal.unit,
        },
        eventContext: { eventDate: reqDate, urgency: reqUrgency, notes: reqNotes },
        terms: {
          mode: requestModal.listingType === "rent" ? "rent" : "lend",
          transportResponsibility: "borrower",
        },
      });
      setRequestModal(null);
      setTrackerTab("outgoing");
      showToast("Request sent. Track status in Live Tracker.");
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const runAction = async (fn, successMsg = "Updated successfully.") => {
    setIsProcessing(true);
    try {
      await fn();
      showToast(successMsg);
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEnableNetworkParticipation = async () => {
    if (!hub.venueId) return;
    setIsProcessing(true);
    try {
      await enableNetworkParticipation(hub.venueId);
      showToast("B2B network participation enabled.");
    } catch (e) {
      showToast(e.message || "Could not enable network participation.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  if (hub.isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center bg-slate-50 rounded-xl">
        <span className="material-symbols-outlined text-5xl text-indigo-600 animate-spin">
          sync
        </span>
        <p className="text-sm font-semibold text-slate-600 mt-4">Loading Borrow Hub…</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-[calc(100vh-8rem)] -mx-8 -mt-4 px-6 py-8 lg:px-8">
      <AnimatePresence>
        {toast.show && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`fixed top-24 right-8 z-[200] px-5 py-3 rounded-lg shadow-lg text-white text-sm font-semibold ${
              toast.type === "error" ? "bg-rose-600" : "bg-indigo-600"
            }`}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {hub.error && (
        <div className="mb-6 rounded-lg bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-800">
          {hub.error} — Update Firestore rules for <code className="text-xs">borrow_requests</code>{" "}
          and <code className="text-xs">inventory_listings</code> (deploy{" "}
          <code className="text-xs">firestore.rules</code> via Firebase CLI).
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <Link
          href="/vendor-dashboard/my-inventory"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white border border-slate-200 text-slate-700 text-sm font-semibold hover:border-indigo-300 hover:text-indigo-600 shadow-sm transition-colors"
        >
          <span className="material-symbols-outlined text-lg">inventory_2</span>
          My Inventory
          {hub.inventory.length > 0 && (
            <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-0.5 rounded-full">
              {hub.inventory.length}
            </span>
          )}
        </Link>
        {!isNetworkParticipant && (
          <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg">
            List assets from{" "}
            <Link href="/vendor-dashboard/my-inventory" className="font-semibold underline">
              My Inventory
            </Link>{" "}
            after enabling B2B network participation there.
          </p>
        )}
      </div>

      {!isNetworkParticipant ? (
        <div className="rounded-2xl border border-violet-200 bg-gradient-to-br from-white via-violet-50 to-indigo-50 shadow-sm p-8 md:p-12">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-wider text-violet-600 mb-2">
              B2B Network Locked
            </p>
            <h2 className="text-2xl font-bold text-slate-900">
              Enable B2B Network Participation
            </h2>
            <p className="text-slate-600 mt-3 text-sm md:text-base">
              Join the inter-vendor marketplace to publish assets, receive borrow requests, and
              auto-manage live stock allocations in real time.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/vendor-dashboard/my-inventory"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-violet-600 text-white font-semibold hover:bg-violet-700"
              >
                <span className="material-symbols-outlined text-lg">inventory_2</span>
                Go to My Inventory
              </Link>
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleEnableNetworkParticipation}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-violet-200 bg-white text-violet-700 font-semibold hover:bg-violet-50 disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-lg">bolt</span>
                Enable network here
              </button>
            </div>
          </div>
        </div>
      ) : (

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* LEFT: Discovery marketplace */}
        <div className="xl:col-span-8 space-y-6">
          <header>
            <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-1">
              Festalytics B2B
            </p>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800 tracking-tight">
              B2B Inter-Vendor Borrow Network
            </h1>
            <p className="text-slate-600 mt-2 max-w-2xl text-sm md:text-base">
              Locate and borrow surplus inventory from nearby registered partner venues in
              real-time.
            </p>
          </header>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex gap-4 items-start">
              <div className="w-12 h-12 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-emerald-600">payments</span>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Surplus items lent out
                </p>
                <p className="text-lg font-bold text-emerald-600 mt-1">
                  {metrics.earnedThisMonth > 0
                    ? `Rs. ${metrics.earnedThisMonth.toLocaleString()} earned this month`
                    : "Rs. 0 earned this month"}
                </p>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex gap-4 items-start">
              <div className="w-12 h-12 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-indigo-600">inbox</span>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Active outward borrowings
                </p>
                <p className="text-lg font-bold text-indigo-600 mt-1">
                  {metrics.incomingTodayCount}{" "}
                  {metrics.incomingTodayCount === 1 ? "item" : "items"} incoming today
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl">
                search
              </span>
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search generators, catering hardware, decor sets..."
                className="w-full pl-12 pr-4 py-3 rounded-lg border border-slate-200 bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_PILLS.map((pill) => (
                <button
                  key={pill.id}
                  type="button"
                  onClick={() => setCategoryId(pill.id)}
                  className={`px-4 py-2 rounded-full text-xs font-semibold border transition-colors ${
                    categoryId === pill.id
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300"
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredListings.length === 0 ? (
              <div className="md:col-span-2 rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
                <span className="material-symbols-outlined text-5xl text-slate-300">handshake</span>
                <p className="text-slate-600 font-medium mt-4">
                  No peer items match your search. Other vendors must enable Borrow Hub and list
                  inventory.
                </p>
              </div>
            ) : (
              filteredListings.map((listing) => (
                <article
                  key={listing.id}
                  className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow"
                >
                  <div className="h-40 bg-slate-100 relative overflow-hidden">
                    <img
                      src={listingImageUrl(listing)}
                      alt={listing.title}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute top-3 left-3 bg-white/95 text-slate-700 text-[10px] font-bold px-2.5 py-1 rounded-md border border-slate-200">
                      Owner: {listing.lenderDisplayName}
                    </span>
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    <h3 className="font-bold text-slate-800 text-lg leading-snug">{listing.title}</h3>
                    <p className="text-xs text-slate-500 mt-1">{listing.lenderArea}</p>
                    <p className="text-sm font-semibold text-indigo-600 mt-3">
                      {formatPriceLabel(listing)}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {listing.availableStockQuantity ?? listing.quantityAvailable}{" "}
                      {listing.unit} available
                    </p>
                    <div className="mt-auto pt-4 flex justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          setRequestModal(listing);
                          setReqQty(1);
                          setReqDate("");
                          setReqNotes("");
                        }}
                        className="px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-sm transition-colors"
                      >
                        Request to Borrow
                      </button>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>

        {/* RIGHT: Live Tracker */}
        <div className="xl:col-span-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 sticky top-24">
            <div className="flex items-center gap-2 mb-6">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
              </span>
              <h2 className="text-lg font-bold text-slate-800">Live Tracker Hub</h2>
            </div>

            <div className="grid grid-cols-2 gap-0 rounded-lg border border-slate-200 overflow-hidden mb-6">
              <button
                type="button"
                onClick={() => setTrackerTab("incoming")}
                className={`py-3 px-2 text-xs font-semibold flex flex-col items-center gap-1 transition-colors ${
                  trackerTab === "incoming"
                    ? "bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600"
                    : "bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                Incoming Requests
                {metrics.pendingIncomingCount > 0 && (
                  <span className="bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {metrics.pendingIncomingCount}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setTrackerTab("outgoing")}
                className={`py-3 px-2 text-xs font-semibold flex flex-col items-center gap-1 transition-colors ${
                  trackerTab === "outgoing"
                    ? "bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600"
                    : "bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                My Active Sent Requests
                {metrics.outgoingActiveCount > 0 && (
                  <span className="bg-slate-700 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {metrics.outgoingActiveCount}
                  </span>
                )}
              </button>
            </div>

            <div className="space-y-4 max-h-[calc(100vh-16rem)] overflow-y-auto pr-1">
              {trackerTab === "incoming" && (
                <>
                  {pendingIncoming.length === 0 && activeIncoming.length === 0 && (
                    <p className="text-sm text-slate-500 text-center py-8">
                      No incoming borrow requests.
                    </p>
                  )}
                  {pendingIncoming.map((req) => (
                    <div
                      key={req.id}
                      className="rounded-lg border border-slate-200 p-4 bg-slate-50/50 space-y-3"
                    >
                      <p className="text-sm font-semibold text-slate-800 leading-snug">
                        <span className="text-indigo-600">
                          {req.borrowerDisplayName || req.borrowerVenueId}
                        </span>{" "}
                        requires {req.item?.quantityRequested} × {req.item?.title}
                      </p>
                      <p className="text-xs text-slate-500">
                        Required date:{" "}
                        <span className="font-semibold text-slate-700">
                          {req.eventContext?.eventDate || "—"}
                        </span>
                        {req.eventContext?.urgency === "same_day" && (
                          <span className="ml-2 text-amber-700 font-semibold">Urgent</span>
                        )}
                      </p>
                      {req.eventContext?.notes && (
                        <p className="text-xs text-slate-600 italic">{req.eventContext.notes}</p>
                      )}
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={() =>
                            runAction(
                              () => acceptBorrowRequest(req.id, hub.venueId, hub.userId),
                              "Accepted and stock allocated."
                            )
                          }
                          className="py-2.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-300 text-xs font-semibold hover:bg-emerald-100 disabled:opacity-50"
                        >
                          Accept & Allocate
                        </button>
                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={() => {
                            const reason = window.prompt("Decline reason (optional):") || "";
                            runAction(
                              () =>
                                declineBorrowRequest(
                                  req.id,
                                  hub.venueId,
                                  hub.userId,
                                  reason
                                ),
                              "Request declined."
                            );
                          }}
                          className="py-2.5 rounded-lg bg-white text-slate-500 border border-slate-200 text-xs font-semibold hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 disabled:opacity-50"
                        >
                          Decline Request
                        </button>
                      </div>
                    </div>
                  ))}
                  {activeIncoming.map((req) => (
                    <div
                      key={req.id}
                      className="rounded-lg border border-emerald-200 p-3 bg-emerald-50/30 space-y-2"
                    >
                      <p className="text-xs font-semibold text-slate-800">
                        {req.borrowerDisplayName} — {req.item?.title}
                      </p>
                      <p className="text-[10px] text-emerald-800 font-semibold uppercase">
                        {[
                          BORROW_STATUS.APPROVED,
                          BORROW_STATUS.LEGACY_ACCEPTED,
                        ].includes(req.status)
                          ? "Approved"
                          : "In use"}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {[BORROW_STATUS.APPROVED, BORROW_STATUS.LEGACY_ACCEPTED].includes(
                          req.status
                        ) && (
                          <button
                            type="button"
                            disabled={isProcessing}
                            onClick={() =>
                              runAction(() => markBorrowRequestInUse(req.id, hub.venueId))
                            }
                            className="text-xs font-semibold text-indigo-600"
                          >
                            Mark handed over
                          </button>
                        )}
                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={() =>
                            runAction(
                              () => markBorrowRequestReturned(req.id, hub.venueId),
                              "Marked returned. Stock restored."
                            )
                          }
                          className="text-xs font-semibold text-emerald-700"
                        >
                          Mark returned
                        </button>
                      </div>
                    </div>
                  ))}
                </>
              )}

              {trackerTab === "outgoing" && (
                <>
                  {hub.outgoingRequests.length === 0 ? (
                    <p className="text-sm text-slate-500 text-center py-8">
                      You have not sent any borrow requests yet.
                    </p>
                  ) : (
                    hub.outgoingRequests.map((req) => {
                      const pill = outgoingStatusPill(req.status);
                      return (
                        <div
                          key={req.id}
                          className="rounded-lg border border-slate-100 p-4 hover:border-slate-200 transition-colors"
                        >
                          <div className="flex justify-between items-start gap-2">
                            <div>
                              <p className="text-sm font-semibold text-slate-800">
                                {req.item?.title}
                              </p>
                              <p className="text-xs text-slate-500 mt-0.5">
                                Lender: {req.lenderDisplayName || req.lenderVenueId}
                              </p>
                              <p className="text-xs text-slate-500">
                                Event: {req.eventContext?.eventDate || "—"}
                              </p>
                            </div>
                            <span
                              className={`shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full border ${pill.className}`}
                            >
                              {pill.label}
                            </span>
                          </div>
                          {req.status === BORROW_STATUS.PENDING && (
                            <button
                              type="button"
                              disabled={isProcessing}
                              onClick={() =>
                                runAction(
                                  () => cancelBorrowRequest(req.id, hub.venueId),
                                  "Request cancelled."
                                )
                              }
                              className="mt-3 text-xs font-semibold text-slate-500 hover:text-rose-600"
                            >
                              Cancel request
                            </button>
                          )}
                          {[
                            BORROW_STATUS.APPROVED,
                            BORROW_STATUS.LEGACY_ACCEPTED,
                            BORROW_STATUS.IN_USE,
                          ].includes(
                            req.status
                          ) && (
                            <div className="mt-2 flex gap-3">
                              {[BORROW_STATUS.APPROVED, BORROW_STATUS.LEGACY_ACCEPTED].includes(
                                req.status
                              ) && (
                                <button
                                  type="button"
                                  disabled={isProcessing}
                                  onClick={() =>
                                    runAction(() =>
                                      markBorrowRequestInUse(req.id, hub.venueId)
                                    )
                                  }
                                  className="text-xs font-semibold text-indigo-600"
                                >
                                  Confirm received
                                </button>
                              )}
                              <button
                                type="button"
                                disabled={isProcessing}
                                onClick={() =>
                                  runAction(
                                    () => markBorrowRequestReturned(req.id, hub.venueId),
                                    "Return recorded."
                                  )
                                }
                                className="text-xs font-semibold text-emerald-700"
                              >
                                Mark returned
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      )}

      {requestModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/50">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200"
          >
            <h3 className="text-xl font-bold text-slate-800">Request to borrow</h3>
            <p className="text-sm text-slate-500 mt-1">
              From <span className="font-semibold text-indigo-600">{requestModal.lenderDisplayName}</span>
            </p>
            <p className="font-semibold text-slate-800 mt-3">{requestModal.title}</p>
            <p className="text-sm text-indigo-600">{formatPriceLabel(requestModal)}</p>

            <div className="mt-5 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase">Quantity</label>
                <input
                  type="number"
                  min={1}
                  max={
                    requestModal.availableStockQuantity ??
                    requestModal.quantityAvailable
                  }
                  value={reqQty}
                  onChange={(e) => setReqQty(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase">
                  Required date *
                </label>
                <input
                  type="date"
                  value={reqDate}
                  onChange={(e) => setReqDate(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase">Urgency</label>
                <select
                  value={reqUrgency}
                  onChange={(e) => setReqUrgency(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                >
                  <option value="same_day">Same day emergency</option>
                  <option value="next_event">Next event</option>
                  <option value="planned">Planned</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase">Notes</label>
                <textarea
                  rows={3}
                  value={reqNotes}
                  onChange={(e) => setReqNotes(e.target.value)}
                  placeholder="Why you need this item, pickup constraints…"
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleSubmitRequest}
                className="flex-1 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm disabled:opacity-50"
              >
                Send request
              </button>
              <button
                type="button"
                onClick={() => setRequestModal(null)}
                className="flex-1 py-3 rounded-lg border border-slate-200 text-slate-700 font-semibold text-sm"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
