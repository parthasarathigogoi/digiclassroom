"use client";

import React from "react";
import Link from "next/link";
import {
  Activity,
  BarChart3,
  BookOpen,
  CalendarCheck,
  ClipboardList,
  GraduationCap,
  MailPlus,
  Presentation,
  UserCheck,
  Users,
  Video
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const OrganizerDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const stats = [
    { icon: GraduationCap, label: "Total Students", value: "1,248", detail: "+84 this month", color: "bg-blue-100 text-blue-700" },
    { icon: Users, label: "Total Teachers", value: "64", detail: "12 departments", color: "bg-emerald-100 text-emerald-700" },
    { icon: Presentation, label: "Total Classes", value: "38", detail: "6 active batches", color: "bg-cyan-100 text-cyan-700" },
    { icon: BookOpen, label: "Total Subjects", value: "112", detail: "Mapped to classes", color: "bg-violet-100 text-violet-700" },
    { icon: ClipboardList, label: "Active Assignments", value: "27", detail: "9 due this week", color: "bg-amber-100 text-amber-700" },
    { icon: BarChart3, label: "Scheduled Exams", value: "14", detail: "Next: Friday", color: "bg-rose-100 text-rose-700" },
    { icon: Video, label: "Live Classes Today", value: "8", detail: "3 running now", color: "bg-indigo-100 text-indigo-700" },
    { icon: CalendarCheck, label: "Attendance Percentage", value: "92%", detail: "+3% vs last week", color: "bg-teal-100 text-teal-700" }
  ];
  const workflows = [
    { href: "/organizer/teachers", icon: MailPlus, title: "Invite Teachers", text: "Add Gmail-based teacher invitations and assign departments or subjects." },
    { href: "/organizer/students", icon: UserCheck, title: "Approve Students", text: "Review join-code requests before students access classroom content." },
    { href: "/organizer/classes", icon: Presentation, title: "Create Classes", text: "Set up sections and class join codes for teacher-managed onboarding." },
    { href: "/organizer/settings", icon: Activity, title: "Configure Organization", text: "Update profile, branding, notifications, and security settings." }
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-ocean">Organizer Dashboard</p>
          <h1 className="mt-2 text-3xl font-black text-ink dark:text-white">Welcome, {user?.name}</h1>
          <p className="mt-1 text-slate-600 dark:text-slate-400">Manage {user?.institution || "your organization"} as a self-service DigiClassroom workspace.</p>
        </div>
        <Link href="/organizer/teachers" className="inline-flex w-fit items-center gap-2 rounded-xl bg-ocean px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-700">
          <MailPlus size={18} />
          Invite Teacher
        </Link>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900">
            <div className={`grid h-12 w-12 place-items-center rounded-xl ${stat.color}`}>
              <stat.icon size={23} />
            </div>
            <p className="mt-5 text-3xl font-black text-ink dark:text-white">{stat.value}</p>
            <p className="text-sm font-bold text-slate-600 dark:text-slate-300">{stat.label}</p>
            <p className="mt-1 text-xs font-medium text-slate-400">{stat.detail}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-xl font-black text-ink dark:text-white">Organization Workflows</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {workflows.map((item) => (
              <Link key={item.title} href={item.href} className="rounded-2xl border border-slate-100 bg-slate-50 p-5 transition hover:border-blue-200 hover:bg-white hover:shadow-md dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-900">
                <item.icon className="text-ocean" size={24} />
                <h3 className="mt-4 font-black text-ink dark:text-white">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">{item.text}</p>
              </Link>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-ink p-6 text-white shadow-sm dark:border-slate-800">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-cyan-200">Workspace Status</p>
          <h2 className="mt-3 text-2xl font-black">{user?.institution || "DigiClassroom"}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">Organization is active. No external approval is required for setup, configuration, teacher invitations, or student approvals.</p>
          <div className="mt-6 space-y-3 text-sm">
            {["Organization workspace created", "Organizer account active", "Teacher invitation flow enabled", "Student approval queue ready"].map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default OrganizerDashboardPage;
