"use client";

import React from "react";
import { ClipboardCheck } from "lucide-react";

const AttendancePage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-ocean">Attendance</p>
        <h1 className="mt-2 text-3xl font-black text-ink">Attendance</h1>
        <p className="mt-1 text-slate-600">Attendance records for allocated classes will appear here.</p>
      </div>

      <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
        <ClipboardCheck className="mx-auto text-ocean" size={32} />
        <h2 className="mt-4 text-lg font-black text-ink">No attendance records yet</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
          Attendance will be shown after real students are allocated and attendance is marked for their class.
        </p>
      </section>
    </div>
  );
};

export default AttendancePage;
