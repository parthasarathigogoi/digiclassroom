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
}> = {
  students: {
    icon: GraduationCap,
    title: "Students",
    eyebrow: "Student Management",
    description: "Review enrollment, approve class-code join requests, and track active learners across your organization.",
    primaryAction: "Review Pending Requests",
    href: "/organizer/students/pending"
  },
  classes: {
    icon: Presentation,
    title: "Classes",
    eyebrow: "Classroom Structure",
    description: "Create classes, organize sections, and coordinate teacher-generated join codes.",
    primaryAction: "Create Class"
  },
  subjects: {
    icon: BookOpen,
    title: "Subjects",
    eyebrow: "Curriculum",
    description: "Manage subject catalogs and map them to classes, departments, and teachers.",
    primaryAction: "Add Subject"
  },
  "study-materials": {
    icon: FileText,
    title: "Study Materials",
    eyebrow: "Content Library",
    description: "Oversee uploaded notes, PDFs, recordings, and classroom resources.",
    primaryAction: "Upload Material"
  },
  assignments: {
    icon: ClipboardList,
    title: "Assignments",
    eyebrow: "Academic Work",
    description: "Track active assignments, submission health, and upcoming due dates.",
    primaryAction: "Create Assignment"
  },
  examinations: {
    icon: ClipboardList,
    title: "Examinations",
    eyebrow: "Assessments",
    description: "Schedule tests, monitor exam readiness, and review assessment coverage.",
    primaryAction: "Schedule Exam"
  },
  "live-classes": {
    icon: Video,
    title: "Live Classes",
    eyebrow: "Live Teaching",
    description: "Monitor live sessions, upcoming classes, recordings, and teacher activity.",
    primaryAction: "View Schedule"
  },
  attendance: {
    icon: Calendar,
    title: "Attendance",
    eyebrow: "Presence Tracking",
    description: "Review daily attendance patterns across classes and departments.",
    primaryAction: "Open Attendance"
  },
  analytics: {
    icon: BarChart3,
    title: "Analytics",
    eyebrow: "Organization Insights",
    description: "Track learning activity, completion rates, attendance, and performance trends.",
    primaryAction: "View Reports"
  },
  announcements: {
    icon: Megaphone,
    title: "Announcements",
    eyebrow: "Broadcasts",
    description: "Send notices to teachers, students, classes, or the entire organization.",
    primaryAction: "Create Announcement"
  },
  messages: {
    icon: MessageSquare,
    title: "Messages",
    eyebrow: "Communication",
    description: "Coordinate conversations between organizers, teachers, and students.",
    primaryAction: "Open Inbox"
  },
  certificates: {
    icon: Award,
    title: "Certificates",
    eyebrow: "Recognition",
    description: "Manage certificate templates, approvals, and issued records.",
    primaryAction: "Create Certificate"
  },
  profile: {
    icon: User,
    title: "Profile",
    eyebrow: "Organizer Profile",
    description: "Manage your organizer identity, contact details, and account preferences.",
    primaryAction: "Edit Profile"
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

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-start gap-4">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-blue-100 text-ocean">
            <config.icon size={22} />
          </div>
          <div>
            <h2 className="text-xl font-black text-ink dark:text-white">No records yet</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-400">
              Real organization records for this section will appear here after they are created and linked through the allocation workflow.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default OrganizerSectionPage;
