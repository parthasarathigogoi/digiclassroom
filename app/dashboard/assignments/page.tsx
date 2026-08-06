"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  ClipboardEdit,
  Download,
  FileText,
  Loader2,
  Paperclip,
  Send,
  ThumbsUp,
  Upload,
  XCircle
} from "lucide-react";
import {
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where
} from "firebase/firestore";
import { toast } from "sonner";
import { canAccessAllocationScope, useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";

type AssignmentStatus = "pending" | "submitted" | "graded";

type Assignment = {
  id: string;
  title: string;
  description?: string;
  subject?: string;
  subjectId?: string;
  department?: string;
  departmentId?: string;
  semester?: string;
  semesterId?: string;
  classroomName?: string;
  classroomId?: string;
  classSection?: string;
  totalMarks?: number;
  dueDate?: unknown;
  createdAt?: unknown;
  attachments?: { name: string; url: string }[];
  instructions?: string[];
  institutionId?: string;
  createdBy?: string;
};

type Submission = {
  id: string;
  assignmentId: string;
  answerText?: string;
  attachments?: { name: string; url: string }[];
  submittedAt?: unknown;
  status: "submitted" | "graded";
  obtainedMarks?: number;
  feedback?: string;
  gradedBy?: string;
  gradedAt?: unknown;
};

const dateFromValue = (value: unknown) => {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === "string" || typeof value === "number") return new Date(value);
  if (typeof value === "object" && "toDate" in value && typeof value.toDate === "function") return value.toDate() as Date;
  return null;
};

const formatDate = (value: unknown) => {
  const date = dateFromValue(value);
  if (!date || Number.isNaN(date.getTime())) return "Not scheduled";
  return date.toLocaleDateString(undefined, { dateStyle: "long" });
};

const formatDateTime = (value: unknown) => {
  const date = dateFromValue(value);
  if (!date || Number.isNaN(date.getTime())) return "Not available";
  return date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
};

const getDaysRemaining = (dueDate: unknown) => {
  const due = dateFromValue(dueDate);
  if (!due) return null;
  const now = Date.now();
  const diffMs = due.getTime() - now;
  const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return days;
};

const TABS: { id: AssignmentStatus; label: string; icon: React.ElementType }[] = [
  { id: "pending", label: "Pending", icon: Clock },
  { id: "submitted", label: "Submitted", icon: Send },
  { id: "graded", label: "Graded", icon: CheckCircle2 }
];

const AssignmentsPage: React.FC = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [activeTab, setActiveTab] = useState<AssignmentStatus>("pending");
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [submissionText, setSubmissionText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadAssignments = async () => {
      if (!user) return;
      setIsLoading(true);

      try {
        const assignmentsSnapshot = await getDocs(query(collection(db, "assignments")));
        const allAssignments = assignmentsSnapshot.docs
          .map((item) => ({ id: item.id, ...(item.data() as Omit<Assignment, "id">) }))
          .filter((a) => canAccessAllocationScope(user, a));

        const submissionsSnapshot = await getDocs(query(collection(db, "assignmentSubmissions"), where("studentId", "==", user.id)));
        const allSubmissions = submissionsSnapshot.docs.map((item) => ({
          id: item.id,
          ...(item.data() as Omit<Submission, "id">)
        }));

        setAssignments(allAssignments);
        setSubmissions(allSubmissions);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to load assignments.");
      } finally {
        setIsLoading(false);
      }
    };

    void loadAssignments();
  }, [user]);

  const submissionByAssignment = useMemo(
    () => new Map(submissions.map((s) => [s.assignmentId, s])),
    [submissions]
  );

  const categorize = useMemo(() => {
    const pending: Assignment[] = [];
    const submitted: Assignment[] = [];
    const graded: Assignment[] = [];

    assignments.forEach((a) => {
      const sub = submissionByAssignment.get(a.id);
      if (sub?.status === "graded") graded.push(a);
      else if (sub?.status === "submitted") submitted.push(a);
      else pending.push(a);
    });

    return { pending, submitted, graded };
  }, [assignments, submissionByAssignment]);

  const counts = {
    pending: categorize.pending.length,
    submitted: categorize.submitted.length,
    graded: categorize.graded.length
  };

  const activeList = categorize[activeTab];

  const submitAssignment = async () => {
    if (!selectedAssignment || !user) return;
    if (!submissionText.trim()) {
      toast.error("Please write your answer before submitting.");
      return;
    }

    setIsSubmitting(true);
    try {
      const submissionId = `${user.id}-${selectedAssignment.id}`;
      const submission: Submission = {
        id: submissionId,
        assignmentId: selectedAssignment.id,
        answerText: submissionText,
        status: "submitted",
        submittedAt: serverTimestamp()
      };

      await setDoc(doc(db, "assignmentSubmissions", submissionId), {
        ...submission,
        studentId: user.id,
        studentName: user.name,
        rollNumber: user.rollNumber,
        departmentId: user.departmentId,
        semesterId: user.semesterId,
        classroomId: user.classroomId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      setSubmissions((cur) => {
        if (cur.some((s) => s.id === submissionId)) {
          return cur.map((s) => (s.id === submissionId ? { ...s, ...submission } : s));
        }
        return [...cur, submission];
      });

      toast.success("Assignment submitted successfully.");
      setSelectedAssignment(null);
      setSubmissionText("");
      setActiveTab("submitted");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to submit assignment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-7">
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-ocean">Student Work</p>
        <h1 className="mt-2 text-3xl font-black text-ink">Assignments</h1>
        <p className="mt-1 text-slate-600">
          Only assignments matched to your Department, Semester, Class, and Subject allocation are shown.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <QuickStat icon={Clock} label="Pending" value={counts.pending.toString()} color="bg-amber-100 text-amber-700" />
        <QuickStat icon={Send} label="Submitted" value={counts.submitted.toString()} color="bg-blue-100 text-blue-700" />
        <QuickStat icon={CheckCircle2} label="Graded" value={counts.graded.toString()} color="bg-emerald-100 text-emerald-700" />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
        <div className="grid gap-2 sm:grid-cols-3">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition ${
                  isActive ? "bg-ocean text-white shadow" : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <Icon size={16} />
                {tab.label}
                <span className={`rounded-full px-2 py-0.5 text-xs ${isActive ? "bg-white/20" : "bg-slate-100 text-slate-500"}`}>
                  {counts[tab.id]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white p-10 text-sm font-semibold text-slate-500 shadow-sm">
          <Loader2 className="animate-spin" size={18} />
          Loading assignments...
        </div>
      ) : activeList.length ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {activeList.map((a) => {
            const submission = submissionByAssignment.get(a.id);
            const days = getDaysRemaining(a.dueDate);
            const status: AssignmentStatus =
              submission?.status === "graded" ? "graded" : submission?.status === "submitted" ? "submitted" : "pending";
            return (
              <AssignmentCard
                key={a.id}
                assignment={a}
                submission={submission}
                status={status}
                daysRemaining={days}
                onView={() => setSelectedAssignment(a)}
              />
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
          <ClipboardEdit className="mx-auto text-ocean" size={32} />
          <h2 className="mt-4 text-lg font-black text-ink">No {activeTab} assignments</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
            Assignments are displayed once teachers or organizers publish them for the correct allocation scope.
          </p>
        </div>
      )}

      {selectedAssignment ? (
        <AssignmentDialog
          assignment={selectedAssignment}
          submission={submissionByAssignment.get(selectedAssignment.id)}
          answerText={submissionText}
          onAnswerChange={setSubmissionText}
          onClose={() => {
            setSelectedAssignment(null);
            setSubmissionText("");
          }}
          onSubmit={submitAssignment}
          isSubmitting={isSubmitting}
        />
      ) : null}
    </div>
  );
};

const QuickStat: React.FC<{ icon: React.ElementType; label: string; value: string; color: string }> = ({
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

const AssignmentCard: React.FC<{
  assignment: Assignment;
  submission?: Submission;
  status: AssignmentStatus;
  daysRemaining: number | null;
  onView: () => void;
}> = ({ assignment, submission, status, daysRemaining, onView }) => {
  const StatusBadge = () => {
    if (status === "graded") {
      const passed = (submission?.obtainedMarks || 0) >= Math.ceil((assignment.totalMarks || 0) * 0.35);
      return (
        <span className={`rounded-full px-3 py-1 text-xs font-black ${passed ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
          {passed ? "PASS" : "NEEDS REVIEW"} · {submission?.obtainedMarks || 0}/{assignment.totalMarks || 0}
        </span>
      );
    }
    if (status === "submitted") {
      return <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-black text-blue-700">Awaiting Grade</span>;
    }
    if (daysRemaining === null) {
      return <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-700">Due date not set</span>;
    }
    if (daysRemaining < 0) {
      return <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-black text-rose-700">Overdue · {Math.abs(daysRemaining)}d</span>;
    }
    if (daysRemaining === 0) {
      return <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-700">Due today</span>;
    }
    return <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-700">Due in {daysRemaining}d</span>;
  };

  return (
    <article className="rounded-2xl border border-slate-100 bg-slate-50 p-5 transition hover:border-ocean/30 hover:bg-white hover:shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-ocean">{assignment.subject || "Subject"}</p>
          <h3 className="mt-1 text-lg font-black text-ink">{assignment.title}</h3>
        </div>
        <StatusBadge />
      </div>

      {assignment.description ? (
        <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">{assignment.description}</p>
      ) : null}

      <div className="mt-4 grid gap-2 text-sm sm:grid-cols-3">
        <InfoRow icon={FileText} label="Marks" value={`${assignment.totalMarks || 0}`} />
        <InfoRow icon={CalendarDays} label="Due" value={formatDate(assignment.dueDate)} />
        <InfoRow icon={CheckCircle2} label="Created" value={formatDate(assignment.createdAt)} />
      </div>

      {submission?.obtainedMarks != null && status === "graded" ? (
        <div className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">
          <div className="flex items-center gap-2 font-black">
            <ThumbsUp size={16} /> Marks: {submission.obtainedMarks} / {assignment.totalMarks || 0}
          </div>
          {submission.feedback ? <p className="mt-2 leading-6">{submission.feedback}</p> : null}
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        {assignment.attachments?.length ? (
          <button className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700">
            <Paperclip size={14} /> {assignment.attachments.length} Attachment{assignment.attachments.length > 1 ? "s" : ""}
          </button>
        ) : null}
        <button
          onClick={onView}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold text-white transition ${
            status === "pending" ? "bg-ocean hover:bg-blue-700" : "bg-slate-800 hover:bg-slate-900"
          }`}
        >
          {status === "pending" ? <>Open & Submit</> : "View Details"}
        </button>
      </div>
    </article>
  );
};

const InfoRow: React.FC<{ icon: React.ElementType; label: string; value: string }> = ({ icon: Icon, label, value }) => (
  <div className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-slate-600">
    <Icon size={14} />
    <span className="text-xs font-bold text-slate-500">{label}:</span>
    <span className="text-xs font-black text-ink truncate">{value}</span>
  </div>
);

const AssignmentDialog: React.FC<{
  assignment: Assignment;
  submission?: Submission;
  answerText: string;
  onAnswerChange: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}> = ({ assignment, submission, answerText, onAnswerChange, onClose, onSubmit, isSubmitting }) => {
  const isGraded = submission?.status === "graded";
  const isSubmitted = submission?.status === "submitted" && !isGraded;
  const canEdit = !isGraded && !isSubmitted;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 p-4" onClick={onClose}>
      <div
        className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-ocean">{assignment.subject || "Assignment"}</p>
            <h2 className="mt-2 text-2xl font-black text-ink">{assignment.title}</h2>
            <p className="mt-1 text-sm text-slate-500">
              Due: {formatDate(assignment.dueDate)} · Total: {assignment.totalMarks || 0} marks
            </p>
          </div>
          <button onClick={onClose} className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-50">
            <XCircle size={20} />
          </button>
        </div>

        {assignment.description ? (
          <div className="mt-6 rounded-2xl bg-slate-50 p-5 text-sm leading-7 text-slate-700">
            {assignment.description}
          </div>
        ) : null}

        {assignment.instructions?.length ? (
          <div className="mt-5">
            <h3 className="text-sm font-black text-ink">Instructions</h3>
            <ul className="mt-3 space-y-2 rounded-2xl bg-blue-50 p-4 text-sm text-blue-900">
              {assignment.instructions.map((item, i) => (
                <li key={i} className="flex gap-2">
                  <CheckCircle2 size={16} className="mt-0.5 flex-shrink-0 text-ocean" /> {item}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {assignment.attachments?.length ? (
          <div className="mt-5">
            <h3 className="text-sm font-black text-ink">Attachments</h3>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {assignment.attachments.map((att, i) => (
                <a
                  key={i}
                  href={att.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:border-ocean hover:text-ocean"
                >
                  <Download size={15} /> {att.name}
                </a>
              ))}
            </div>
          </div>
        ) : null}

        {isGraded ? (
          <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="font-black text-emerald-800">Graded Result</h3>
              <span className="rounded-full bg-emerald-700 px-4 py-2 text-sm font-black text-white">
                {submission?.obtainedMarks || 0} / {assignment.totalMarks || 0}
              </span>
            </div>
            {submission?.feedback ? (
              <p className="mt-4 rounded-xl bg-white p-4 leading-7 text-emerald-950">{submission.feedback}</p>
            ) : null}
            {submission?.answerText ? (
              <div className="mt-5">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">Your Submission</p>
                <div className="mt-2 whitespace-pre-wrap rounded-xl bg-white p-4 text-sm leading-7 text-slate-800">
                  {submission.answerText}
                </div>
              </div>
            ) : null}
          </div>
        ) : isSubmitted ? (
          <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 p-5">
            <h3 className="font-black text-blue-800">Awaiting Grade</h3>
            <p className="mt-2 text-sm text-blue-900">Submitted on {formatDateTime(submission?.submittedAt)}.</p>
            {submission?.answerText ? (
              <div className="mt-4">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-700">Your Submission</p>
                <div className="mt-2 whitespace-pre-wrap rounded-xl bg-white p-4 text-sm leading-7 text-slate-800">
                  {submission.answerText}
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="mt-6">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-black text-ink">Your Answer</h3>
              <button
                disabled
                className="inline-flex items-center gap-2 rounded-xl border border-dashed border-slate-300 px-3 py-2 text-xs font-bold text-slate-500"
              >
                <Upload size={14} /> Attach File
              </button>
            </div>
            <textarea
              value={answerText}
              onChange={(e) => onAnswerChange(e.target.value)}
              disabled={!canEdit}
              rows={10}
              className="mt-3 w-full resize-none rounded-2xl border border-slate-200 p-4 text-sm leading-7 outline-none focus:border-ocean focus:ring-4 focus:ring-ocean/20 disabled:bg-slate-50 disabled:text-slate-500"
              placeholder="Write your assignment answer here. Support for file attachments can be enabled through organizer settings."
            />
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700">
                Cancel
              </button>
              <button
                onClick={onSubmit}
                disabled={isSubmitting || !canEdit}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-ocean px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:opacity-60"
              >
                {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
                Submit Assignment
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssignmentsPage;
