import { Navigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import type React from "react";

export default function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuthStore();

  // ⏳ Wait for auth hydration
  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
