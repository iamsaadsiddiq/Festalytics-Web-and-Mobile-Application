"use client";

import { useState, useEffect, useMemo } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/firebase";
import { useVendorVenue } from "@/hooks/useVendorVenue";
import {
  listenHubListings,
  listenIncomingBorrowRequests,
  listenOutgoingBorrowRequests,
  BORROW_STATUS,
} from "@/lib/firestore/borrowHub";

/**
 * Borrow Hub state for the logged-in vendor tenant.
 */
export function useBorrowHub() {
  const { venueId, isLoading: venueLoading, user } = useVendorVenue();
  const [userId, setUserId] = useState(null);
  const [venueData, setVenueData] = useState(null);
  const [hubListings, setHubListings] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [outgoingRequests, setOutgoingRequests] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUserId(u?.uid || null));
    return () => unsub();
  }, []);

  useEffect(() => {
    if (venueLoading || !venueId) {
      if (!venueLoading) setDataLoading(false);
      return;
    }

    setDataLoading(true);
    setError(null);

    const unsubVenue = onSnapshot(
      doc(db, "venues", venueId),
      (snap) => {
        setVenueData(snap.exists() ? snap.data() : null);
        setDataLoading(false);
      },
      (err) => {
        setError(err.message);
        setDataLoading(false);
      }
    );

    const unsubHub = listenHubListings(
      venueId,
      setHubListings,
      (err) => setError(err.message)
    );

    const unsubIn = listenIncomingBorrowRequests(
      venueId,
      setIncomingRequests,
      (err) => setError(err.message)
    );

    const unsubOut = listenOutgoingBorrowRequests(
      venueId,
      setOutgoingRequests,
      (err) => setError(err.message)
    );

    return () => {
      unsubVenue();
      unsubHub();
      unsubIn();
      unsubOut();
    };
  }, [venueId, venueLoading]);

  const borrowHub = venueData?.borrowHub || { enabled: false };
  const inventory = venueData?.borrowableInventory || [];

  const pendingIncomingCount = useMemo(
    () =>
      incomingRequests.filter((r) => r.status === BORROW_STATUS.PENDING).length,
    [incomingRequests]
  );

  const venueDisplayName =
    borrowHub.displayName ||
    venueData?.name ||
    venueData?.profile?.hall_name ||
    venueId?.replace(/-/g, " ") ||
    "";

  return {
    venueId,
    userId,
    user,
    venueLoading,
    isLoading: venueLoading || dataLoading,
    error,
    venueData,
    borrowHub,
    inventory,
    hubListings,
    incomingRequests,
    outgoingRequests,
    pendingIncomingCount,
    venueDisplayName,
    ownerId: venueData?.ownerId || userId,
    isNetworkParticipant: venueData?.isNetworkParticipant === true,
  };
}
