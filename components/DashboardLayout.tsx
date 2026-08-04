"use client";
import React from "react";
import Sidebar from "./Sidebar";
import Link from "next/link";
import { Bell, MessageSquare, Search, Settings, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const profileInitial = user?.name?.charAt(0)?.toUpperCase() || "D";
  const roleContext = user?.role === "teacher"
    ? [user.subject, user.department].filter(Boolean).join(" / ") || "Subject not assigned"
    : "Self-service organization workspace";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-slate-100">
      <Sidebar />
      <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/90 px-4 py-3 backdrop-blur-xl md:ml-64 md:px-8 dark:border-slate-800 dark:bg-slate-950/85">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0 pl-12 md:pl-0">
            <p className="truncate text-sm font-bold text-slate-500 dark:text-slate-400">{user?.institution || "DigiClassroom"}</p>
            <p className="truncate text-xs text-slate-400 dark:text-slate-500">{roleContext}</p>
          </div>
          <div className="hidden min-w-0 max-w-sm flex-1 items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500 lg:flex dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
            <Search size={17} />
            <span>{user?.role === "teacher" ? "Search classes, students, materials..." : "Search teachers, students, classes..."}</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/dashboard/messages" className="hidden h-10 w-10 place-items-center rounded-2xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 sm:grid dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
              <MessageSquare size={18} />
            </Link>
            <Link href="/dashboard/notifications" className="relative grid h-10 w-10 place-items-center rounded-2xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
              <Bell size={18} />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-slate-300" />
            </Link>
            <div className="hidden items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 md:flex dark:border-slate-800 dark:bg-slate-900">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-ocean/10 text-sm font-black text-ocean">
                {profileInitial}
              </div>
              <div className="min-w-0">
                <p className="max-w-36 truncate text-sm font-bold text-ink dark:text-white">{user?.name || "DigiClassroom User"}</p>
                <p className="max-w-36 truncate text-xs text-slate-400 capitalize">{user?.role || "user"}</p>
              </div>
              <Link href="/dashboard/profile" className="rounded-full p-1.5 text-slate-500 transition hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Profile">
                <User size={16} />
              </Link>
              <Link href="/dashboard/settings" className="rounded-full p-1.5 text-slate-500 transition hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Settings">
                <Settings size={16} />
              </Link>
            </div>
          </div>
        </div>
      </header>
      <main className="p-4 md:ml-64 md:p-8">
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
