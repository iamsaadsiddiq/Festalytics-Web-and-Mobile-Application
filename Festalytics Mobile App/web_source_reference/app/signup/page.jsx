"use client";

import { Suspense } from "react";
import SignupPage from "@/components/SignupPage";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

function SignupContent() {
  return <SignupPage />;
}

export default function Signup() {
  return (
    <>
      <Navbar />
      <Suspense fallback={<div className="min-h-[60vh] flex items-center justify-center">Loading…</div>}>
        <SignupContent />
      </Suspense>
      <Footer />
    </>
  );
}
