"use client";

import React, { useState } from "react";
import { CheckCircle2, Clock, Laptop, Send } from "lucide-react";
import { toast } from "sonner";
import { defaultExams, type Exam } from "@/lib/student/data";

const questions = [
  { question: "What is 12 x 8?", options: ["84", "96", "108"], answer: "96" },
  { question: "Which unit measures force?", options: ["Newton", "Joule", "Watt"], answer: "Newton" },
  { question: "What is H2O commonly called?", options: ["Salt", "Water", "Oxygen"], answer: "Water" }
];

const OnlineExamsPage: React.FC = () => {
  const [exams, setExams] = useState<Exam[]>(defaultExams);
  const [activeExam, setActiveExam] = useState<Exam | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});

  const finishExam = () => {
    if (!activeExam) return;
    const correct = questions.filter((item, index) => answers[index] === item.answer).length;
    const score = Math.round((correct / questions.length) * 100);
    const nextExams = exams.map((item) => item.id === activeExam.id ? { ...item, status: "completed" as const, score } : item);
    setExams(nextExams);
    setActiveExam(null);
    setAnswers({});
    toast.success(`Exam submitted. Score: ${score}%`);
  };

  if (activeExam) {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-ocean">Exam Mode</p>
              <h1 className="mt-2 text-3xl font-black text-ink">{activeExam.title}</h1>
            </div>
            <div className="inline-flex w-fit items-center gap-2 rounded-full bg-amber-100 px-4 py-2 text-sm font-bold text-amber-700">
              <Clock size={18} />
              {activeExam.duration}
            </div>
          </div>
        </div>
        {questions.map((item, index) => (
          <section key={item.question} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="font-black text-ink">Q{index + 1}. {item.question}</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {item.options.map((option) => (
                <button key={option} onClick={() => setAnswers((current) => ({ ...current, [index]: option }))} className={`rounded-xl border px-4 py-3 text-left font-semibold transition ${answers[index] === option ? "border-ocean bg-blue-50 text-ocean" : "border-slate-200 bg-white text-slate-700 hover:border-ocean"}`}>
                  {option}
                </button>
              ))}
            </div>
          </section>
        ))}
        <button onClick={finishExam} className="inline-flex items-center gap-2 rounded-xl bg-ocean px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700">
          <Send size={18} />
          Submit Exam
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-ocean">Assessments</p>
        <h1 className="mt-2 text-3xl font-black text-ink">Online Exams</h1>
        <p className="mt-1 text-slate-600">Start tests and see completion status.</p>
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        {exams.map((exam) => (
          <article key={exam.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-blue-100 text-blue-600">
                <Laptop size={24} />
              </div>
              {exam.status === "completed" && <CheckCircle2 className="text-mint" size={24} />}
            </div>
            <h2 className="mt-5 text-xl font-black text-ink">{exam.title}</h2>
            <p className="mt-1 text-sm text-slate-500">{exam.subject} · {exam.duration} · {exam.questions} questions</p>
            {exam.status === "completed" ? (
              <p className="mt-5 rounded-xl bg-green-50 px-4 py-3 text-sm font-bold text-green-700">Completed · Score {exam.score}%</p>
            ) : (
              <button onClick={() => setActiveExam(exam)} className="mt-5 rounded-xl bg-ocean px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700">Start Exam</button>
            )}
          </article>
        ))}
      </div>
    </div>
  );
};

export default OnlineExamsPage;
