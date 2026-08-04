"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Clock, FileText, Send } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { defaultAssignments, type Assignment } from "@/lib/student/data";

const AssignmentsPage: React.FC = () => {
  const [assignments, setAssignments] = useState<Assignment[]>(defaultAssignments);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const { user } = useAuth();

  const submitAssignment = (id: string) => {
    const text = drafts[id]?.trim();
    if (!text) {
      toast.error("Write a short answer before submitting.");
      return;
    }
    const nextAssignments = assignments.map((item) => item.id === id ? { ...item, status: "submitted" as const, submittedText: text } : item);
    setAssignments(nextAssignments);
    setDrafts((current) => ({ ...current, [id]: "" }));
    toast.success("Assignment submitted");
  };

  const createAssignment = () => {
    const title = window.prompt("Assignment title");
    if (!title) return;
    const nextAssignments = assignments.concat({
      id: Date.now().toString(),
      title,
      subject: "Data Structures",
      dueDate: "2026-08-15",
      points: 25,
      status: "pending"
    });
    setAssignments(nextAssignments);
    toast.success("Assignment created for students");
  };

  if (user?.role === "teacher") {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-ocean">Teacher Assignments</p>
            <h1 className="mt-2 text-3xl font-black text-ink">Create and Review Assignments</h1>
            <p className="mt-1 text-slate-600">Create assignments, review submissions, add marks, and publish feedback.</p>
          </div>
          <button onClick={createAssignment} className="rounded-xl bg-ocean px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700">Create Assignment</button>
        </div>
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="grid grid-cols-5 gap-4 border-b border-slate-100 bg-slate-50 p-4 text-sm font-bold text-slate-600">
            <span>Assignment</span><span>Class</span><span>Due Date</span><span>Submitted</span><span>Pending</span>
          </div>
          {assignments.map((assignment, index) => (
            <div key={assignment.id} className="grid grid-cols-5 gap-4 border-b border-slate-100 p-4 text-sm last:border-0">
              <span className="font-bold text-ink">{assignment.title}</span>
              <span>CSE {index + 2} Year</span>
              <span>{assignment.dueDate}</span>
              <span>{assignment.status === "submitted" || assignment.status === "graded" ? 38 : 12}</span>
              <span>{assignment.status === "pending" ? 30 : 4}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-ocean">Student Work</p>
        <h1 className="mt-2 text-3xl font-black text-ink">Assignments</h1>
        <p className="mt-1 text-slate-600">Submit work and track your assignment status.</p>
      </div>

      <div className="grid gap-5">
        {assignments.map((assignment, index) => (
          <motion.article key={assignment.id} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex gap-4">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-blue-100 text-blue-600">
                  <FileText size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-ink">{assignment.title}</h2>
                  <p className="text-sm text-slate-500">{assignment.subject} · due {assignment.dueDate} · {assignment.points} points</p>
                </div>
              </div>
              <span className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-1 text-xs font-bold capitalize ${assignment.status === "pending" ? "bg-amber-100 text-amber-700" : assignment.status === "submitted" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}`}>
                {assignment.status === "pending" ? <Clock size={14} /> : <CheckCircle2 size={14} />}
                {assignment.status}
              </span>
            </div>

            {assignment.status === "pending" ? (
              <div className="mt-5">
                <textarea
                  value={drafts[assignment.id] || ""}
                  onChange={(event) => setDrafts((current) => ({ ...current, [assignment.id]: event.target.value }))}
                  placeholder="Type your answer or submission note here..."
                  className="min-h-28 w-full resize-none rounded-xl border border-slate-200 p-4 outline-none focus:border-ocean focus:ring-2 focus:ring-ocean/20"
                />
                <button onClick={() => submitAssignment(assignment.id)} className="mt-3 inline-flex items-center gap-2 rounded-xl bg-ocean px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700">
                  <Send size={18} />
                  Submit Assignment
                </button>
              </div>
            ) : (
              <div className="mt-5 rounded-xl bg-slate-50 p-4">
                <p className="text-sm font-bold text-slate-700">{assignment.grade ? `Grade: ${assignment.grade}` : "Submitted for review"}</p>
                {assignment.submittedText && <p className="mt-2 text-sm text-slate-600">{assignment.submittedText}</p>}
              </div>
            )}
          </motion.article>
        ))}
      </div>
    </div>
  );
};

export default AssignmentsPage;
