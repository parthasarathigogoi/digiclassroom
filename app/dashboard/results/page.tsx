"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Award,
  BarChart3,
  CheckCircle2,
  ClipboardCheck,
  Download,
  Loader2,
  Printer,
  Target,
  ThumbsUp,
  XCircle
} from "lucide-react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { toast } from "sonner";
import { canAccessAllocationScope, useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";

type ExamResult = {
  id: string;
  examId: string;
  title: string;
  subject?: string;
  subjectId?: string;
  department?: string;
  semester?: string;
  classroomName?: string;
  classSection?: string;
  durationMinutes?: number;
  totalMarks: number;
  passingMarks: number;
  obtainedMarks: number;
  percentage: number;
  passStatus: "pass" | "fail";
  feedback?: string;
  gradedBy?: string;
  submittedAt?: unknown;
  gradedAt?: unknown;
  totalQuestions?: number;
  correctAnswers?: number;
  institutionId?: string;
  departmentId?: string;
  semesterId?: string;
  classroomId?: string;
};

type StudentAttempt = {
  id: string;
  examId: string;
  status: "ongoing" | "submitted" | "graded";
  answers: Record<string, string>;
  markedForReview: string[];
  startedAt?: unknown;
  submittedAt?: unknown;
  obtainedMarks?: number;
  percentage?: number;
  feedback?: string;
};

type StudentExam = {
  id: string;
  title: string;
  subject?: string;
  subjectId?: string;
  department?: string;
  departmentId?: string;
  semester?: string;
  semesterId?: string;
  classroomName?: string;
  classroomId?: string;
  classSection?: string;
  durationMinutes?: number;
  totalMarks?: number;
  passingMarks?: number;
  questions?: unknown[];
  institutionId?: string;
};

const dateFromValue = (value: unknown) => {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === "string" || typeof value === "number") return new Date(value);
  if (typeof value === "object" && "toDate" in value && typeof value.toDate === "function") return value.toDate() as Date;
  return null;
};

const formatDateTime = (value: unknown) => {
  const date = dateFromValue(value);
  if (!date || Number.isNaN(date.getTime())) return "Not available";
  return date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
};

const formatDate = (value: unknown) => {
  const date = dateFromValue(value);
  if (!date || Number.isNaN(date.getTime())) return "Not available";
  return date.toLocaleDateString(undefined, { dateStyle: "long" });
};

const ResultsPage: React.FC = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [results, setResults] = useState<ExamResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<ExamResult | null>(null);

  useEffect(() => {
    const loadResults = async () => {
      if (!user) return;
      setIsLoading(true);

      try {
        const examsSnapshot = await getDocs(query(collection(db, "examinations")));
        const exams = examsSnapshot.docs
          .map((item) => ({ id: item.id, ...(item.data() as Omit<StudentExam, "id">) }))
          .filter((exam) => canAccessAllocationScope(user, exam));

        const attemptsSnapshot = await getDocs(query(collection(db, "examAttempts"), where("studentId", "==", user.id)));
        const attempts = attemptsSnapshot.docs.map((item) => ({
          id: item.id,
          ...(item.data() as Omit<StudentAttempt, "id">)
        }));

        const resultsList: ExamResult[] = [];
        attempts.forEach((attempt) => {
          if (attempt.status !== "submitted" && attempt.status !== "graded") return;
          const exam = exams.find((e) => e.id === attempt.examId);
          if (!exam) return;

          const totalMarks = exam.totalMarks || 0;
          const passingMarks = exam.passingMarks || Math.ceil(totalMarks * 0.35);
          const obtainedMarks = attempt.obtainedMarks || 0;
          const percentage = attempt.percentage != null ? attempt.percentage : totalMarks > 0 ? Math.round((obtainedMarks / totalMarks) * 100) : 0;
          const passStatus = percentage >= (passingMarks > 0 ? (passingMarks / totalMarks) * 100 : 35) ? "pass" : "fail";
          const totalQuestions = exam.questions?.length || 0;
          const correctAnswers = attempt.status === "graded" ? Math.round((obtainedMarks / (totalMarks || 1)) * totalQuestions) : undefined;

          resultsList.push({
            id: attempt.id,
            examId: exam.id,
            title: exam.title,
            subject: exam.subject,
            subjectId: exam.subjectId,
            department: exam.department,
            departmentId: exam.departmentId,
            semester: exam.semester,
            semesterId: exam.semesterId,
            classroomName: exam.classroomName,
            classSection: exam.classSection,
            classroomId: exam.classroomId,
            durationMinutes: exam.durationMinutes,
            totalMarks,
            passingMarks,
            obtainedMarks,
            percentage,
            passStatus,
            feedback: attempt.feedback,
            submittedAt: attempt.submittedAt,
            gradedAt: attempt.status === "graded" ? new Date().toISOString() : undefined,
            gradedBy: attempt.status === "graded" ? "Teacher" : undefined,
            totalQuestions,
            correctAnswers,
            institutionId: exam.institutionId
          });
        });

        resultsList.sort((a, b) => {
          const da = dateFromValue(a.submittedAt)?.getTime() || 0;
          const db = dateFromValue(b.submittedAt)?.getTime() || 0;
          return db - da;
        });

        setResults(resultsList);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to load results.");
      } finally {
        setIsLoading(false);
      }
    };

    void loadResults();
  }, [user]);

  const summary = useMemo(() => {
    const total = results.length;
    const passed = results.filter((r) => r.passStatus === "pass").length;
    const failed = total - passed;
    const avgPercentage = total ? Math.round(results.reduce((s, r) => s + r.percentage, 0) / total) : 0;
    const highestPercentage = total ? Math.max(...results.map((r) => r.percentage)) : 0;
    const totalMarksObtained = results.reduce((s, r) => s + r.obtainedMarks, 0);
    const totalMarksPossible = results.reduce((s, r) => s + r.totalMarks, 0);
    return { total, passed, failed, avgPercentage, highestPercentage, totalMarksObtained, totalMarksPossible };
  }, [results]);

  const downloadScorecard = (result: ExamResult) => {
    const content = buildScorecardContent(result);
    const blob = new Blob([content], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `scorecard-${result.examId}-${user?.name || "student"}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Scorecard downloaded.");
  };

  const printScorecard = (result: ExamResult) => {
    const w = window.open("", "_blank");
    if (!w) {
      toast.error("Unable to open print window.");
      return;
    }
    w.document.write(buildScorecardContent(result));
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 300);
  };

  const buildScorecardContent = (result: ExamResult) => {
    const statusColor = result.passStatus === "pass" ? "#16a34a" : "#dc2626";
    const statusText = result.passStatus === "pass" ? "PASSED" : "FAILED";
    return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Scorecard - ${result.title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: #0f172a; }
    .card { max-width: 720px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 24px; padding: 40px; background: white; }
    .header { text-align: center; border-bottom: 2px solid #2563eb; padding-bottom: 24px; }
    .logo { font-size: 28px; font-weight: 900; color: #2563eb; }
    .inst { font-size: 14px; color: #64748b; margin-top: 4px; }
    .title { font-size: 22px; font-weight: 800; margin-top: 20px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 24px; }
    .row { padding: 12px 16px; background: #f8fafc; border-radius: 12px; }
    .label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.16em; color: #64748b; font-weight: 700; }
    .value { font-size: 15px; font-weight: 700; color: #0f172a; margin-top: 4px; }
    .big { display: flex; align-items: center; justify-content: space-between; margin-top: 28px; padding: 24px; border-radius: 20px; background: #eff6ff; }
    .marks { font-size: 48px; font-weight: 900; color: #2563eb; }
    .pct { font-size: 20px; font-weight: 800; color: #2563eb; }
    .status { font-size: 22px; font-weight: 900; color: ${statusColor}; padding: 8px 20px; border: 3px solid ${statusColor}; border-radius: 999px; }
    .feedback { margin-top: 24px; padding: 16px; background: #f0fdf4; border-radius: 12px; border-left: 4px solid #16a34a; }
    .sign { margin-top: 40px; display: flex; justify-content: space-between; }
    .sign .line { border-top: 1px solid #94a3b8; padding-top: 8px; width: 180px; text-align: center; font-size: 12px; color: #64748b; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="logo">DigiClassroom</div>
      <div class="inst">${user?.institution || "Official Examination Scorecard"}</div>
      <div class="title">${result.title}</div>
    </div>
    <div class="grid">
      <div class="row"><div class="label">Student Name</div><div class="value">${user?.name || "Student"}</div></div>
      <div class="row"><div class="label">Roll Number</div><div class="value">${user?.rollNumber || "—"}</div></div>
      <div class="row"><div class="label">Subject</div><div class="value">${result.subject || "—"}</div></div>
      <div class="row"><div class="label">Department</div><div class="value">${result.department || "—"}</div></div>
      <div class="row"><div class="label">Semester</div><div class="value">${result.semester || "—"}</div></div>
      <div class="row"><div class="label">Class / Section</div><div class="value">${result.classroomName || "—"} ${result.classSection || ""}</div></div>
      <div class="row"><div class="label">Submitted On</div><div class="value">${formatDateTime(result.submittedAt)}</div></div>
      <div class="row"><div class="label">Duration</div><div class="value">${result.durationMinutes || 0} minutes</div></div>
    </div>
    <div class="big">
      <div>
        <div class="marks">${result.obtainedMarks}<span style="font-size:20px;color:#64748b;"> / ${result.totalMarks}</span></div>
        <div class="pct">${result.percentage}%</div>
      </div>
      <div class="status">${statusText}</div>
    </div>
    <div class="grid">
      <div class="row"><div class="label">Passing Marks</div><div class="value">${result.passingMarks}</div></div>
      <div class="row"><div class="label">Total Questions</div><div class="value">${result.totalQuestions || "—"}</div></div>
    </div>
    ${result.feedback ? `<div class="feedback"><div style="font-size:12px;font-weight:800;color:#16a34a;letter-spacing:0.16em;text-transform:uppercase;">Teacher Feedback</div><div style="margin-top:8px;font-size:14px;line-height:1.6;color:#0f172a;">${result.feedback}</div></div>` : ""}
    <div class="sign">
      <div class="line">Student Signature</div>
      <div class="line">Teacher / Examiner</div>
      <div class="line">Organizer Seal</div>
    </div>
  </div>
</body>
</html>`;
  };

  return (
    <div className="space-y-7">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-ocean">Performance</p>
          <h1 className="mt-2 text-3xl font-black text-ink">Results</h1>
          <p className="mt-1 text-slate-600">Results and downloadable scorecards for examinations submitted from your allocated class.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard icon={Award} label="Total Exams" value={summary.total.toString()} color="bg-blue-100 text-blue-700" />
        <StatCard icon={CheckCircle2} label="Passed" value={summary.passed.toString()} color="bg-emerald-100 text-emerald-700" />
        <StatCard icon={XCircle} label="Failed" value={summary.failed.toString()} color="bg-rose-100 text-rose-700" />
        <StatCard icon={Target} label="Average %" value={`${summary.avgPercentage}%`} color="bg-cyan-100 text-cyan-700" />
        <StatCard icon={BarChart3} label="Highest %" value={`${summary.highestPercentage}%`} color="bg-amber-100 text-amber-700" />
      </div>

      {summary.totalMarksPossible > 0 && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-black text-ink">Overall Performance</h2>
          <div className="mt-5">
            <div className="flex items-center justify-between text-sm font-bold text-slate-600">
              <span>Total Obtained: {summary.totalMarksObtained}</span>
              <span>Out of: {summary.totalMarksPossible}</span>
            </div>
            <div className="mt-3 h-4 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-ocean transition-all"
                style={{ width: `${summary.totalMarksPossible ? Math.round((summary.totalMarksObtained / summary.totalMarksPossible) * 100) : 0}%` }}
              />
            </div>
          </div>
        </section>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white p-10 text-sm font-semibold text-slate-500 shadow-sm">
          <Loader2 className="animate-spin" size={18} />
          Loading results...
        </div>
      ) : results.length ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black text-ink">Exam Results</h2>
          <div className="mt-5 space-y-4">
            {results.map((result) => (
              <ResultCard
                key={result.id}
                result={result}
                onView={() => setSelectedResult(result)}
                onDownload={() => downloadScorecard(result)}
                onPrint={() => printScorecard(result)}
              />
            ))}
          </div>
        </section>
      ) : (
        <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
          <Award className="mx-auto text-ocean" size={32} />
          <h2 className="mt-4 text-lg font-black text-ink">No results yet</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
            Complete an exam assigned to your Department, Semester, Class, and Subject, and wait for the results to be published.
          </p>
        </section>
      )}

      {selectedResult ? (
        <ResultDialog
          result={selectedResult}
          onClose={() => setSelectedResult(null)}
          onDownload={() => downloadScorecard(selectedResult)}
          onPrint={() => printScorecard(selectedResult)}
        />
      ) : null}
    </div>
  );
};

const StatCard: React.FC<{ icon: React.ElementType; label: string; value: string; color: string }> = ({ icon: Icon, label, value, color }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className={`grid h-12 w-12 place-items-center rounded-xl ${color}`}>
      <Icon size={22} />
    </div>
    <p className="mt-4 text-3xl font-black text-ink">{value}</p>
    <p className="text-sm font-semibold text-slate-500">{label}</p>
  </div>
);

const ResultCard: React.FC<{
  result: ExamResult;
  onView: () => void;
  onDownload: () => void;
  onPrint: () => void;
}> = ({ result, onView, onDownload, onPrint }) => {
  const isPass = result.passStatus === "pass";
  return (
    <article className="rounded-2xl border border-slate-100 bg-slate-50 p-5 transition hover:border-ocean/30 hover:bg-white hover:shadow-sm">
      <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-black text-ink">{result.title}</h3>
              <p className="mt-1 text-sm text-slate-500">
                {result.subject || "Subject"} · {result.department || "Department"} · {result.semester || "Semester"} · {result.classroomName || "Class"} {result.classSection || ""}
              </p>
              <p className="mt-1 text-xs text-slate-400">Submitted: {formatDateTime(result.submittedAt)}</p>
            </div>
            <span className={`rounded-full px-4 py-2 text-sm font-black ${isPass ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
              {isPass ? "PASS" : "FAIL"}
            </span>
          </div>

          <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2 md:grid-cols-4">
            <MiniStat label="Marks" value={`${result.obtainedMarks} / ${result.totalMarks}`} />
            <MiniStat label="Percentage" value={`${result.percentage}%`} />
            <MiniStat label="Passing" value={result.passingMarks.toString()} />
            {result.totalQuestions ? <MiniStat label="Questions" value={result.totalQuestions.toString()} /> : null}
          </div>

          {result.feedback ? (
            <div className="mt-4 flex items-start gap-2 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">
              <ThumbsUp size={16} className="mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-black">Teacher Feedback</p>
                <p className="mt-1 leading-6">{result.feedback}</p>
              </div>
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2 lg:flex-col lg:items-end">
          <button onClick={onView} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-ocean hover:text-ocean">
            View Details
          </button>
          <button onClick={onDownload} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-ocean hover:text-ocean">
            <Download size={15} /> Download
          </button>
          <button onClick={onPrint} className="inline-flex items-center gap-2 rounded-xl bg-ocean px-4 py-2 text-sm font-bold text-white transition hover:bg-blue-700">
            <Printer size={15} /> Print
          </button>
        </div>
      </div>
    </article>
  );
};

const MiniStat: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="rounded-xl bg-white p-3">
    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">{label}</p>
    <p className="mt-1 text-sm font-black text-ink">{value}</p>
  </div>
);

const ResultDialog: React.FC<{
  result: ExamResult;
  onClose: () => void;
  onDownload: () => void;
  onPrint: () => void;
}> = ({ result, onClose, onDownload, onPrint }) => {
  const isPass = result.passStatus === "pass";
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 p-4" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-ocean">Detailed Scorecard</p>
            <h2 className="mt-2 text-2xl font-black text-ink">{result.title}</h2>
            <p className="mt-1 text-sm text-slate-500">{result.subject} · {result.department} · {result.semester}</p>
          </div>
          <span className={`rounded-full px-4 py-2 text-sm font-black ${isPass ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
            {isPass ? "PASSED" : "FAILED"}
          </span>
        </div>

        <div className="mt-6 grid gap-4 rounded-2xl bg-blue-50 p-5 sm:grid-cols-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-600">Marks Obtained</p>
            <p className="mt-2 text-4xl font-black text-ink">{result.obtainedMarks}<span className="text-lg text-slate-500">/{result.totalMarks}</span></p>
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-600">Percentage</p>
            <p className="mt-2 text-4xl font-black text-ink">{result.percentage}%</p>
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-600">Passing Marks</p>
            <p className="mt-2 text-4xl font-black text-ink">{result.passingMarks}</p>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Field label="Student Name" value={result.id && result.passStatus ? "Current Student" : "—"} />
          <Field label="Roll Number" value={result.id && result.passStatus ? "As per records" : "—"} />
          <Field label="Class / Section" value={`${result.classroomName || "—"} ${result.classSection || ""}`} />
          <Field label="Duration" value={`${result.durationMinutes || 0} minutes`} />
          <Field label="Submitted On" value={formatDate(result.submittedAt)} />
          {result.gradedAt ? <Field label="Graded On" value={formatDate(result.gradedAt)} /> : null}
          {result.gradedBy ? <Field label="Graded By" value={result.gradedBy} /> : null}
          {result.totalQuestions ? <Field label="Total Questions" value={result.totalQuestions.toString()} /> : null}
          {result.correctAnswers ? <Field label="Correct Answers" value={result.correctAnswers.toString()} /> : null}
        </div>

        {result.feedback ? (
          <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
            <div className="flex items-center gap-2 text-emerald-800">
              <ClipboardCheck size={18} />
              <h3 className="font-black">Teacher Feedback</h3>
            </div>
            <p className="mt-3 leading-7 text-emerald-950">{result.feedback}</p>
          </div>
        ) : null}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button onClick={onDownload} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:border-ocean hover:text-ocean">
            <Download size={16} /> Download Scorecard
          </button>
          <button onClick={onPrint} className="inline-flex items-center justify-center gap-2 rounded-xl bg-ocean px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-700">
            <Printer size={16} /> Print Scorecard
          </button>
          <button onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const Field: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="rounded-xl bg-slate-50 p-4">
    <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">{label}</p>
    <p className="mt-1 font-bold text-ink">{value}</p>
  </div>
);

export default ResultsPage;
