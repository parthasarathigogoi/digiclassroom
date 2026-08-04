"use client";
import React from "react";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "sonner";

interface ClientLayoutProps {
  children: React.ReactNode;
}

const ClientLayout: React.FC<ClientLayoutProps> = ({ children }) => {
  return (
    <AuthProvider>
      {children}
      <Toaster position="top-right" />
    </AuthProvider>
  );
};

export default ClientLayout;