"use client";

import React from "react";
import ProtectedDashboardShell from "@/components/dashboard/ProtectedDashboardShell";

const OrganizerLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <ProtectedDashboardShell allowedRoles={["organizer"]}>{children}</ProtectedDashboardShell>;
};

export default OrganizerLayout;
