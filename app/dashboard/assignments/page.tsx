"use client";

import React from "react";
import { FileText } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const AssignmentsPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-ocean">{user?.role === "teacher" ? "Teacher Assignments" : "Student Work"}</p>
        <h1 className="mt-2 text-3xl font-black text-ink">Assignments</h1>
        <p className="mt-1 text-slate-600">
          {user?.role === "teacher"
            ? "Assignments you create for allocated classes will appear here."
            : "Assignments assigned to your allocated class will appear here."}
        </p>
      </div>

      <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
        <FileText className="mx-auto text-ocean" size={32} />
        <h2 className="mt-4 text-lg font-black text-ink">No assignments yet</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
          Assignment records will be shown only after they are created and linked to the correct Department, Semester, Class / Section, and Subject.
        </p>
      </section>
    </div>
  );
};

export default AssignmentsPage;
