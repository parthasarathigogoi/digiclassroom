"use client";

import React, { useState } from "react";
import Link from "next/link";
import { BookOpen, CheckCircle2, Clock, KeyRound, Loader2, Users } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const ClassroomsPage: React.FC = () => {
  const { user, joinClassWithCode, isLoading } = useAuth();
  const [joinCode, setJoinCode] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const isStudent = user?.role === "student";
  const isTeacher = user?.role === "teacher";
  const hasClass = Boolean(user?.classroomId);
  const isPending = user?.status === "pending_approval";
  const isApprovedStudent = isStudent && hasClass && user?.status === "active";

  const handleJoinClass = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      setErrorMessage("");
      await joinClassWithCode(joinCode);
      setJoinCode("");
      toast.success("Class join request sent.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to join this class.";
      setErrorMessage(message);
      toast.error(message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-ocean">{isTeacher ? "Teacher Classes" : "Student Classes"}</p>
          <h1 className="mt-2 text-3xl font-black text-ink">My Classes</h1>
          <p className="mt-1 text-slate-600">
            {isTeacher
              ? "Your organizer-allocated class and subject appear here."
              : "Join your class with the code shared by your teacher or organizer."}
          </p>
        </div>
      </div>

      {isStudent && !hasClass ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-4 inline-flex rounded-2xl bg-blue-50 p-3 text-ocean">
                <KeyRound size={24} />
              </div>
              <h2 className="text-xl font-black text-ink">Join Class</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Enter a valid class join code. Your request will go to the teacher assigned to that class and the organizer.
              </p>
            </div>

            <form onSubmit={handleJoinClass} className="w-full max-w-xl space-y-3">
              {errorMessage ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {errorMessage}
                </div>
              ) : null}
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  type="text"
                  value={joinCode}
                  onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
                  className="min-h-12 flex-1 rounded-xl border border-slate-200 px-4 py-3 uppercase tracking-[0.12em] outline-none transition focus:border-ocean focus:ring-4 focus:ring-blue-100"
                  placeholder="Enter class code"
                  required
                />
                <button
                  type="submit"
                  disabled={isLoading}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-ocean px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:bg-blue-300"
                >
                  {isLoading ? <Loader2 className="animate-spin" size={17} /> : <KeyRound size={17} />}
                  Join
                </button>
              </div>
            </form>
          </div>
        </section>
      ) : null}

      {isStudent && isPending ? (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-900 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-amber-100 p-3">
              <Clock size={24} />
            </div>
            <div>
              <h2 className="text-lg font-black">Class request pending</h2>
              <p className="mt-2 text-sm leading-6">
                Your request for {user?.classroomName || "this class"} has been sent for approval. You can access class materials,
                assignments, and exams after the teacher or organizer approves it.
              </p>
            </div>
          </div>
        </section>
      ) : null}

      {isApprovedStudent || isTeacher ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="mb-4 inline-flex rounded-2xl bg-emerald-50 p-3 text-emerald-700">
                <CheckCircle2 size={24} />
              </div>
              <h2 className="text-xl font-black text-ink">{user?.classroomName || "Allocated Class"}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {[user?.department, user?.semester, user?.classSection ? `Section ${user.classSection}` : ""].filter(Boolean).join(" / ")}
              </p>
              {isTeacher ? (
                <p className="mt-1 text-sm font-semibold text-ocean">{user?.subject || "Subject not assigned"}</p>
              ) : null}
            </div>

            <div className="grid w-full gap-3 sm:grid-cols-2 lg:max-w-lg">
              <ClassAction href="/dashboard/subjects" icon={BookOpen} label="My Subjects" />
              <ClassAction href="/dashboard/study-materials" icon={BookOpen} label="Study Materials" />
              <ClassAction href="/dashboard/assignments" icon={Users} label="Assignments" />
              <ClassAction href="/dashboard/online-exams" icon={Clock} label="Exams" />
            </div>
          </div>
        </section>
      ) : null}

      {!isStudent && !isTeacher ? null : !hasClass && !isStudent ? (
        <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
          <BookOpen className="mx-auto text-ocean" size={32} />
          <h2 className="mt-4 text-lg font-black text-ink">No classes allocated yet</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
            Class access is controlled through Department, Semester, Class / Section, and Subject allocation.
          </p>
        </section>
      ) : null}
    </div>
  );
};

type ClassActionProps = {
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
};

const ClassAction: React.FC<ClassActionProps> = ({ href, icon: Icon, label }) => (
  <Link
    href={href}
    className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-ocean"
  >
    <Icon size={17} />
    {label}
  </Link>
);

export default ClassroomsPage;
