"use client";

import React, { useEffect, useMemo, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/firebase";
import { useVendorVenue } from "@/hooks/useVendorVenue";
import { enableNetworkParticipation } from "@/lib/firestore/borrowHub";

export default function NetworkGuard({ children }) {
  const { venueId, isLoading: venueLoading } = useVendorVenue();
  const [networkEnabled, setNetworkEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");

  const currentVendorSlug = useMemo(() => venueId || "", [venueId]);

  useEffect(() => {
    if (venueLoading || !currentVendorSlug) {
      if (!venueLoading) setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    const unsubscribe = onSnapshot(
      doc(db, "venues", currentVendorSlug),
      (snapshot) => {
        const venueData = snapshot.exists() ? snapshot.data() : {};
        setNetworkEnabled(venueData?.isNetworkParticipant === true);
        setLoading(false);
      },
      (snapshotError) => {
        setError(snapshotError.message || "Failed to read network participation status.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentVendorSlug, venueLoading]);

  const enableNetworkParticipation = async () => {
    if (!currentVendorSlug) return;

    setUpdating(true);
    setError("");
    try {
      await enableNetworkParticipation(currentVendorSlug);
    } catch (updateError) {
      setError(updateError.message || "Could not enable network participation.");
    } finally {
      setUpdating(false);
    }
  };

  if (loading || venueLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <span className="animate-spin w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="relative">
      <div className={!networkEnabled ? "pointer-events-none select-none" : ""}>{children}</div>

      {!networkEnabled && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/35 backdrop-blur-md p-6">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-2xl p-8">
            <p className="text-xs font-bold tracking-widest uppercase text-indigo-600 mb-2">
              B2B Network Access Required
            </p>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900">
              Enable B2B Network Participation to Manage and List Assets
            </h2>
            <p className="text-sm text-slate-600 mt-4">
              Activate your vendor network participation to unlock the inventory catalog,
              product publishing, and live inter-vendor stock operations.
            </p>

            {error && (
              <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            )}

            <div className="mt-6">
              <button
                type="button"
                disabled={updating}
                onClick={enableNetworkParticipation}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-white font-semibold hover:bg-indigo-700 disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-lg">bolt</span>
                {updating ? "Enabling..." : "Enable B2B Network Participation"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
