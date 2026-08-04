"use client";

import React from "react";
import { Award } from "lucide-react";

const ResultsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-ocean">Performance</p>
        <h1 className="mt-2 text-3xl font-black text-ink">Results</h1>
        <p className="mt-1 text-slate-600">Exam results for your allocated classes will appear here.</p>
      </div>

      <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
        <Award className="mx-auto text-ocean" size={32} />
        <h2 className="mt-4 text-lg font-black text-ink">No results yet</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
          Results will be shown after examinations are completed and published for the correct allocation scope.
        </p>
      </section>
    </div>
  );
};

export default ResultsPage;
