"use client";

import React from "react";
import { BookOpen } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const ClassroomsPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-ocean">{user?.role === "teacher" ? "Teacher Classes" : "Student Classes"}</p>
        <h1 className="mt-2 text-3xl font-black text-ink">My Classes</h1>
        <p className="mt-1 text-slate-600">
          {user?.role === "teacher"
            ? "Classes allocated by the organizer will appear here."
            : "Your organizer-approved class allocation will appear here."}
        </p>
      </div>

      <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
        <BookOpen className="mx-auto text-ocean" size={32} />
        <h2 className="mt-4 text-lg font-black text-ink">No classes allocated yet</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
          Class access is controlled by the organizer through Department, Semester, and Class / Section allocation.
        </p>
      </section>
    </div>
  );
};

export default ClassroomsPage;
