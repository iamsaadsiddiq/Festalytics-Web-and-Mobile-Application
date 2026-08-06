"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  onAuthStateChanged,
  sendEmailVerification,
  signOut,
} from "firebase/auth";
import {
  deleteField,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { auth, db } from "@/firebase";
import { provisionVendorVenue } from "@/lib/firestore/vendorOnboarding";

export default function VerifyEmailPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setError("");
      setMessage("");

      if (!currentUser) {
        setUserData(null);
        setLoading(false);
        return;
      }

      try {
        const snap = await getDoc(doc(db, "users", currentUser.uid));
        setUserData(snap.exists() ? snap.data() : null);
      } catch (err) {
        setError(err.message || "Could not load your account.");
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const resendVerification = async () => {
    if (!user) return;

    setResending(true);
    setError("");
    setMessage("");

    try {
      await user.reload();
      const freshUser = auth.currentUser;
      if (freshUser?.emailVerified) {
        setMessage("Your email is already verified. Continue to finish setup.");
        return;
      }

      await sendEmailVerification(freshUser || user, {
        url: `${window.location.origin}/verify-email`,
      });
      setMessage("Verification email sent. Please check your inbox and spam folder.");
    } catch (err) {
      setError(err.message || "Could not resend verification email.");
    } finally {
      setResending(false);
    }
  };

  const continueAfterVerification = async () => {
    if (!user) {
      router.push("/");
      return;
    }

    setChecking(true);
    setError("");
    setMessage("");

    try {
      await user.reload();
      const freshUser = auth.currentUser;

      if (!freshUser?.emailVerified) {
        setError("Email is not verified yet. Click the link in your inbox, then try again.");
        return;
      }
      await freshUser.getIdToken(true);

      const userRef = doc(db, "users", freshUser.uid);
      const snap = await getDoc(userRef);
      if (!snap.exists()) {
        setError("Your account profile was not found. Please contact support.");
        return;
      }

      const data = snap.data();
      if (data.role !== "vendor") {
        await setDoc(
          userRef,
          {
            emailVerified: true,
            emailVerifiedAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
        router.push("/user-dashboard");
        return;
      }

      if (data.venueId) {
        await setDoc(
          userRef,
          {
            emailVerified: true,
            emailVerifiedAt: serverTimestamp(),
            pendingVendorOnboarding: deleteField(),
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
        router.push("/vendor-dashboard");
        return;
      }

      if (!data.pendingVendorOnboarding) {
        setError("Vendor details are missing. Please contact support before registering again.");
        return;
      }

      await provisionVendorVenue(freshUser.uid, data.pendingVendorOnboarding);
      await setDoc(
        userRef,
        {
          emailVerified: true,
          emailVerifiedAt: serverTimestamp(),
          pendingVendorOnboarding: deleteField(),
          onboardingComplete: true,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      router.push("/vendor-dashboard");
    } catch (err) {
      setError(err.message || "Could not finish verification.");
    } finally {
      setChecking(false);
    }
  };

  const logout = async () => {
    await signOut(auth);
    router.push("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <span className="animate-spin w-10 h-10 border-4 border-[#D6336C] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-slate-100 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-xl p-8 text-center">
        <div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-[#D6336C]/10 flex items-center justify-center">
          <span className="material-symbols-outlined text-[#D6336C] text-3xl">mark_email_unread</span>
        </div>

        <h1 className="text-2xl font-black text-slate-900 mb-2">Verify your email</h1>
        <p className="text-sm text-slate-500 mb-6">
          We sent a verification link to{" "}
          <span className="font-semibold text-slate-800">{user?.email || userData?.email || "your email"}</span>.
          Click that link, then return here to finish your vendor setup.
        </p>

        {!user && (
          <div className="rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm p-4 mb-5">
            Please log in with the same account after clicking the verification email.
          </div>
        )}

        {message && (
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm p-4 mb-5">
            {message}
          </div>
        )}

        {error && (
          <div className="rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm p-4 mb-5">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <button
            type="button"
            disabled={!user || checking}
            onClick={continueAfterVerification}
            className="w-full rounded-full bg-[#D6336C] text-white font-bold py-3 disabled:opacity-50 hover:bg-[#B02A58] transition-colors"
          >
            {checking ? "Checking..." : "I verified, continue"}
          </button>
          <button
            type="button"
            disabled={!user || resending}
            onClick={resendVerification}
            className="w-full rounded-full border border-slate-200 text-slate-700 font-bold py-3 disabled:opacity-50 hover:bg-slate-50 transition-colors"
          >
            {resending ? "Sending..." : "Resend verification email"}
          </button>
          <button
            type="button"
            onClick={logout}
            className="text-sm font-semibold text-slate-500 hover:text-slate-800"
          >
            Use another account
          </button>
        </div>
      </div>
    </div>
  );
}
