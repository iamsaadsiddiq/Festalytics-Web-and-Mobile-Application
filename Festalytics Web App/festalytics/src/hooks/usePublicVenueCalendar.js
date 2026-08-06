"use client";

import { useState, useEffect, useMemo } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { db, auth } from "@/firebase";
import {
  subscribeVenueCalendar,
  getDateStatus,
  normalizeLegacyDayNumbers,
} from "@/lib/firestore/venueCalendar";

/**
 * Read-only venue calendar for customer-facing pages (e.g. /venue/1).
 * Venue doc fields are public; bookings/quotations listeners only when signed in.
 */
export function usePublicVenueCalendar(venueSlug) {
  const [viewYear, setViewYear] = useState(() => new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(() => new Date().getMonth());
  const [blockedDates, setBlockedDates] = useState([]);
  const [blackoutDates, setBlackoutDates] = useState([]);
  const [firestoreBookings, setFirestoreBookings] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!venueSlug) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const unsubVenue = subscribeVenueCalendar(venueSlug, (data) => {
      if (data) {
        let blocked = Array.isArray(data.blockedDates) ? data.blockedDates : [];
        const booked = Array.isArray(data.bookedDates) ? data.bookedDates : [];
        if (blocked.length && typeof blocked[0] === "number") {
          blocked = normalizeLegacyDayNumbers(blocked, viewYear, viewMonth);
        } else if (!blocked.length && booked.length && typeof booked[0] === "number") {
          blocked = normalizeLegacyDayNumbers(booked, viewYear, viewMonth);
        }
        let blackout = Array.isArray(data.blackoutDates) ? data.blackoutDates : [];
        if (blackout.length && typeof blackout[0] === "number") {
          blackout = normalizeLegacyDayNumbers(blackout, viewYear, viewMonth);
        }
        setBlockedDates([...new Set([...blocked, ...booked.filter((d) => typeof d === "string")])]);
        setBlackoutDates(blackout);
      }
      setIsLoading(false);
    });

    let unsubBookings = null;
    let unsubQuotations = null;

    const clearPrivateData = () => {
      setFirestoreBookings([]);
      setQuotations([]);
    };

    const attachPrivateListeners = () => {
      unsubBookings = onSnapshot(
        collection(db, "bookings"),
        (snap) => {
          const list = snap.docs
            .map((d) => ({ docId: d.id, ...d.data() }))
            .filter(
              (b) =>
                b.targetVenueId === venueSlug || b.eventDetails?.venueId === venueSlug
            );
          setFirestoreBookings(list);
        },
        (err) => console.warn("[usePublicVenueCalendar] bookings:", err.message)
      );

      unsubQuotations = onSnapshot(
        collection(db, "quotations"),
        (snap) => {
          const list = snap.docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .filter((q) => q.targetVenueId === venueSlug);
          setQuotations(list);
        },
        (err) => console.warn("[usePublicVenueCalendar] quotations:", err.message)
      );
    };

    const detachPrivateListeners = () => {
      if (unsubBookings) {
        unsubBookings();
        unsubBookings = null;
      }
      if (unsubQuotations) {
        unsubQuotations();
        unsubQuotations = null;
      }
    };

    const authUnsub = onAuthStateChanged(auth, (user) => {
      detachPrivateListeners();
      if (user) {
        attachPrivateListeners();
      } else {
        clearPrivateData();
      }
    });

    return () => {
      unsubVenue();
      authUnsub();
      detachPrivateListeners();
    };
  }, [venueSlug, viewYear, viewMonth]);

  const pendingDates = useMemo(() => {
    const dates = new Set();
    quotations
      .filter((q) => q.status === "pending_vendor_approval")
      .forEach((q) => q.eventDate && dates.add(q.eventDate));
    firestoreBookings
      .filter((b) => {
        const s = (b.status || "").toLowerCase();
        return s === "pending" || s === "quote request" || s === "counter offer";
      })
      .forEach((b) => {
        const d = b.eventDetails?.date;
        if (d) dates.add(d);
      });
    return Array.from(dates);
  }, [quotations, firestoreBookings]);

  const bookingDatesFromFirestore = useMemo(() => {
    const dates = new Set(blockedDates);
    firestoreBookings
      .filter((b) => {
        const s = (b.status || "").toLowerCase();
        return s === "confirmed" || s === "completed";
      })
      .forEach((b) => {
        const d = b.eventDetails?.date;
        if (d) dates.add(d);
      });
    return Array.from(dates);
  }, [blockedDates, firestoreBookings]);

  const calendarMeta = useMemo(
    () => ({
      blockedDates: bookingDatesFromFirestore,
      blackoutDates,
      pendingDates,
    }),
    [bookingDatesFromFirestore, blackoutDates, pendingDates]
  );

  const isDateSelectable = (dateKey) => {
    if (!dateKey) return false;
    const status = getDateStatus(dateKey, calendarMeta);
    return status === "available";
  };

  const isDateUnavailable = (dateKey) => {
    if (!dateKey) return true;
    const status = getDateStatus(dateKey, calendarMeta);
    return status !== "available";
  };

  const goToPrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const goToNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  return {
    viewYear,
    viewMonth,
    calendarMeta,
    isLoading,
    getStatus: (dateKey) => getDateStatus(dateKey, calendarMeta),
    isDateSelectable,
    isDateUnavailable,
    goToPrevMonth,
    goToNextMonth,
    unavailableDateKeys: useMemo(() => {
      const set = new Set([
        ...bookingDatesFromFirestore,
        ...blackoutDates,
        ...pendingDates,
      ]);
      return Array.from(set);
    }, [bookingDatesFromFirestore, blackoutDates, pendingDates]),
  };
}
