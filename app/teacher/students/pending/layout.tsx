"use client";

import React from "react";
import ProtectedDashboardShell from "@/components/dashboard/ProtectedDashboardShell";

const TeacherPendingStudentsLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <ProtectedDashboardShell allowedRoles={["teacher"]}>{children}</ProtectedDashboardShell>;
};

export default TeacherPendingStudentsLayout;
