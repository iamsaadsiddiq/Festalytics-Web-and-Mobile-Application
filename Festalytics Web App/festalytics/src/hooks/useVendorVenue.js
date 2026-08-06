"use client";

import { useState, useEffect, useCallback } from "react";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/firebase";
import {
  resolveVendorVenueId,
  linkVendorToVenue,
  ZAYDAN_VENUE_SLUG,
} from "@/lib/firestore/vendorOnboarding";

/**
 * Resolves authenticated vendor's tenant venueId from Firestore users doc,
 * with self-healing for legacy Zaydan accounts missing users.venueId.
 */
export function useVendorVenue() {
  const [venueId, setVenueId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [canClaimZaydan, setCanClaimZaydan] = useState(false);

  const loadVenue = useCallback(async (currentUser) => {
    setError(null);
    setCanClaimZaydan(false);

    if (!currentUser) {
      setVenueId(null);
      setUserData(null);
      setIsLoading(false);
      return;
    }

    try {
      const userSnap = await getDoc(doc(db, "users", currentUser.uid));
      const data = userSnap.exists() ? userSnap.data() : null;
      setUserData(data);

      if (data?.role !== "vendor") {
        setVenueId(null);
        setIsLoading(false);
        return;
      }

      if (data?.pendingVendorOnboarding && !data?.venueId) {
        setVenueId(null);
        setIsLoading(false);
        return;
      }

      const resolved = await resolveVendorVenueId(currentUser.uid, data || {});
      if (resolved) {
        setVenueId(resolved);
        setIsLoading(false);
        return;
      }

      const zaydanSnap = await getDoc(doc(db, "venues", ZAYDAN_VENUE_SLUG));
      if (zaydanSnap.exists()) {
        const zaydan = zaydanSnap.data();
        const unclaimed = !zaydan.ownerId;
        const isOwner = zaydan.ownerId === currentUser.uid;
        setCanClaimZaydan(unclaimed || isOwner);
      }

      setVenueId(null);
    } catch (err) {
      console.error("[useVendorVenue]", err);
      setError(err.message);
      setVenueId(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      await loadVenue(currentUser);
    });
    return () => unsubscribe();
  }, [loadVenue]);

  const reconnectZaydan = useCallback(async () => {
    if (!user?.uid) return null;
    setIsLoading(true);
    setError(null);
    try {
      const { venueId: linked } = await linkVendorToVenue(user.uid, ZAYDAN_VENUE_SLUG);
      setVenueId(linked);
      setCanClaimZaydan(false);
      return linked;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const refresh = useCallback(() => {
    if (user) {
      setIsLoading(true);
      return loadVenue(user);
    }
    return Promise.resolve();
  }, [user, loadVenue]);

  return {
    venueId,
    isLoading,
    error,
    user,
    userData,
    hasVenue: Boolean(venueId),
    canClaimZaydan,
    reconnectZaydan,
    refresh,
    zaydanVenueSlug: ZAYDAN_VENUE_SLUG,
  };
}
