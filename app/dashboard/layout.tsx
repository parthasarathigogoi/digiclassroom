"use client";
import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import { getDashboardRouteByRole, useAuth } from "@/contexts/AuthContext";

const AppDashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!user) {
      router.replace("/login");
      return;
    }

    if (user.role === "organizer") {
      router.replace(getDashboardRouteByRole(user.role));
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-pulse text-slate-500">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (user.role === "organizer") {
    return null;
  }

  return <DashboardLayout>{children}</DashboardLayout>;
};

export default AppDashboardLayout;
