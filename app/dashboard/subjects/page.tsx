"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { collection, getDocs, query, where } from "firebase/firestore";
import { ArrowRight, BookOpenCheck, ClipboardList, FileText, GraduationCap, Loader2 } from "lucide-react";
import { AcademicSubject, canAccessAllocationScope, useAuth, User } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";

type SubjectWithTeacher = AcademicSubject & {
  teacher?: Pick<User, "id" | "name" | "email" | "subjectId" | "classroomId">;
};

const StudentSubjectsPage: React.FC = () => {
  const { user, listSubjects } = useAuth();
  const [subjects, setSubjects] = useState<SubjectWithTeacher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const hasClassAllocation = Boolean(user?.institutionId && user?.departmentId && user?.semesterId && user?.classroomId);

  useEffect(() => {
    const loadSubjects = async () => {
      if (!user || user.role !== "student" || !hasClassAllocation) {
        setSubjects([]);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const [subjectItems, teacherSnapshot] = await Promise.all([
          listSubjects({ departmentId: user.departmentId, semesterId: user.semesterId }),
          getDocs(query(collection(db, "users"), where("role", "==", "teacher")))
        ]);

        const classTeachers = teacherSnapshot.docs
          .map((item) => ({ id: item.id, ...(item.data() as Omit<User, "id">) } as User))
          .filter((teacher) =>
            teacher.status === "active" &&
            teacher.classroomId === user.classroomId &&
            teacher.institutionId === user.institutionId
          );

        const visibleSubjects = subjectItems
          .filter((subject) =>
            canAccessAllocationScope(user, {
              institutionId: subject.institutionId,
              departmentId: subject.departmentId,
              semesterId: subject.semesterId,
              classroomId: user.classroomId
            })
          )
          .map((subject) => ({
            ...subject,
            teacher: classTeachers.find((teacher) => teacher.subjectId === subject.id)
          }))
          .filter((subject) => Boolean(subject.teacher));

        setSubjects(visibleSubjects);
        setErrorMessage("");
      } catch {
        setErrorMessage("Unable to load your allocated subjects right now.");
      } finally {
        setIsLoading(false);
      }
    };

    loadSubjects();
  }, [hasClassAllocation, listSubjects, user]);

  const allocationLabel = useMemo(() => {
    if (!user?.department || !user?.semester || !user?.classroomName) {
      return "Class allocation pending";
    }

    return `${user.department} / ${user.semester} / ${user.classroomName}`;
  }, [user?.classroomName, user?.department, user?.semester]);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">My Subjects</p>
              <h1 className="mt-2 text-2xl font-semibold text-slate-950">Class-assigned subjects and teachers</h1>
              <p className="mt-2 text-sm text-slate-600">{allocationLabel}</p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700">
              <GraduationCap size={18} />
              {subjects.length} allocated subject{subjects.length === 1 ? "" : "s"}
            </div>
          </div>
        </section>

        {errorMessage ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </div>
        ) : null}

        {isLoading ? (
          <div className="flex min-h-[260px] items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600">
            <Loader2 className="mr-2 animate-spin" size={20} />
            Loading allocated subjects...
          </div>
        ) : !hasClassAllocation ? (
          <EmptyState
            title="No class allocation yet"
            description="Your organizer must approve your student request and allocate your department, semester, and class before subjects are available."
          />
        ) : subjects.length === 0 ? (
          <EmptyState
            title="No subjects assigned yet"
            description="Subjects will appear here after your organizer allocates teachers and subjects to your class."
          />
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {subjects.map((subject) => (
              <article key={subject.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{subject.code}</p>
                    <h2 className="mt-2 text-xl font-semibold text-slate-950">{subject.name}</h2>
                    <p className="mt-2 text-sm text-slate-600">
                      Teacher: <span className="font-medium text-slate-900">{subject.teacher?.name || subject.teacher?.email}</span>
                    </p>
                  </div>
                  <div className="rounded-2xl bg-blue-50 p-3 text-blue-700">
                    <BookOpenCheck size={22} />
                  </div>
                </div>

                <div className="mt-6 grid gap-2">
                  <SubjectLink href="/dashboard/study-materials" icon={FileText} label="Notes and study materials" />
                  <SubjectLink href="/dashboard/assignments" icon={ClipboardList} label="Assignments" />
                  <SubjectLink href="/dashboard/online-exams" icon={GraduationCap} label="Exams" />
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
};

type EmptyStateProps = {
  title: string;
  description: string;
};

const EmptyState: React.FC<EmptyStateProps> = ({ title, description }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
      <BookOpenCheck size={22} />
    </div>
    <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
    <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">{description}</p>
  </div>
);

type SubjectLinkProps = {
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
};

const SubjectLink: React.FC<SubjectLinkProps> = ({ href, icon: Icon, label }) => (
  <Link
    href={href}
    className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
  >
    <span className="flex items-center gap-2">
      <Icon size={16} />
      {label}
    </span>
    <ArrowRight size={15} />
  </Link>
);

export default StudentSubjectsPage;
