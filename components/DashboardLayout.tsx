"use client";
import React from "react";
import Sidebar from "./Sidebar";
import { Bell, Search } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-slate-100">
      <Sidebar />
      <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/90 px-4 py-3 backdrop-blur-xl md:ml-64 md:px-8 dark:border-slate-800 dark:bg-slate-950/85">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0 pl-12 md:pl-0">
            <p className="truncate text-sm font-bold text-slate-500 dark:text-slate-400">{user?.institution || "DigiClassroom"}</p>
            <p className="truncate text-xs text-slate-400 dark:text-slate-500">Self-service organization workspace</p>
          </div>
          <div className="hidden min-w-0 max-w-sm flex-1 items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500 lg:flex dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
            <Search size={17} />
            <span>Search teachers, students, classes...</span>
          </div>
          <button className="grid h-10 w-10 place-items-center rounded-2xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
            <Bell size={18} />
          </button>
        </div>
      </header>
      <main className="p-4 md:ml-64 md:p-8">
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
