"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import UserDashboard from "@/components/UserDashboard";

export default function UserDashboardPage() {
  return (
    <ProtectedRoute allowedRole="user">
      <UserDashboard />
    </ProtectedRoute>
  );
}
