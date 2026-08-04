"use client";

import React from "react";
import ProtectedDashboardShell from "@/components/dashboard/ProtectedDashboardShell";

const StudentDashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <ProtectedDashboardShell allowedRoles={["student"]}>{children}</ProtectedDashboardShell>;
};

export default StudentDashboardLayout;
