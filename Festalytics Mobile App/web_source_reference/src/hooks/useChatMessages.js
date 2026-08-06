"use client";

import { useEffect, useMemo, useState } from "react";
import { listenChatMessages } from "@/lib/firestore/chats";
import { mapFirestoreMessageToUi } from "@/lib/chatUtils";

export function useChatMessages(chatId, { venueSlug, customerName, customerAvatar } = {}) {
  const [rawMessages, setRawMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!chatId) {
      setRawMessages([]);
      setLoading(false);
      return undefined;
    }

    setLoading(true);
    setError(null);

    const unsubscribe = listenChatMessages(
      chatId,
      (msgs) => {
        setRawMessages(msgs);
        setLoading(false);
      },
      (err) => {
        setError(err.message || "Failed to load messages.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [chatId]);

  const messages = useMemo(
    () =>
      rawMessages.map((msg) =>
        mapFirestoreMessageToUi(msg, { venueSlug, customerName, customerAvatar })
      ),
    [rawMessages, venueSlug, customerName, customerAvatar]
  );

  return { messages, rawMessages, loading, error };
}
