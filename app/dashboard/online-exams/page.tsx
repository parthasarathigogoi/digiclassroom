"use client";

import React from "react";
import { Laptop } from "lucide-react";

const OnlineExamsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-ocean">Assessments</p>
        <h1 className="mt-2 text-3xl font-black text-ink">Online Exams</h1>
        <p className="mt-1 text-slate-600">Examinations allocated to your Department, Semester, Class / Section, and Subject will appear here.</p>
      </div>

      <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
        <Laptop className="mx-auto text-ocean" size={32} />
        <h2 className="mt-4 text-lg font-black text-ink">No examinations yet</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
          Exam records will be shown only after they are created and allocated to the user&apos;s academic scope.
        </p>
      </section>
    </div>
  );
};

export default OnlineExamsPage;
