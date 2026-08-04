"use client";

import React from "react";
import { Award, BarChart3, CheckCircle2 } from "lucide-react";
import { defaultExams, type Exam } from "@/lib/student/data";

const ResultsPage: React.FC = () => {
  const exams: Exam[] = defaultExams;

  const completed = exams.filter((item) => item.status === "completed");
  const average = completed.length ? Math.round(completed.reduce((sum, item) => sum + (item.score || 0), 0) / completed.length) : 0;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-ocean">Performance</p>
        <h1 className="mt-2 text-3xl font-black text-ink">Results</h1>
        <p className="mt-1 text-slate-600">Your exam scores and progress summary.</p>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <Award className="text-ocean" size={28} />
          <p className="mt-5 text-3xl font-black text-ink">{average}%</p>
          <p className="text-sm text-slate-500">Average Score</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <CheckCircle2 className="text-mint" size={28} />
          <p className="mt-5 text-3xl font-black text-ink">{completed.length}</p>
          <p className="text-sm text-slate-500">Completed Exams</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <BarChart3 className="text-amber" size={28} />
          <p className="mt-5 text-3xl font-black text-ink">{average >= 60 ? "Pass" : "Pending"}</p>
          <p className="text-sm text-slate-500">Current Standing</p>
        </div>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-black text-ink">Exam History</h2>
        <div className="mt-5 space-y-3">
          {exams.map((exam) => (
            <div key={exam.id} className="flex flex-col gap-3 rounded-2xl border border-slate-100 p-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="font-bold text-ink">{exam.title}</h3>
                <p className="text-sm text-slate-500">{exam.subject}</p>
              </div>
              <span className={`w-fit rounded-full px-3 py-1 text-xs font-bold ${exam.status === "completed" ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"}`}>
                {exam.status === "completed" ? `${exam.score}%` : "Not attempted"}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default ResultsPage;
