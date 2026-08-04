"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Award, BarChart3, Bell, BookOpen, Calendar, ClipboardCheck, ClipboardList, FileQuestion, FileText, Laptop, MessageSquare, Sparkles, Users } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const DashboardHome: React.FC = () => {
  const { user } = useAuth();

  if (user?.role === "teacher") {
    const teacherName = user.name || "Teacher";
    const subjectDepartment = [user.subject, user.department].filter(Boolean).join(" / ") || "Subject not assigned";
    const teacherStats = [
      { icon: Calendar, label: "Today's Classes", value: "0", detail: "No classes scheduled yet", color: "bg-blue-100 text-blue-600" },
      { icon: Users, label: "Total Students", value: "0", detail: "No students assigned yet", color: "bg-emerald-100 text-emerald-700" },
      { icon: BookOpen, label: "Uploaded Notes", value: "0", detail: "No materials uploaded yet", color: "bg-cyan-100 text-cyan-700" },
      { icon: FileText, label: "Pending Reviews", value: "0", detail: "No submissions waiting", color: "bg-amber-100 text-amber-700" },
      { icon: FileQuestion, label: "Question Bank", value: "0", detail: "No questions added yet", color: "bg-indigo-100 text-indigo-700" },
      { icon: Laptop, label: "Upcoming Exams", value: "0", detail: "No exams scheduled", color: "bg-rose-100 text-rose-700" },
      { icon: ClipboardCheck, label: "Attendance", value: "0%", detail: "No attendance records yet", color: "bg-violet-100 text-violet-700" },
      { icon: Bell, label: "Notifications", value: "0", detail: "No unread alerts", color: "bg-slate-100 text-slate-700" }
    ];

    const quickActions = [
      { href: "/dashboard/live-classes", icon: Calendar, label: "Today’s Classes", description: "Review scheduled classes and start live sessions." },
      { href: "/dashboard/study-materials", icon: BookOpen, label: "Upload Materials", description: "Add notes, documents, slides, links, and recordings." },
      { href: "/dashboard/assignments", icon: FileText, label: "Create Assignment", description: "Publish assignments and review student submissions." },
      { href: "/dashboard/question-bank", icon: FileQuestion, label: "Question Bank", description: "Build reusable questions for examinations." },
      { href: "/dashboard/online-exams", icon: Laptop, label: "Examinations", description: "Create, schedule, evaluate, and publish exam results." },
      { href: "/dashboard/analytics", icon: BarChart3, label: "Student Analysis", description: "Track performance, weak topics, and attendance trends." }
    ];

    return (
      <div className="space-y-8">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-ocean">Teacher Dashboard</p>
            <h1 className="mt-2 text-3xl font-black text-ink dark:text-white">Good Morning, {teacherName}</h1>
            <p className="mt-1 text-slate-600 dark:text-slate-400">{subjectDepartment} · {user.institution || "DigiClassroom"}</p>
          </div>
          <Link href="/dashboard/live-classes" className="rounded-xl bg-ocean px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-700">
            View Today’s Classes
          </Link>
        </motion.div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {teacherStats.map((stat, index) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900">
              <div className={`grid h-12 w-12 place-items-center rounded-xl ${stat.color}`}>
                <stat.icon size={23} />
              </div>
              <p className="mt-5 text-3xl font-black text-ink dark:text-white">{stat.value}</p>
              <p className="text-sm font-bold text-slate-600 dark:text-slate-300">{stat.label}</p>
              <p className="mt-1 text-xs font-medium text-slate-400">{stat.detail}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-xl font-black text-ink dark:text-white">Today&apos;s Classes</h2>
            <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center dark:border-slate-700 dark:bg-slate-950">
              <Calendar className="mx-auto text-ocean" size={30} />
              <h3 className="mt-4 font-black text-ink dark:text-white">No classes scheduled for today</h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">Classes assigned by the organizer or created by this teacher will appear here with live class, notes, attendance, and student actions.</p>
              <Link href="/dashboard/live-classes" className="mt-5 inline-flex rounded-xl bg-ocean px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-700">
                Open Classes
              </Link>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-5 flex items-center justify-between gap-4">
              <h2 className="text-xl font-black text-ink dark:text-white">Quick Actions</h2>
              <Sparkles className="text-ocean" size={22} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {quickActions.map((item) => (
                <Link key={item.href} href={item.href} className="rounded-2xl border border-slate-100 bg-slate-50 p-4 transition hover:border-blue-200 hover:bg-white hover:shadow-md dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-900">
                  <item.icon className="text-ocean" size={22} />
                  <h3 className="mt-3 font-black text-ink dark:text-white">{item.label}</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">{item.description}</p>
                </Link>
              ))}
            </div>
          </section>
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-black text-ink dark:text-white">Recent Notifications</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">New student joins, assignment submissions, exam attempts, organizer announcements, and live class reminders will appear here.</p>
            </div>
            <Link href="/dashboard/notifications" className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-800">
              <MessageSquare size={16} />
              Notifications
            </Link>
          </div>
          <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm font-medium text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400">
            No notifications yet.
          </div>
        </section>
      </div>
    );
  }

  const stats = [
    { icon: BookOpen, label: "Joined Classes", value: "0", color: "bg-blue-100 text-blue-600" },
    { icon: FileText, label: "Pending Work", value: "0", color: "bg-amber-100 text-amber-600" },
    { icon: Laptop, label: "Completed Exams", value: "0", color: "bg-green-100 text-green-600" },
    { icon: Award, label: "Average Score", value: "0%", color: "bg-cyan-100 text-cyan-600" }
  ];

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-ocean">Student Dashboard</p>
          <h1 className="mt-2 text-3xl font-black text-ink">Welcome back, {user?.name || "Student"}</h1>
          <p className="mt-1 text-slate-600">Your learning space at {user?.institution}</p>
        </div>
        <Link href="/dashboard/classrooms" className="rounded-xl bg-ocean px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-700">
          Join a class
        </Link>
      </motion.div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat, index) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.06 }} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className={`grid h-12 w-12 place-items-center rounded-xl ${stat.color}`}>
              <stat.icon size={23} />
            </div>
            <p className="mt-5 text-3xl font-black text-ink">{stat.value}</p>
            <p className="text-sm font-medium text-slate-500">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-black text-ink">Today&apos;s Learning</h2>
            <Calendar className="text-ocean" size={22} />
          </div>
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm font-medium text-slate-500">
            No study materials are available for your allocated class yet.
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-ink p-6 text-white shadow-sm">
          <Sparkles className="text-cyan-200" size={26} />
          <h2 className="mt-4 text-xl font-black">AI Learning Assistant</h2>
          <p className="mt-2 text-sm leading-6 text-blue-100">Ask doubts, generate quick quizzes, and make revision plans from your study material.</p>
          <Link href="/dashboard/ai" className="mt-5 inline-flex rounded-xl bg-white px-4 py-3 text-sm font-bold text-ink transition hover:bg-cyan-50">
            Open assistant
          </Link>
        </section>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-black text-ink">Pending Assignments</h2>
          <ClipboardList className="text-ocean" size={22} />
        </div>
        <div className="space-y-3">
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm font-medium text-slate-500">
            No assignments have been assigned to your class yet.
          </div>
        </div>
      </section>
    </div>
  );
};

export default DashboardHome;
