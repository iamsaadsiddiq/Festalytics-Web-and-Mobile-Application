"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";
import DashboardHeader from "./DashboardHeader";
import PublicHeader from "./PublicHeader";

export default function PublicSiteHeader() {
  const { user, loading, isUser } = useAuth();

  if (loading) {
    return <nav className="h-[68px] border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-50" />;
  }

  if (user && isUser) {
    return <DashboardHeader />;
  }

  return <PublicHeader />;
}
