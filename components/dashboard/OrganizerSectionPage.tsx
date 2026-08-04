"use client";

import React from "react";
import Link from "next/link";
import {
  Award,
  BarChart3,
  BookOpen,
  Calendar,
  ClipboardList,
  FileText,
  GraduationCap,
  Megaphone,
  MessageSquare,
  Presentation,
  User,
  Users,
  Video,
  type LucideIcon
} from "lucide-react";

type OrganizerSectionPageProps = {
  section:
    | "students"
    | "classes"
    | "subjects"
    | "study-materials"
    | "assignments"
    | "examinations"
    | "live-classes"
    | "attendance"
    | "analytics"
    | "announcements"
    | "messages"
    | "certificates"
    | "profile";
};

const sectionConfig: Record<OrganizerSectionPageProps["section"], {
  icon: LucideIcon;
  title: string;
  eyebrow: string;
  description: string;
  primaryAction: string;
  href?: string;
  stats: string[];
}> = {
  students: {
    icon: GraduationCap,
    title: "Students",
    eyebrow: "Student Management",
    description: "Review enrollment, approve class-code join requests, and track active learners across your organization.",
    primaryAction: "Review Pending Requests",
    href: "/organizer/students/pending",
    stats: ["1,248 enrolled", "18 pending approval", "92% active this week"]
  },
  classes: {
    icon: Presentation,
    title: "Classes",
    eyebrow: "Classroom Structure",
    description: "Create classes, organize sections, and coordinate teacher-generated join codes.",
    primaryAction: "Create Class",
    stats: ["38 classes", "6 batches", "24 join codes"]
  },
  subjects: {
    icon: BookOpen,
    title: "Subjects",
    eyebrow: "Curriculum",
    description: "Manage subject catalogs and map them to classes, departments, and teachers.",
    primaryAction: "Add Subject",
    stats: ["112 subjects", "12 departments", "64 teacher mappings"]
  },
  "study-materials": {
    icon: FileText,
    title: "Study Materials",
    eyebrow: "Content Library",
    description: "Oversee uploaded notes, PDFs, recordings, and classroom resources.",
    primaryAction: "Upload Material",
    stats: ["426 resources", "74 uploads this month", "18 GB stored"]
  },
  assignments: {
    icon: ClipboardList,
    title: "Assignments",
    eyebrow: "Academic Work",
    description: "Track active assignments, submission health, and upcoming due dates.",
    primaryAction: "Create Assignment",
    stats: ["27 active", "9 due this week", "84% submitted"]
  },
  examinations: {
    icon: ClipboardList,
    title: "Examinations",
    eyebrow: "Assessments",
    description: "Schedule tests, monitor exam readiness, and review assessment coverage.",
    primaryAction: "Schedule Exam",
    stats: ["14 scheduled", "5 online exams", "3 result drafts"]
  },
  "live-classes": {
    icon: Video,
    title: "Live Classes",
    eyebrow: "Live Teaching",
    description: "Monitor live sessions, upcoming classes, recordings, and teacher activity.",
    primaryAction: "View Schedule",
    stats: ["8 today", "3 live now", "41 recordings"]
  },
  attendance: {
    icon: Calendar,
    title: "Attendance",
    eyebrow: "Presence Tracking",
    description: "Review daily attendance patterns across classes and departments.",
    primaryAction: "Open Attendance",
    stats: ["92% today", "6 low-attendance classes", "+3% weekly trend"]
  },
  analytics: {
    icon: BarChart3,
    title: "Analytics",
    eyebrow: "Organization Insights",
    description: "Track learning activity, completion rates, attendance, and performance trends.",
    primaryAction: "View Reports",
    stats: ["18 reports", "7 alerts", "94% platform uptime"]
  },
  announcements: {
    icon: Megaphone,
    title: "Announcements",
    eyebrow: "Broadcasts",
    description: "Send notices to teachers, students, classes, or the entire organization.",
    primaryAction: "Create Announcement",
    stats: ["12 active", "4 scheduled", "96% delivery"]
  },
  messages: {
    icon: MessageSquare,
    title: "Messages",
    eyebrow: "Communication",
    description: "Coordinate conversations between organizers, teachers, and students.",
    primaryAction: "Open Inbox",
    stats: ["36 unread", "8 groups", "4 priority threads"]
  },
  certificates: {
    icon: Award,
    title: "Certificates",
    eyebrow: "Recognition",
    description: "Manage certificate templates, approvals, and issued records.",
    primaryAction: "Create Certificate",
    stats: ["248 issued", "12 pending", "5 templates"]
  },
  profile: {
    icon: User,
    title: "Profile",
    eyebrow: "Organizer Profile",
    description: "Manage your organizer identity, contact details, and account preferences.",
    primaryAction: "Edit Profile",
    stats: ["Owner account", "Secure session", "Workspace admin"]
  }
};

const OrganizerSectionPage: React.FC<OrganizerSectionPageProps> = ({ section }) => {
  const config = sectionConfig[section];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-ocean">{config.eyebrow}</p>
          <h1 className="mt-2 text-3xl font-black text-ink dark:text-white">{config.title}</h1>
          <p className="mt-1 max-w-2xl text-slate-600 dark:text-slate-400">{config.description}</p>
        </div>
        {config.href ? (
          <Link href={config.href} className="w-fit rounded-xl bg-ocean px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-700">
            {config.primaryAction}
          </Link>
        ) : (
          <button className="w-fit rounded-xl bg-ocean px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-700">
            {config.primaryAction}
          </button>
        )}
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        {config.stats.map((stat) => (
          <div key={stat} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <config.icon className="text-ocean" size={23} />
            <p className="mt-4 text-lg font-black text-ink dark:text-white">{stat}</p>
          </div>
        ))}
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-start gap-4">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-blue-100 text-ocean">
            <Users size={22} />
          </div>
          <div>
            <h2 className="text-xl font-black text-ink dark:text-white">Organizer-owned workspace</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-400">
              This section is scoped to the organization created by the signed-in Organizer. No Admin or Super Admin approval path is included.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default OrganizerSectionPage;
