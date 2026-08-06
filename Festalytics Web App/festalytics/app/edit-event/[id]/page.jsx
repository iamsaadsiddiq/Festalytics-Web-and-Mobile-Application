"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import CreateEvent from "@/components/create-event/CreateEvent";

export default function EditEventPage() {
  return (
    <ProtectedRoute allowedRole="user">
      <CreateEvent />
    </ProtectedRoute>
  );
}
