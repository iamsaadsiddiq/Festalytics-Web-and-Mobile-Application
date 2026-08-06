"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import ManageEvent from "@/components/ManageEvent";

export default function ManageEventPage() {
  return (
    <ProtectedRoute allowedRole="user">
      <ManageEvent />
    </ProtectedRoute>
  );
}
