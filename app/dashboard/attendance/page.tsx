"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Info,
  Loader2,
  Target,
  XCircle
} from "lucide-react";
import {
  collection,
  getDocs,
  query,
  where
} from "firebase/firestore";
import { toast } from "sonner";
import { canAccessAllocationScope, useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { cn } from "@/lib/utils";

type AttendanceStatus = "present" | "absent" | "late" | "holiday" | "sunday";

type AttendanceRecord = {
  id: string;
  studentId: string;
  date: string;
  subject?: string;
  subjectId?: string;
  departmentId?: string;
  semesterId?: string;
  classroomId?: string;
  classSection?: string;
  status: AttendanceStatus;
  institutionId?: string;
  markedAt?: unknown;
  markedBy?: string;
  remark?: string;
};

type SubjectAttendance = {
  subject: string;
  total: number;
  present: number;
  percentage: number;
};

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const WEEKDAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const AttendancePage: React.FC = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [viewingMonth, setViewingMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  useEffect(() => {
    const loadRecords = async () => {
      if (!user) return;
      setIsLoading(true);
      try {
        const snapshot = await getDocs(
          query(collection(db, "attendance"), where("studentId", "==", user.id))
        );
        const list = snapshot.docs
          .map((item) => ({ id: item.id, ...(item.data() as Omit<AttendanceRecord, "id">) }))
          .filter((r) => canAccessAllocationScope(user, r));
        setRecords(list);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to load attendance.");
      } finally {
        setIsLoading(false);
      }
    };
    void loadRecords();
  }, [user]);

  const stats = useMemo(() => {
    const total = records.length;
    const present = records.filter((r) => r.status === "present").length;
    const absent = records.filter((r) => r.status === "absent").length;
    const late = records.filter((r) => r.status === "late").length;
    const percentage = total ? Math.round(((present + late * 0.5) / total) * 100) : 0;
    return { total, present, absent, late, percentage };
  }, [records]);

  const subjectBreakdown = useMemo<SubjectAttendance[]>(() => {
    const bySubject = new Map<string, { total: number; present: number }>();
    records.forEach((r) => {
      if (!r.subject) return;
      const existing = bySubject.get(r.subject) || { total: 0, present: 0 };
      existing.total += 1;
      if (r.status === "present" || r.status === "late") existing.present += 1;
      bySubject.set(r.subject, existing);
    });
    return Array.from(bySubject.entries())
      .map(([subject, v]) => ({
        subject,
        total: v.total,
        present: v.present,
        percentage: v.total ? Math.round((v.present / v.total) * 100) : 0
      }))
      .sort((a, b) => b.percentage - a.percentage);
  }, [records]);

  const calendarDays = useMemo(() => {
    const firstDay = new Date(viewingMonth.year, viewingMonth.month, 1);
    const lastDay = new Date(viewingMonth.year, viewingMonth.month + 1, 0);
    const firstWeekday = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    const dayArray: (number | null)[] = [];
    for (let i = 0; i < firstWeekday; i++) dayArray.push(null);
    for (let d = 1; d <= daysInMonth; d++) dayArray.push(d);

    const byDate = new Map<string, AttendanceRecord[]>();
    records.forEach((r) => {
      if (!r.date) return;
      const list = byDate.get(r.date) || [];
      list.push(r);
      byDate.set(r.date, list);
    });

    return {
      days: dayArray,
      daysInMonth,
      firstWeekday,
      byDate
    };
  }, [records, viewingMonth]);

  const getDayStatus = (day: number): AttendanceStatus | "mixed" | null => {
    const key = `${viewingMonth.year}-${String(viewingMonth.month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const dayRecords = calendarDays.byDate.get(key);
    const dateObj = new Date(viewingMonth.year, viewingMonth.month, day);
    if (dateObj.getDay() === 0) return "sunday";
    if (!dayRecords || !dayRecords.length) return null;
    const allPresent = dayRecords.every((r) => r.status === "present");
    const anyAbsent = dayRecords.some((r) => r.status === "absent");
    const anyLate = dayRecords.some((r) => r.status === "late");
    if (allPresent) return "present";
    if (anyAbsent && !anyLate) return "absent";
    if (anyLate && !anyAbsent) return "late";
    return "mixed";
  };

  const prevMonth = () => {
    setViewingMonth((cur) => {
      let m = cur.month - 1;
      let y = cur.year;
      if (m < 0) { m = 11; y -= 1; }
      return { month: m, year: y };
    });
  };

  const nextMonth = () => {
    setViewingMonth((cur) => {
      let m = cur.month + 1;
      let y = cur.year;
      if (m > 11) { m = 0; y += 1; }
      return { month: m, year: y };
    });
  };

  const isCurrentMonth =
    viewingMonth.year === new Date().getFullYear() &&
    viewingMonth.month === new Date().getMonth();

  return (
    <div className="space-y-7">
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-ocean">Attendance</p>
        <h1 className="mt-2 text-3xl font-black text-ink">Attendance</h1>
        <p className="mt-1 text-slate-600">Daily attendance records for your Department, Semester, Class, and Section.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={ClipboardCheck} label="Overall %" value={`${stats.percentage}%`} color="bg-blue-100 text-blue-700" />
        <StatCard icon={CheckCircle2} label="Present" value={stats.present.toString()} color="bg-emerald-100 text-emerald-700" />
        <StatCard icon={XCircle} label="Absent" value={stats.absent.toString()} color="bg-rose-100 text-rose-700" />
        <StatCard icon={Target} label="Total Days" value={stats.total.toString()} color="bg-amber-100 text-amber-700" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-black text-ink">
              {MONTH_NAMES[viewingMonth.month]} {viewingMonth.year}
            </h2>
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-1">
              <button
                onClick={prevMonth}
                className="grid h-9 w-9 place-items-center rounded-lg text-slate-600 hover:bg-slate-50"
                aria-label="Previous month"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() => {
                  const now = new Date();
                  setViewingMonth({ year: now.getFullYear(), month: now.getMonth() });
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                  isCurrentMonth ? "bg-ocean text-white" : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                Today
              </button>
              <button
                onClick={nextMonth}
                className="grid h-9 w-9 place-items-center rounded-lg text-slate-600 hover:bg-slate-50"
                aria-label="Next month"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-7 gap-2 text-center text-xs font-black uppercase tracking-[0.16em] text-slate-400">
            {WEEKDAY_NAMES.map((w) => (
              <div key={w} className="py-2">{w}</div>
            ))}
          </div>

          {isLoading ? (
            <div className="mt-2 flex items-center justify-center gap-3 p-10 text-sm font-semibold text-slate-500">
              <Loader2 className="animate-spin" size={18} />
              Loading records...
            </div>
          ) : (
            <div className="mt-2 grid grid-cols-7 gap-2">
              {calendarDays.days.map((day, idx) => {
                if (day === null) return <div key={`empty-${idx}`} className="h-14" />;
                const status = getDayStatus(day);
                return (
                  <div
                    key={day}
                    className={cn(
                      "grid h-14 place-items-center rounded-xl border text-sm font-black transition",
                      status === "present" && "border-emerald-200 bg-emerald-50 text-emerald-700",
                      status === "late" && "border-amber-200 bg-amber-50 text-amber-700",
                      status === "absent" && "border-rose-200 bg-rose-50 text-rose-700",
                      status === "sunday" && "border-slate-100 bg-slate-50 text-slate-400",
                      status === "mixed" && "border-violet-200 bg-violet-50 text-violet-700",
                      status === null && "border-slate-100 bg-white text-slate-500"
                    )}
                  >
                    {day}
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-5 flex flex-wrap gap-4 text-xs font-bold">
            <LegendDot className="bg-emerald-200" label="Present" />
            <LegendDot className="bg-amber-200" label="Late" />
            <LegendDot className="bg-rose-200" label="Absent" />
            <LegendDot className="bg-violet-200" label="Mixed" />
            <LegendDot className="bg-slate-200" label="No Record / Sunday" />
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black text-ink">Attendance Rules</h2>
          <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-700">
            <li className="flex gap-2"><Info className="mt-1 flex-shrink-0 text-ocean" size={16} /> Minimum 75% attendance is required to appear for examinations.</li>
            <li className="flex gap-2"><Info className="mt-1 flex-shrink-0 text-ocean" size={16} /> Late arrivals are counted as half-day absences in overall reports.</li>
            <li className="flex gap-2"><Info className="mt-1 flex-shrink-0 text-ocean" size={16} /> Medical leaves require submission of a certificate within 3 working days.</li>
            <li className="flex gap-2"><Info className="mt-1 flex-shrink-0 text-ocean" size={16} /> Daily attendance is marked subject-wise and aggregated per class timetable.</li>
          </ul>
        </section>
      </div>

      {subjectBreakdown.length ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-black text-ink">Subject-wise Breakdown</h2>
              <p className="mt-1 text-sm text-slate-500">Attendance percentage for each subject based on marked records.</p>
            </div>
            <CalendarDays className="text-ocean" size={22} />
          </div>
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {subjectBreakdown.map((b) => (
              <div key={b.subject} className="rounded-2xl bg-slate-50 p-5">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-black text-ink">{b.subject}</h3>
                  <span className={cn(
                    "rounded-full px-3 py-1 text-xs font-black",
                    b.percentage >= 75 ? "bg-emerald-100 text-emerald-700"
                      : b.percentage >= 60 ? "bg-amber-100 text-amber-700"
                      : "bg-rose-100 text-rose-700"
                  )}>
                    {b.percentage}%
                  </span>
                </div>
                <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-white">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      b.percentage >= 75 ? "bg-emerald-500" : b.percentage >= 60 ? "bg-amber-500" : "bg-rose-500"
                    )}
                    style={{ width: `${b.percentage}%` }}
                  />
                </div>
                <div className="mt-3 flex justify-between text-xs font-bold text-slate-500">
                  <span>Present: {b.present}</span>
                  <span>Total: {b.total}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {stats.total === 0 && !isLoading ? (
        <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
          <ClipboardCheck className="mx-auto text-ocean" size={32} />
          <h2 className="mt-4 text-lg font-black text-ink">No attendance records yet</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
            Records will appear once teachers or organizers mark attendance for your Department, Semester, Class, and Section.
          </p>
        </section>
      ) : null}
    </div>
  );
};

const StatCard: React.FC<{ icon: React.ElementType; label: string; value: string; color: string }> = ({
  icon: Icon,
  label,
  value,
  color
}) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className={`grid h-12 w-12 place-items-center rounded-xl ${color}`}>
      <Icon size={22} />
    </div>
    <p className="mt-4 text-3xl font-black text-ink">{value}</p>
    <p className="text-sm font-semibold text-slate-500">{label}</p>
  </div>
);

const LegendDot: React.FC<{ className?: string; label: string }> = ({ className, label }) => (
  <div className="inline-flex items-center gap-2">
    <span className={cn("h-4 w-4 rounded-md", className)} />
    <span className="text-slate-600">{label}</span>
  </div>
);

export default AttendancePage;
