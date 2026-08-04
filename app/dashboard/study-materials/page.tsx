"use client";

import React from "react";
import { BookOpen } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const StudyMaterialsPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-ocean">{user?.role === "teacher" ? "Teacher Resources" : "Resources"}</p>
        <h1 className="mt-2 text-3xl font-black text-ink">Study Materials</h1>
        <p className="mt-1 text-slate-600">
          {user?.role === "teacher"
            ? "Materials uploaded for allocated classes will appear here."
            : "Materials for your allocated class will appear here."}
        </p>
      </div>

      <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
        <BookOpen className="mx-auto text-ocean" size={32} />
        <h2 className="mt-4 text-lg font-black text-ink">No study materials yet</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
          Study materials will be visible only when they match the user&apos;s Department, Semester, Class / Section, and Subject allocation.
        </p>
      </section>
    </div>
  );
};

export default StudyMaterialsPage;
