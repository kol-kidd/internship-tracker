import { Navigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import type React from "react";

export default function GuestRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuthStore();

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
