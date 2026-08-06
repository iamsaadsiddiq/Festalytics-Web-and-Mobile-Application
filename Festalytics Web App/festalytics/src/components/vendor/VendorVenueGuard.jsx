"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useVendorVenue } from "@/hooks/useVendorVenue";

/**
 * Blocks vendor ERP when no venueId is linked (incomplete onboarding).
 */
export default function VendorVenueGuard({ children }) {
  const {
    venueId,
    isLoading,
    hasVenue,
    error,
    canClaimZaydan,
    reconnectZaydan,
    user,
    userData,
    zaydanVenueSlug,
  } = useVendorVenue();
  const [linking, setLinking] = useState(false);
  const [linkError, setLinkError] = useState(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <span className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!hasVenue) {
    if (userData?.pendingVendorOnboarding) {
      return (
        <div className="max-w-lg mx-auto mt-16 p-10 bg-white rounded-3xl border border-outline-variant shadow-xl text-center">
          <span className="material-symbols-outlined text-5xl text-primary mb-4">mark_email_unread</span>
          <h2 className="text-2xl font-black text-on-surface mb-2">Verify your email</h2>
          <p className="text-on-surface-variant text-sm mb-6">
            Your vendor registration is saved, but your venue listing will be created only after
            email verification.
          </p>
          <Link
            href="/verify-email"
            className="inline-block w-full px-8 py-3 bg-primary text-white font-black text-xs uppercase tracking-widest rounded-full"
          >
            {user?.emailVerified ? "Finish Vendor Setup" : "Verify Email"}
          </Link>
        </div>
      );
    }

    const handleReconnectZaydan = async () => {
      setLinking(true);
      setLinkError(null);
      try {
        await reconnectZaydan();
      } catch (e) {
        setLinkError(e.message || "Could not link venue.");
      } finally {
        setLinking(false);
      }
    };

    return (
      <div className="max-w-lg mx-auto mt-16 p-10 bg-white rounded-3xl border border-outline-variant shadow-xl text-center">
        <span className="material-symbols-outlined text-5xl text-primary mb-4">store</span>
        <h2 className="text-2xl font-black text-on-surface mb-2">Venue not linked</h2>
        <p className="text-on-surface-variant text-sm mb-6 text-left">
          You are signed in as a <strong>vendor</strong>
          {userData?.email ? ` (${userData.email})` : ""}, but your account is missing{" "}
          <code className="text-xs bg-slate-100 px-1 rounded">users.venueId</code> in
          Firestore. That is why the Zaydan ERP is hidden — not because you need to register
          again.
        </p>

        {canClaimZaydan && (
          <button
            type="button"
            disabled={linking}
            onClick={handleReconnectZaydan}
            className="w-full mb-3 px-8 py-3 bg-primary text-white font-black text-xs uppercase tracking-widest rounded-full disabled:opacity-50"
          >
            {linking ? "Linking…" : "Reconnect Zaydan Banquet Hall ERP"}
          </button>
        )}

        {linkError && (
          <p className="text-sm text-rose-600 mb-4">{linkError}</p>
        )}

        {error && (
          <p className="text-sm text-rose-600 mb-4">{error}</p>
        )}

        <p className="text-xs text-on-surface-variant mb-4 text-left">
          Manual fix (Firebase Console): open{" "}
          <code className="bg-slate-100 px-1 rounded">users/YOUR_UID</code> and set{" "}
          <code className="bg-slate-100 px-1 rounded">venueId</code> to{" "}
          <code className="bg-slate-100 px-1 rounded">{zaydanVenueSlug}</code>.
        </p>

        <Link
          href="/"
          className="inline-block px-6 py-2 text-sm font-semibold text-primary"
        >
          Back to home
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
