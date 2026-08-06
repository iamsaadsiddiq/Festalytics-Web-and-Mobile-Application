"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  signInWithEmailAndPassword,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  signOut,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/firebase";

export default function AuthGateLoginForm({ onSuccess, onClose }) {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const getErrorMessage = (errorCode) => {
    switch (errorCode) {
      case "auth/invalid-email":
        return "Invalid email address format.";
      case "auth/user-disabled":
        return "This account has been disabled.";
      case "auth/user-not-found":
        return "No account found with this email address.";
      case "auth/wrong-password":
        return "Incorrect password. Please try again.";
      case "auth/too-many-requests":
        return "Too many failed login attempts. Please try again later.";
      case "auth/network-request-failed":
        return "Network error. Please check your internet connection.";
      case "auth/invalid-credential":
        return "Invalid credentials. Please check your email and password.";
      default:
        return "Login failed. Please check your credentials and try again.";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const persistence = rememberMe
        ? browserLocalPersistence
        : browserSessionPersistence;
      await setPersistence(auth, persistence);

      const userCredential = await signInWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );
      const user = userCredential.user;
      const userDoc = await getDoc(doc(db, "users", user.uid));

      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.role === "vendor") {
          throw new Error("ROLE_MISMATCH_VENDOR");
        }
      }

      setLoading(false);
      onSuccess?.();
      onClose?.();
    } catch (err) {
      setLoading(false);
      if (err.message === "ROLE_MISMATCH_VENDOR") {
        setError("This account is registered as a Vendor. Please use the vendor portal.");
        await signOut(auth);
      } else {
        setError(getErrorMessage(err.code));
      }
    }
  };

  return (
    <form className="px-8 pb-8 flex flex-col gap-4" onSubmit={handleSubmit}>
      {error && (
        <div className="p-3 rounded-lg text-sm bg-red-50 text-red-700 border border-red-100">
          {error}
          {error.includes("Vendor") && (
            <p className="mt-2">
              <Link href="/login?type=vendor" className="font-semibold text-[#D6336C] hover:underline">
                Go to Vendor Portal →
              </Link>
            </p>
          )}
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="gate-email" className="text-sm font-semibold text-gray-700">
          Email
        </label>
        <input
          type="email"
          id="gate-email"
          name="email"
          value={formData.email}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, email: e.target.value }))
          }
          placeholder="you@example.com"
          required
          disabled={loading}
          className="p-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#D6336C] focus:ring-2 focus:ring-[#D6336C]/20"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="gate-password" className="text-sm font-semibold text-gray-700">
          Password
        </label>
        <input
          type="password"
          id="gate-password"
          name="password"
          value={formData.password}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, password: e.target.value }))
          }
          placeholder="Enter your password"
          required
          disabled={loading}
          className="p-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#D6336C] focus:ring-2 focus:ring-[#D6336C]/20"
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
        <input
          type="checkbox"
          checked={rememberMe}
          onChange={(e) => setRememberMe(e.target.checked)}
          disabled={loading}
          className="accent-[#D6336C]"
        />
        Remember me
      </label>

      <button
        type="submit"
        disabled={loading}
        className="mt-1 py-3.5 bg-[#D6336C] text-white rounded-xl font-semibold border-0 cursor-pointer hover:bg-[#C2255C] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? "Logging in…" : "Log in"}
      </button>
    </form>
  );
}
