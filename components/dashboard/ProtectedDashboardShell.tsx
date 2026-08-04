"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import { getDashboardRouteByRole, type UserRole, useAuth } from "@/contexts/AuthContext";

type ProtectedDashboardShellProps = {
  allowedRoles: UserRole[];
  children: React.ReactNode;
};

const ProtectedDashboardShell: React.FC<ProtectedDashboardShellProps> = ({ allowedRoles, children }) => {
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

    if (!allowedRoles.includes(user.role)) {
      router.replace(getDashboardRouteByRole(user.role));
    }
  }, [allowedRoles, isLoading, router, user]);

  if (isLoading || !user || !allowedRoles.includes(user.role)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-sm font-medium text-slate-500">Loading your workspace...</div>
      </div>
    );
  }

  return <DashboardLayout>{children}</DashboardLayout>;
};

export default ProtectedDashboardShell;
