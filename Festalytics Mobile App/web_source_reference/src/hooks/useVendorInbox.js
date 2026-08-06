"use client";

import { useEffect, useMemo, useState } from "react";
import { listenVendorInbox } from "@/lib/firestore/chats";
import { mapChatRoomToSidebarThread } from "@/lib/chatUtils";

export function useVendorInbox(venueSlug) {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!venueSlug) {
      setRooms([]);
      setLoading(false);
      return undefined;
    }

    setLoading(true);
    setError(null);

    const unsubscribe = listenVendorInbox(
      venueSlug,
      (nextRooms) => {
        setRooms(nextRooms);
        setLoading(false);
      },
      (err) => {
        setError(err.message || "Failed to load inbox.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [venueSlug]);

  const threads = useMemo(
    () => rooms.map(mapChatRoomToSidebarThread),
    [rooms]
  );

  return { rooms, threads, loading, error };
}
