"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import MyEvents from "@/components/MyEvents";

export default function MyEventsPage() {
  return (
    <ProtectedRoute allowedRole="user">
      <MyEvents />
    </ProtectedRoute>
  );
}
