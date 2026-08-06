"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/firebase";
import AuthGateModal from "@/components/auth/AuthGateModal";
import {
  clearPendingAction,
  loadPendingAction,
  savePendingAction,
} from "@/lib/auth/pendingActions";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authGateOpen, setAuthGateOpen] = useState(false);
  const [authGateAction, setAuthGateAction] = useState("login");
  const pendingCallbackRef = useRef(null);

  const isUser = role === "user";
  const isVendor = role === "vendor";

  const closeAuthGate = useCallback(() => {
    pendingCallbackRef.current = null;
    setAuthGateOpen(false);
    setAuthGateAction("login");
  }, []);

  const openAuthGate = useCallback((action = "login") => {
    setAuthGateAction(action);
    setAuthGateOpen(true);
  }, []);

  const resumePendingAction = useCallback(() => {
    const callback = pendingCallbackRef.current;
    pendingCallbackRef.current = null;
    clearPendingAction();
    closeAuthGate();
    if (callback) {
      setTimeout(() => callback(), 0);
    }
  }, [closeAuthGate]);

  const handleAuthSuccess = useCallback(() => {
    resumePendingAction();
  }, [resumePendingAction]);

  const requireAuth = useCallback(
    ({ action, payload = {}, onAuthed }) => {
      if (user && isUser) {
        onAuthed?.();
        return true;
      }

      savePendingAction(action, payload);
      pendingCallbackRef.current = onAuthed || null;
      openAuthGate(action);
      return false;
    },
    [user, isUser, openAuthGate]
  );

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (!currentUser) {
        setRole(null);
        setLoading(false);
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (userDoc.exists()) {
          setRole(userDoc.data().role || null);
        } else {
          setRole(null);
        }
      } catch (err) {
        console.error("[AuthProvider] role fetch:", err);
        setRole(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (loading || !user || !isUser) return;
    if (!pendingCallbackRef.current) return;
    resumePendingAction();
  }, [loading, user, isUser, resumePendingAction]);

  const value = {
    user,
    role,
    loading,
    isUser,
    isVendor,
    authGateOpen,
    authGateAction,
    openAuthGate,
    closeAuthGate,
    requireAuth,
    handleAuthSuccess,
    loadPendingAction,
    clearPendingAction,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
      <AuthGateModal
        open={authGateOpen}
        action={authGateAction}
        onClose={closeAuthGate}
        onSuccess={handleAuthSuccess}
      />
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
