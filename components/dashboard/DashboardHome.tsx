"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Award, BarChart3, BookOpen, Calendar, ClipboardList, FileText, Laptop, Sparkles, Users } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { defaultAssignments, defaultExams, materials, type Assignment, type Classroom, type Exam } from "@/lib/student/data";

const DashboardHome: React.FC = () => {
  const { user } = useAuth();
  const enrolled: Classroom[] = [];
  const assignments: Assignment[] = defaultAssignments;
  const exams: Exam[] = defaultExams;

  const pendingAssignments = assignments.filter((item) => item.status === "pending").length;
  const completedExams = exams.filter((item) => item.status === "completed").length;

  if (user?.role === "teacher") {
    const teacherStats = [
      { icon: Calendar, label: "Today's Classes", value: "4", color: "bg-blue-100 text-blue-600" },
      { icon: BookOpen, label: "Uploaded Notes", value: "28", color: "bg-green-100 text-green-600" },
      { icon: FileText, label: "Pending Assignments", value: "17", color: "bg-amber-100 text-amber-700" },
      { icon: ClipboardList, label: "Question Bank", value: "156", color: "bg-cyan-100 text-cyan-700" },
      { icon: Users, label: "Student Attendance", value: "91%", color: "bg-purple-100 text-purple-700" },
      { icon: Laptop, label: "Upcoming Exams", value: "3", color: "bg-rose-100 text-rose-700" }
    ];

    const activity = [
      "New student joined Data Structures",
      "Linked List Assignment received 8 submissions",
      "Unit 1 Notes uploaded successfully",
      "DBMS exam created for CSE 2nd Year",
      "Attendance updated for today"
    ];

    return (
      <div className="space-y-8">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-ocean">Teacher Dashboard</p>
            <h1 className="mt-2 text-3xl font-black text-ink">Good morning, {user.name}</h1>
            <p className="mt-1 text-slate-600">Manage live classes, assignments, notes, questions, and attendance.</p>
          </div>
          <Link href="/dashboard/live-classes" className="rounded-xl bg-ocean px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-700">
            Start live class
          </Link>
        </motion.div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {teacherStats.map((stat, index) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className={`grid h-12 w-12 place-items-center rounded-xl ${stat.color}`}>
                <stat.icon size={23} />
              </div>
              <p className="mt-5 text-3xl font-black text-ink">{stat.value}</p>
              <p className="text-sm font-medium text-slate-500">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black text-ink">Today&apos;s Classes</h2>
            <div className="mt-5 space-y-3">
              {[
                ["10:00 AM", "Data Structures", "CSE 3rd Year"],
                ["12:00 PM", "DBMS", "CSE 2nd Year"],
                ["03:00 PM", "Operating Systems", "CSE 3rd Year"]
              ].map(([time, subject, className]) => (
                <div key={`${time}-${subject}`} className="flex flex-col gap-3 rounded-2xl border border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-black text-ink">{subject}</p>
                    <p className="text-sm text-slate-500">{className} · {time}</p>
                  </div>
                  <Link href={`/dashboard/live-classes?room=${subject.toLowerCase().replaceAll(" ", "-")}`} className="w-fit rounded-xl bg-ocean px-4 py-2 text-sm font-bold text-white">Start Class</Link>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-black text-ink">Recent Activity</h2>
              <BarChart3 className="text-ocean" size={22} />
            </div>
            <div className="space-y-3">
              {activity.map((item) => (
                <div key={item} className="rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-700">{item}</div>
              ))}
            </div>
          </section>
        </div>
      </div>
    );
  }

  const stats = [
    { icon: BookOpen, label: "Joined Classes", value: enrolled.length.toString(), color: "bg-blue-100 text-blue-600" },
    { icon: FileText, label: "Pending Work", value: pendingAssignments.toString(), color: "bg-amber-100 text-amber-600" },
    { icon: Laptop, label: "Completed Exams", value: completedExams.toString(), color: "bg-green-100 text-green-600" },
    { icon: Award, label: "Average Score", value: completedExams ? `${Math.round(exams.reduce((sum, item) => sum + (item.score || 0), 0) / completedExams)}%` : "0%", color: "bg-cyan-100 text-cyan-600" }
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
          <div className="grid gap-4 md:grid-cols-3">
            {materials.map((item) => (
              <div key={item.id} className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-ocean">{item.type}</p>
                <h3 className="mt-2 font-bold text-ink">{item.title}</h3>
                <p className="mt-1 text-sm text-slate-500">{item.subject} · {item.size}</p>
              </div>
            ))}
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
          {assignments.slice(0, 3).map((item) => (
            <div key={item.id} className="flex flex-col gap-3 rounded-2xl border border-slate-100 p-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="font-bold text-ink">{item.title}</h3>
                <p className="text-sm text-slate-500">{item.subject} · due {item.dueDate}</p>
              </div>
              <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-bold capitalize text-slate-600">{item.status}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default DashboardHome;
