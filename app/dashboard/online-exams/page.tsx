"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, BarChart3, Bell, CheckCircle2, ChevronLeft, ChevronRight, Clock, Download, FileText, Laptop, Loader2, Save, ShieldCheck, User } from "lucide-react";
import { collection, doc, getDocs, query, serverTimestamp, setDoc, where } from "firebase/firestore";
import { toast } from "sonner";
import { canAccessAllocationScope, useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";

type QuestionType = "mcq" | "true_false" | "fill_blank" | "short_answer" | "long_answer";

type ExamQuestion = {
  id: string;
  type: QuestionType;
  text: string;
  options?: string[];
  marks?: number;
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
  startAt?: unknown;
  endAt?: unknown;
  durationMinutes?: number;
  totalMarks?: number;
  passingMarks?: number;
  negativeMarking?: string;
  allowedAttempts?: number;
  instructions?: string[];
  questions?: ExamQuestion[];
  status?: "draft" | "scheduled" | "ongoing" | "completed" | "published";
  institutionId?: string;
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

const dateFromValue = (value: unknown) => {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === "string" || typeof value === "number") return new Date(value);
  if (typeof value === "object" && "toDate" in value && typeof value.toDate === "function") return value.toDate() as Date;
  return null;
};

const formatDateTime = (value: unknown) => {
  const date = dateFromValue(value);
  if (!date || Number.isNaN(date.getTime())) return "Not scheduled";
  return date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
};

const getExamStatus = (exam: StudentExam, attempt?: StudentAttempt) => {
  if (attempt?.status === "submitted" || attempt?.status === "graded") return "completed";
  if (attempt?.status === "ongoing") return "ongoing";

  const now = Date.now();
  const start = dateFromValue(exam.startAt)?.getTime();
  const end = dateFromValue(exam.endAt)?.getTime();

  if (start && now < start) return "upcoming";
  if (start && end && now >= start && now <= end) return "ongoing";
  if (exam.status === "published" || exam.status === "completed") return "completed";
  return "upcoming";
};

const secondsToClock = (seconds: number) => {
  const safeSeconds = Math.max(0, seconds);
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
};

const OnlineExamsPage: React.FC = () => {
  const { user } = useAuth();
  const [exams, setExams] = useState<StudentExam[]>([]);
  const [attempts, setAttempts] = useState<StudentAttempt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedExam, setSelectedExam] = useState<StudentExam | null>(null);
  const [activeExam, setActiveExam] = useState<StudentExam | null>(null);
  const [activeAttempt, setActiveAttempt] = useState<StudentAttempt | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [securityWarnings, setSecurityWarnings] = useState(0);
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const attemptsByExamId = useMemo(() => new Map(attempts.map((attempt) => [attempt.examId, attempt])), [attempts]);
  const categorized = useMemo(() => {
    const upcoming: StudentExam[] = [];
    const ongoing: StudentExam[] = [];
    const completed: StudentExam[] = [];

    exams.forEach((exam) => {
      const status = getExamStatus(exam, attemptsByExamId.get(exam.id));
      if (status === "completed") completed.push(exam);
      else if (status === "ongoing") ongoing.push(exam);
      else upcoming.push(exam);
    });

    return { upcoming, ongoing, completed };
  }, [attemptsByExamId, exams]);

  const completedAttempts = attempts.filter((attempt) => attempt.status === "submitted" || attempt.status === "graded");
  const averagePercentage = completedAttempts.length
    ? Math.round(completedAttempts.reduce((sum, attempt) => sum + (attempt.percentage || 0), 0) / completedAttempts.length)
    : 0;
  const latestAttempt = completedAttempts[completedAttempts.length - 1];

  useEffect(() => {
    const loadExams = async () => {
      if (!user) return;
      setIsLoading(true);

      try {
        const examSnapshot = await getDocs(query(collection(db, "examinations"), where("institutionId", "==", user.institutionId || "")));
        const nextExams = examSnapshot.docs
          .map((item) => ({ id: item.id, ...(item.data() as Omit<StudentExam, "id">) }))
          .filter((exam) => canAccessAllocationScope(user, exam));

        const attemptSnapshot = await getDocs(query(collection(db, "examAttempts"), where("studentId", "==", user.id)));
        const nextAttempts = attemptSnapshot.docs.map((item) => ({ id: item.id, ...(item.data() as Omit<StudentAttempt, "id">) }));

        setExams(nextExams);
        setAttempts(nextAttempts);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to load examinations.");
      } finally {
        setIsLoading(false);
      }
    };

    void loadExams();
  }, [user]);

  useEffect(() => {
    if (!activeExam || !activeAttempt) return;
    const durationSeconds = (activeExam.durationMinutes || 0) * 60;
    setRemainingSeconds(durationSeconds);
  }, [activeAttempt, activeExam]);

  useEffect(() => {
    if (!activeExam || !activeAttempt) return;
    if (remainingSeconds <= 0) {
      void submitExam(true);
      return;
    }

    const timer = window.setTimeout(() => setRemainingSeconds((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeAttempt, activeExam, remainingSeconds]);

  useEffect(() => {
    if (!activeExam) return;

    const warn = () => {
      setSecurityWarnings((value) => value + 1);
      toast.warning("Stay on the examination page until submission.");
    };
    const preventDefault = (event: Event) => event.preventDefault();

    document.addEventListener("visibilitychange", warn);
    document.addEventListener("copy", preventDefault);
    document.addEventListener("paste", preventDefault);
    document.addEventListener("contextmenu", preventDefault);

    return () => {
      document.removeEventListener("visibilitychange", warn);
      document.removeEventListener("copy", preventDefault);
      document.removeEventListener("paste", preventDefault);
      document.removeEventListener("contextmenu", preventDefault);
    };
  }, [activeExam]);

  const saveAttempt = async (attempt: StudentAttempt) => {
    setActiveAttempt(attempt);
    setAttempts((current) => current.some((item) => item.id === attempt.id) ? current.map((item) => (item.id === attempt.id ? attempt : item)) : current.concat(attempt));

    try {
      await setDoc(doc(db, "examAttempts", attempt.id), {
        ...attempt,
        studentId: user?.id,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch {
      window.localStorage.setItem(`digiclassroom.examAttempt.${attempt.id}`, JSON.stringify(attempt));
    }
  };

  const startExam = async (exam: StudentExam) => {
    const questions = exam.questions || [];
    if (questions.length === 0) {
      toast.error("This examination has no questions yet.");
      return;
    }

    const existingAttempt = attemptsByExamId.get(exam.id);
    const attempt = existingAttempt || {
      id: `${user?.id || "student"}-${exam.id}`,
      examId: exam.id,
      status: "ongoing" as const,
      answers: {},
      markedForReview: [],
      startedAt: new Date().toISOString()
    };

    setSelectedExam(null);
    setActiveExam(exam);
    setCurrentQuestionIndex(0);
    setSecurityWarnings(0);
    await saveAttempt(attempt);

    try {
      await document.documentElement.requestFullscreen();
    } catch {
      toast.info("Fullscreen mode was not enabled by the browser.");
    }
  };

  const updateAnswer = (questionId: string, answer: string) => {
    if (!activeAttempt) return;
    const nextAttempt = {
      ...activeAttempt,
      answers: {
        ...activeAttempt.answers,
        [questionId]: answer
      }
    };

    setActiveAttempt(nextAttempt);
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = setTimeout(() => void saveAttempt(nextAttempt), 500);
  };

  const markForReview = () => {
    const question = activeExam?.questions?.[currentQuestionIndex];
    if (!question || !activeAttempt) return;
    const marked = activeAttempt.markedForReview.includes(question.id)
      ? activeAttempt.markedForReview.filter((item) => item !== question.id)
      : activeAttempt.markedForReview.concat(question.id);
    void saveAttempt({ ...activeAttempt, markedForReview: marked });
  };

  const submitExam = async (isAutoSubmit = false) => {
    if (!activeExam || !activeAttempt) return;
    if (!isAutoSubmit && !window.confirm("Submit this examination now?")) return;

    const submittedAttempt = {
      ...activeAttempt,
      status: "submitted" as const,
      submittedAt: new Date().toISOString()
    };

    await saveAttempt(submittedAttempt);
    setActiveExam(null);
    setActiveAttempt(null);
    setCurrentQuestionIndex(0);
    if (document.fullscreenElement) await document.exitFullscreen().catch(() => undefined);
    toast.success(isAutoSubmit ? "Time expired. Examination submitted automatically." : "Examination submitted successfully.");
  };

  if (activeExam && activeAttempt) {
    const questions = activeExam.questions || [];
    const question = questions[currentQuestionIndex];
    const answeredCount = questions.filter((item) => activeAttempt.answers[item.id]?.trim()).length;
    const reviewCount = activeAttempt.markedForReview.length;
    const currentAnswer = question ? activeAttempt.answers[question.id] || "" : "";

    return (
      <div className="min-h-screen space-y-5 bg-slate-50 p-4">
        <header className="sticky top-0 z-10 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-ocean">Examination Mode</p>
              <h1 className="mt-1 text-2xl font-black text-ink">{activeExam.title}</h1>
            </div>
            <div className="flex flex-wrap gap-2 text-sm font-bold">
              <span className="rounded-full bg-blue-100 px-3 py-2 text-blue-700">Answered {answeredCount}</span>
              <span className="rounded-full bg-amber-100 px-3 py-2 text-amber-700">Review {reviewCount}</span>
              <span className="rounded-full bg-slate-100 px-3 py-2 text-slate-700">Unanswered {Math.max(0, questions.length - answeredCount)}</span>
              <span className="rounded-full bg-red-100 px-3 py-2 text-red-700"><Clock className="mr-1 inline" size={15} />{secondsToClock(remainingSeconds)}</span>
            </div>
          </div>
        </header>

        <div className="grid gap-5 xl:grid-cols-[1fr_280px]">
          <main className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            {question ? (
              <div>
                <p className="text-sm font-bold text-slate-500">Question {currentQuestionIndex + 1} of {questions.length} · {question.marks || 0} marks</p>
                <h2 className="mt-3 text-xl font-black text-ink">{question.text}</h2>
                <AnswerInput question={question} value={currentAnswer} onChange={(value) => updateAnswer(question.id, value)} />
                <div className="mt-6 flex flex-wrap gap-3">
                  <button disabled={currentQuestionIndex === 0} onClick={() => setCurrentQuestionIndex((value) => value - 1)} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold disabled:opacity-50"><ChevronLeft size={17} /> Previous</button>
                  <button onClick={markForReview} className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-700">Review Later</button>
                  <button onClick={() => void saveAttempt(activeAttempt)} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold"><Save size={17} /> Save</button>
                  <button disabled={currentQuestionIndex >= questions.length - 1} onClick={() => setCurrentQuestionIndex((value) => value + 1)} className="inline-flex items-center gap-2 rounded-xl bg-ocean px-4 py-3 text-sm font-bold text-white disabled:opacity-50">Save & Next <ChevronRight size={17} /></button>
                  <button onClick={() => void submitExam()} className="ml-auto rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white">Submit Exam</button>
                </div>
              </div>
            ) : (
              <EmptyState title="No question selected" text="This examination does not currently contain a visible question." icon={FileText} />
            )}
          </main>

          <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-black text-ink">Question Panel</h2>
            <div className="mt-4 grid grid-cols-5 gap-2">
              {questions.map((item, index) => {
                const answered = activeAttempt.answers[item.id]?.trim();
                const marked = activeAttempt.markedForReview.includes(item.id);
                return (
                  <button key={item.id} onClick={() => setCurrentQuestionIndex(index)} className={`h-10 rounded-xl text-sm font-black ${index === currentQuestionIndex ? "bg-ocean text-white" : marked ? "bg-amber-100 text-amber-700" : answered ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                    {index + 1}
                  </button>
                );
              })}
            </div>
            <div className="mt-5 rounded-2xl bg-red-50 p-4 text-sm text-red-700">
              <AlertTriangle className="mb-2" size={18} />
              Security warnings: {securityWarnings}
            </div>
          </aside>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-7">
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-ocean">Student Examination Portal</p>
        <h1 className="mt-2 text-3xl font-black text-ink">Online Exams</h1>
        <p className="mt-1 text-slate-600">Only examinations matching your Department, Semester, Class / Section, and Subject allocation are shown.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Laptop} label="Assigned Exams" value={exams.length.toString()} />
        <StatCard icon={Clock} label="Upcoming" value={categorized.upcoming.length.toString()} />
        <StatCard icon={CheckCircle2} label="Completed" value={categorized.completed.length.toString()} />
        <StatCard icon={BarChart3} label="Average" value={`${averagePercentage}%`} />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white p-10 text-sm font-semibold text-slate-500">
          <Loader2 className="animate-spin" size={18} />
          Loading examinations...
        </div>
      ) : (
        <>
          <ExamSection title="Upcoming Exams" exams={categorized.upcoming} attemptsByExamId={attemptsByExamId} actionLabel="View Instructions" onAction={setSelectedExam} />
          <ExamSection title="Ongoing Exams" exams={categorized.ongoing} attemptsByExamId={attemptsByExamId} actionLabel="Resume Exam" onAction={startExam} />
          <CompletedSection exams={categorized.completed} attemptsByExamId={attemptsByExamId} onViewResult={setSelectedExam} />
          <ReportsSection attempts={completedAttempts} latestAttempt={latestAttempt} />
          <ProfileSection user={user} />
        </>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <Bell className="text-ocean" size={22} />
          <h2 className="text-xl font-black text-ink">Notifications</h2>
        </div>
        <EmptyState title="No examination notifications" text="New assignments, start reminders, submissions, results, feedback, and schedule changes will appear here." icon={Bell} compact />
      </section>

      {selectedExam ? (
        <InstructionsDialog
          exam={selectedExam}
          attempt={attemptsByExamId.get(selectedExam.id)}
          onClose={() => setSelectedExam(null)}
          onStart={() => void startExam(selectedExam)}
        />
      ) : null}
    </div>
  );
};

const AnswerInput: React.FC<{ question: ExamQuestion; value: string; onChange: (value: string) => void }> = ({ question, value, onChange }) => {
  if (question.type === "mcq" || question.type === "true_false") {
    const options = question.type === "true_false" ? ["True", "False"] : question.options || [];
    return (
      <div className="mt-5 grid gap-3">
        {options.map((option) => (
          <button key={option} onClick={() => onChange(option)} className={`rounded-xl border px-4 py-3 text-left font-semibold transition ${value === option ? "border-ocean bg-blue-50 text-ocean" : "border-slate-200 text-slate-700 hover:border-ocean"}`}>
            {option}
          </button>
        ))}
      </div>
    );
  }

  return (
    <textarea
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="mt-5 min-h-40 w-full resize-none rounded-xl border border-slate-200 p-4 outline-none focus:border-ocean focus:ring-2 focus:ring-ocean/20"
      placeholder={question.type === "fill_blank" ? "Enter your answer" : "Write your answer"}
    />
  );
};

const StatCard: React.FC<{ icon: React.ElementType; label: string; value: string }> = ({ icon: Icon, label, value }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <Icon className="text-ocean" size={24} />
    <p className="mt-4 text-3xl font-black text-ink">{value}</p>
    <p className="text-sm font-semibold text-slate-500">{label}</p>
  </div>
);

const ExamSection: React.FC<{
  title: string;
  exams: StudentExam[];
  attemptsByExamId: Map<string, StudentAttempt>;
  actionLabel: string;
  onAction: (exam: StudentExam) => void;
}> = ({ title, exams, attemptsByExamId, actionLabel, onAction }) => (
  <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
    <h2 className="text-xl font-black text-ink">{title}</h2>
    {exams.length ? (
      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        {exams.map((exam) => <ExamCard key={exam.id} exam={exam} attempt={attemptsByExamId.get(exam.id)} actionLabel={actionLabel} onAction={() => onAction(exam)} />)}
      </div>
    ) : (
      <EmptyState title={`No ${title.toLowerCase()}`} text="Assigned examinations will appear here after teachers or organizers publish real exam records." icon={Laptop} compact />
    )}
  </section>
);

const ExamCard: React.FC<{ exam: StudentExam; attempt?: StudentAttempt; actionLabel: string; onAction: () => void }> = ({ exam, attempt, actionLabel, onAction }) => (
  <article className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
    <div className="flex items-start justify-between gap-4">
      <div>
        <h3 className="font-black text-ink">{exam.title}</h3>
        <p className="mt-1 text-sm text-slate-500">{exam.subject || "Subject"} · {exam.department || "Department"} · {exam.semester || "Semester"} · {exam.classroomName || "Class"} {exam.classSection || ""}</p>
      </div>
      <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-black text-blue-700">{getExamStatus(exam, attempt)}</span>
    </div>
    <div className="mt-4 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
      <p>Date: {formatDateTime(exam.startAt)}</p>
      <p>Duration: {exam.durationMinutes || 0} minutes</p>
      <p>Total marks: {exam.totalMarks || 0}</p>
      <p>Questions: {exam.questions?.length || 0}</p>
    </div>
    <button onClick={onAction} className="mt-5 rounded-xl bg-ocean px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-700">{actionLabel}</button>
  </article>
);

const CompletedSection: React.FC<{ exams: StudentExam[]; attemptsByExamId: Map<string, StudentAttempt>; onViewResult: (exam: StudentExam) => void }> = ({ exams, attemptsByExamId, onViewResult }) => (
  <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
    <h2 className="text-xl font-black text-ink">Completed Exams</h2>
    {exams.length ? (
      <div className="mt-5 space-y-3">
        {exams.map((exam) => {
          const attempt = attemptsByExamId.get(exam.id);
          return (
            <div key={exam.id} className="grid gap-3 rounded-2xl border border-slate-100 p-4 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <p className="font-black text-ink">{exam.title}</p>
                <p className="mt-1 text-sm text-slate-500">{exam.subject || "Subject"} · Submitted {formatDateTime(attempt?.submittedAt)}</p>
              </div>
              <button onClick={() => onViewResult(exam)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700">View Result</button>
            </div>
          );
        })}
      </div>
    ) : (
      <EmptyState title="No completed examinations" text="Submitted and evaluated examinations will appear here." icon={CheckCircle2} compact />
    )}
  </section>
);

const ReportsSection: React.FC<{ attempts: StudentAttempt[]; latestAttempt?: StudentAttempt }> = ({ attempts, latestAttempt }) => (
  <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
    <h2 className="text-xl font-black text-ink">Performance Reports</h2>
    {attempts.length ? (
      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <StatCard icon={BarChart3} label="Completed" value={attempts.length.toString()} />
        <StatCard icon={CheckCircle2} label="Latest Percentage" value={`${latestAttempt?.percentage || 0}%`} />
        <StatCard icon={ShieldCheck} label="Published Reports" value={attempts.filter((item) => item.status === "graded").length.toString()} />
      </div>
    ) : (
      <EmptyState title="No performance report yet" text="Reports require submitted examinations and published results." icon={BarChart3} compact />
    )}
  </section>
);

const ProfileSection: React.FC<{ user: ReturnType<typeof useAuth>["user"] }> = ({ user }) => (
  <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
    <div className="flex items-center gap-3">
      <User className="text-ocean" size={22} />
      <h2 className="text-xl font-black text-ink">Student Profile</h2>
    </div>
    <div className="mt-5 grid gap-3 text-sm md:grid-cols-2">
      <ProfileRow label="Name" value={user?.name} />
      <ProfileRow label="Roll Number" value={user?.rollNumber} />
      <ProfileRow label="Department" value={user?.department} />
      <ProfileRow label="Semester" value={user?.semester} />
      <ProfileRow label="Class / Section" value={[user?.classroomName, user?.classSection].filter(Boolean).join(" · ")} />
      <ProfileRow label="Email" value={user?.email} />
    </div>
  </section>
);

const ProfileRow: React.FC<{ label: string; value?: string }> = ({ label, value }) => (
  <div className="rounded-xl bg-slate-50 p-4">
    <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">{label}</p>
    <p className="mt-1 font-bold text-ink">{value || "Not allocated"}</p>
  </div>
);

const InstructionsDialog: React.FC<{ exam: StudentExam; attempt?: StudentAttempt; onClose: () => void; onStart: () => void }> = ({ exam, attempt, onClose, onStart }) => (
  <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 p-4">
    <section className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
      <p className="text-sm font-black uppercase tracking-[0.2em] text-ocean">Exam Instructions</p>
      <h2 className="mt-2 text-2xl font-black text-ink">{exam.title}</h2>
      <div className="mt-5 grid gap-3 text-sm md:grid-cols-2">
        <ProfileRow label="Subject" value={exam.subject} />
        <ProfileRow label="Total Marks" value={(exam.totalMarks || 0).toString()} />
        <ProfileRow label="Duration" value={`${exam.durationMinutes || 0} minutes`} />
        <ProfileRow label="Questions" value={(exam.questions?.length || 0).toString()} />
        <ProfileRow label="Negative Marking" value={exam.negativeMarking || "None"} />
        <ProfileRow label="Allowed Attempts" value={(exam.allowedAttempts || 1).toString()} />
      </div>
      <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
        {(exam.instructions?.length ? exam.instructions : [
          "Stay on the examination page until submission.",
          "Do not copy, paste, or use right-click during the examination.",
          "Answers are saved automatically while you work.",
          "The exam submits automatically when the timer reaches zero."
        ]).map((item) => <p key={item}>• {item}</p>)}
      </div>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
        <button onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700">Close</button>
        <button onClick={onStart} disabled={attempt?.status === "submitted" || attempt?.status === "graded"} className="rounded-xl bg-ocean px-4 py-3 text-sm font-bold text-white disabled:bg-slate-300">Start Exam</button>
      </div>
    </section>
  </div>
);

const EmptyState: React.FC<{ title: string; text: string; icon: React.ElementType; compact?: boolean }> = ({ title, text, icon: Icon, compact }) => (
  <div className={`rounded-2xl border border-dashed border-slate-300 bg-slate-50 text-center ${compact ? "mt-5 p-6" : "p-10"}`}>
    <Icon className="mx-auto text-ocean" size={compact ? 24 : 32} />
    <h3 className="mt-3 font-black text-ink">{title}</h3>
    <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">{text}</p>
  </div>
);

export default OnlineExamsPage;
