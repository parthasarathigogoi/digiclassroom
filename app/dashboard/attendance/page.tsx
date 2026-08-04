"use client";

import React, { useState } from "react";
import { CheckCircle2, Download, XCircle } from "lucide-react";
import { toast } from "sonner";

const students = ["Rahul Sharma", "Anita Das", "Rohit Gogoi", "Priya Singh", "Amit Kumar"];

const AttendancePage: React.FC = () => {
  const [attendance, setAttendance] = useState<Record<string, "Present" | "Absent">>(() => Object.fromEntries(students.map((name) => [name, "Present"])));
  const present = Object.values(attendance).filter((status) => status === "Present").length;
  const percent = Math.round((present / students.length) * 100);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-ocean">Teacher Attendance</p>
          <h1 className="mt-2 text-3xl font-black text-ink">Mark Attendance</h1>
          <p className="mt-1 text-slate-600">Today&apos;s class attendance is {percent}% present.</p>
        </div>
        <button onClick={() => toast.success("Attendance sheet exported")} className="inline-flex items-center gap-2 rounded-xl bg-ocean px-5 py-3 text-sm font-bold text-white"><Download size={18} /> Export</button>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="space-y-3">
          {students.map((student) => (
            <div key={student} className="flex items-center justify-between rounded-2xl border border-slate-100 p-4">
              <div>
                <p className="font-bold text-ink">{student}</p>
                <p className="text-sm text-slate-500">CSE 3rd Year</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setAttendance({ ...attendance, [student]: "Present" })} className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold ${attendance[student] === "Present" ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}><CheckCircle2 size={17} /> Present</button>
                <button onClick={() => setAttendance({ ...attendance, [student]: "Absent" })} className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold ${attendance[student] === "Absent" ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-500"}`}><XCircle size={17} /> Absent</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AttendancePage;
