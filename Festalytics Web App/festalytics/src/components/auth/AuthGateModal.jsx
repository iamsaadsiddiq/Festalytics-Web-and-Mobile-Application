"use client";

import React, { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import AuthGateLoginForm from "./AuthGateLoginForm";

const ACTION_COPY = {
  quote: {
    title: "Sign in to request a quote",
    body: "Create a free account or log in to send your quotation to the venue.",
  },
  chat: {
    title: "Sign in to message the venue",
    body: "Log in to send inquiries and respond to offers from this venue.",
  },
  decor: {
    title: "Sign in to analyze your decor",
    body: "Upload inspiration photos after signing in — we'll match colors, style, and vendors.",
  },
  ai: {
    title: "Sign in to chat with AI Planner",
    body: "Get personalized venue, budget, and timeline suggestions with a free account.",
  },
  login: {
    title: "Welcome back",
    body: "Log in to continue planning your event on Festalytics.",
  },
};

export default function AuthGateModal({ open, action = "login", onClose, onSuccess }) {
  const router = useRouter();
  const pathname = usePathname();
  const [tab, setTab] = useState("login");
  const copy = ACTION_COPY[action] || ACTION_COPY.login;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute top-6 right-6 w-10 h-10 rounded-full border border-white/20 bg-white/10 text-2xl text-white cursor-pointer hover:bg-[#D6336C] hover:border-[#D6336C] transition-colors"
      >
        ×
      </button>

      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-[slideUp_0.25s_ease]">
        <div className="px-8 pt-8 pb-5 border-b border-gray-100 bg-gradient-to-br from-pink-50 to-white">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#D6336C] mb-2">
            Festalytics
          </p>
          <h2 className="text-2xl font-bold text-gray-900">{copy.title}</h2>
          <p className="text-sm text-gray-500 mt-2">{copy.body}</p>
        </div>

        <div className="px-8 pt-4">
          <div className="flex gap-1 p-1 bg-gray-100 rounded-xl mb-6">
            <button
              type="button"
              onClick={() => setTab("login")}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-colors cursor-pointer border-0 ${
                tab === "login"
                  ? "bg-white text-[#D6336C] shadow-sm"
                  : "bg-transparent text-gray-500 hover:text-gray-800"
              }`}
            >
              Log in
            </button>
            <button
              type="button"
              onClick={() => setTab("signup")}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-colors cursor-pointer border-0 ${
                tab === "signup"
                  ? "bg-white text-[#D6336C] shadow-sm"
                  : "bg-transparent text-gray-500 hover:text-gray-800"
              }`}
            >
              Sign up
            </button>
          </div>
        </div>

        {tab === "login" ? (
          <AuthGateLoginForm onSuccess={onSuccess} onClose={onClose} />
        ) : (
          <div className="px-8 pb-8 text-center">
            <p className="text-sm text-gray-600 mb-5">
              Create a free Festalytics account to save quotes, chat with venues, and plan your event.
            </p>
            <button
              type="button"
              onClick={() => {
                onClose?.();
                const returnUrl = encodeURIComponent(pathname || "/");
                router.push(`/signup?returnUrl=${returnUrl}`);
              }}
              className="w-full py-3.5 bg-[#D6336C] text-white rounded-xl font-semibold border-0 cursor-pointer hover:bg-[#C2255C] transition-colors"
            >
              Continue to Sign up
            </button>
            <p className="text-xs text-gray-400 mt-4">
              After signing up you&apos;ll return here to finish what you started.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
