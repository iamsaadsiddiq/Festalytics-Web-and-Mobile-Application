"use client";

import { Suspense } from "react";
import Login from "@/components/Login";

function LoginContent() {
  return <Login />;
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center text-white">
          Loading…
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
