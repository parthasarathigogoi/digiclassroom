"use client";

import React, { useState } from "react";
import { ClipboardList, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

type Question = {
  id: string;
  className: string;
  subject: string;
  chapter: string;
  type: string;
  difficulty: string;
  marks: number;
  text: string;
};

const initialQuestions: Question[] = [
  { id: "q1", className: "CSE 3rd Year", subject: "Data Structures", chapter: "Stack", type: "MCQ", difficulty: "Medium", marks: 2, text: "Which data structure follows LIFO?" },
  { id: "q2", className: "CSE 2nd Year", subject: "DBMS", chapter: "SQL", type: "Descriptive", difficulty: "Hard", marks: 5, text: "Explain normalization with examples." }
];

const QuestionBankPage: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>(initialQuestions);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ className: "CSE 3rd Year", subject: "Data Structures", chapter: "", type: "MCQ", difficulty: "Medium", marks: "2", text: "" });

  const filtered = questions.filter((item) => `${item.className} ${item.subject} ${item.chapter} ${item.type} ${item.text}`.toLowerCase().includes(search.toLowerCase()));

  const addQuestion = (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.chapter.trim() || !form.text.trim()) {
      toast.error("Chapter and question are required.");
      return;
    }
    setQuestions((current) => current.concat({ ...form, id: Date.now().toString(), marks: Number(form.marks) || 1 }));
    setForm((current) => ({ ...current, chapter: "", text: "" }));
    toast.success("Question added");
  };

  const generatePaper = () => {
    const selected = questions.slice(0, 5);
    toast.success(`Generated a ${selected.reduce((sum, item) => sum + item.marks, 0)} mark paper from ${selected.length} questions`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-ocean">Teacher Tool</p>
          <h1 className="mt-2 text-3xl font-black text-ink">Question Bank</h1>
          <p className="mt-1 text-slate-600">Add, search, delete, and generate randomized test papers.</p>
        </div>
        <button onClick={generatePaper} className="rounded-xl bg-ink px-5 py-3 text-sm font-bold text-white transition hover:bg-ocean">Generate Test Paper</button>
      </div>

      <form onSubmit={addQuestion} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-3">
        <input value={form.className} onChange={(e) => setForm({ ...form, className: e.target.value })} className="rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-ocean" placeholder="Class" />
        <input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-ocean" placeholder="Subject" />
        <input value={form.chapter} onChange={(e) => setForm({ ...form, chapter: e.target.value })} className="rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-ocean" placeholder="Chapter" />
        <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-ocean">
          <option>MCQ</option><option>True/False</option><option>Fill in the Blanks</option><option>Short Answer</option><option>Descriptive</option>
        </select>
        <select value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })} className="rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-ocean">
          <option>Easy</option><option>Medium</option><option>Hard</option>
        </select>
        <input value={form.marks} onChange={(e) => setForm({ ...form, marks: e.target.value })} type="number" className="rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-ocean" placeholder="Marks" />
        <textarea value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} className="min-h-24 rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-ocean md:col-span-3" placeholder="Question" />
        <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-ocean px-5 py-3 text-sm font-bold text-white md:col-span-3"><Plus size={18} /> Add Question</button>
      </form>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        <input value={search} onChange={(e) => setSearch(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-12 pr-4 outline-none focus:border-ocean" placeholder="Search questions..." />
      </div>

      <div className="space-y-3">
        {filtered.map((question) => (
          <article key={question.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div className="flex gap-4">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-blue-100 text-blue-600"><ClipboardList size={22} /></div>
                <div>
                  <p className="font-black text-ink">{question.text}</p>
                  <p className="mt-1 text-sm text-slate-500">{question.className} · {question.subject} · {question.chapter} · {question.type} · {question.difficulty} · {question.marks} marks</p>
                </div>
              </div>
              <button onClick={() => setQuestions((current) => current.filter((item) => item.id !== question.id))} className="rounded-xl p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"><Trash2 size={18} /></button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};

export default QuestionBankPage;
