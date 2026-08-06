"use client";

import React from "react";
import NetworkGuard from "@/components/vendor/inventory/NetworkGuard";

export default function MyInventoryLayout({ children }) {
  return <NetworkGuard>{children}</NetworkGuard>;
}
