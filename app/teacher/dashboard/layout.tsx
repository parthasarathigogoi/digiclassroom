"use client";

import React from "react";
import ProtectedDashboardShell from "@/components/dashboard/ProtectedDashboardShell";

const TeacherDashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <ProtectedDashboardShell allowedRoles={["teacher"]}>{children}</ProtectedDashboardShell>;
};

export default TeacherDashboardLayout;
