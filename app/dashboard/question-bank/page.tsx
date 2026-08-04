"use client";

import React from "react";
import { ClipboardList } from "lucide-react";

const QuestionBankPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-ocean">Teacher Tool</p>
        <h1 className="mt-2 text-3xl font-black text-ink">Question Bank</h1>
        <p className="mt-1 text-slate-600">Questions linked to allocated classes and subjects will appear here.</p>
      </div>

      <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
        <ClipboardList className="mx-auto text-ocean" size={32} />
        <h2 className="mt-4 text-lg font-black text-ink">No questions yet</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
          Question records should be created against real Department, Semester, Class / Section, and Subject allocations.
        </p>
      </section>
    </div>
  );
};

export default QuestionBankPage;
