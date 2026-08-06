"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BookOpen,
  Check,
  CheckCircle2,
  ClipboardEdit,
  Edit3,
  FileJson,
  Filter,
  Loader2,
  Plus,
  Search,
  Send,
  Sparkles,
  Tag,
  Trash2,
  UploadCloud,
  X
} from "lucide-react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where
} from "firebase/firestore";
import { toast } from "sonner";
import {
  canAccessAllocationScope,
  type AcademicClass,
  type AcademicDepartment,
  type AcademicSemester,
  type AcademicSubject,
  useAuth
} from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";

export type QuestionType = "mcq" | "true_false" | "fill_blank" | "short_answer" | "descriptive";
export type DifficultyLevel = "Easy" | "Medium" | "Hard";

export type BankQuestion = {
  id: string;
  type: QuestionType;
  text: string;
  options?: string[];
  correctOption?: number;
  correctAnswer?: string;
  explanation?: string;
  marks: number;
  difficulty: DifficultyLevel;
  chapter?: string;
  topic?: string;
  subjectId?: string;
  subject?: string;
  departmentId?: string;
  department?: string;
  semesterId?: string;
  semester?: string;
  classroomId?: string;
  classroomName?: string;
  classSection?: string;
  institutionId?: string;
  createdBy?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
};

const QUESTION_TYPE_META: Record<QuestionType, { label: string; short: string; color: string; sample: string }> = {
  mcq: { label: "Multiple Choice (MCQ)", short: "MCQ", color: "bg-blue-100 text-blue-700", sample: "4 options, pick 1 answer" },
  true_false: { label: "True / False", short: "T/F", color: "bg-emerald-100 text-emerald-700", sample: "True or False statement" },
  fill_blank: { label: "Fill in the Blanks", short: "Fill", color: "bg-amber-100 text-amber-700", sample: "Answer key for blanks" },
  short_answer: { label: "Short Answer", short: "Short", color: "bg-violet-100 text-violet-700", sample: "1-3 sentence response" },
  descriptive: { label: "Descriptive / Long Answer", short: "Desc", color: "bg-rose-100 text-rose-700", sample: "Paragraph or essay response" }
};

const DIFFICULTY_META: Record<DifficultyLevel, string> = {
  Easy: "bg-emerald-100 text-emerald-700",
  Medium: "bg-amber-100 text-amber-700",
  Hard: "bg-rose-100 text-rose-700"
};

type QuestionDraft = {
  id?: string;
  type: QuestionType;
  text: string;
  options: string[];
  correctOption: number;
  correctAnswer: string;
  explanation: string;
  marks: number;
  difficulty: DifficultyLevel;
  chapter: string;
  topic: string;
  subjectId: string;
  departmentId: string;
  semesterId: string;
  classId: string;
};

const emptyDraft = (teacher: ReturnType<typeof useAuth>["user"]): QuestionDraft => ({
  type: "mcq",
  text: "",
  options: ["", "", "", ""],
  correctOption: 0,
  correctAnswer: "",
  explanation: "",
  marks: 1,
  difficulty: "Easy",
  chapter: "",
  topic: "",
  subjectId: teacher?.subjectId || "",
  departmentId: teacher?.departmentId || "",
  semesterId: teacher?.semesterId || "",
  classId: teacher?.classroomId || ""
});

const BULK_TEMPLATE = `[
  {
    "type": "mcq",
    "text": "Which planet is known as the Red Planet?",
    "options": ["Venus", "Mars", "Jupiter", "Saturn"],
    "correctOption": 1,
    "explanation": "Mars appears red due to iron oxide on its surface.",
    "marks": 2,
    "difficulty": "Easy",
    "chapter": "Our Solar System",
    "topic": "Planets"
  },
  {
    "type": "true_false",
    "text": "Water boils at 100 degrees Celsius at sea level.",
    "correctAnswer": "True",
    "marks": 1,
    "difficulty": "Easy",
    "chapter": "States of Matter"
  }
]`;

const formatDate = (value: unknown) => {
  if (!value) return "—";
  if (typeof value === "object" && "toDate" in value && typeof value.toDate === "function") {
    try {
      return (value as { toDate: () => Date }).toDate().toLocaleDateString(undefined, { dateStyle: "medium" });
    } catch {
      return "—";
    }
  }
  if (value instanceof Date) return value.toLocaleDateString(undefined, { dateStyle: "medium" });
  if (typeof value === "string" || typeof value === "number") {
    const d = new Date(value as string | number);
    if (!Number.isNaN(d.getTime())) return d.toLocaleDateString(undefined, { dateStyle: "medium" });
  }
  return "—";
};

const QuestionBankPage: React.FC = () => {
  const { user, listDepartments, listSemesters, listAcademicClasses, listSubjects, isLoading: authLoading } = useAuth();
  const [questions, setQuestions] = useState<BankQuestion[]>([]);
  const [departments, setDepartments] = useState<AcademicDepartment[]>([]);
  const [semesters, setSemesters] = useState<AcademicSemester[]>([]);
  const [classes, setClasses] = useState<AcademicClass[]>([]);
  const [subjects, setSubjects] = useState<AcademicSubject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [draft, setDraft] = useState<QuestionDraft>(emptyDraft(null));
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<{
    type: QuestionType | "";
    difficulty: DifficultyLevel | "";
    subjectId: string;
    chapter: string;
    topic: string;
    departmentId: string;
    semesterId: string;
  }>({
    type: "",
    difficulty: "",
    subjectId: "",
    chapter: "",
    topic: "",
    departmentId: "",
    semesterId: ""
  });
  const loaderRefs = useRef({ listDepartments, listSemesters, listAcademicClasses, listSubjects });

  useEffect(() => {
    loaderRefs.current = { listDepartments, listSemesters, listAcademicClasses, listSubjects };
  }, [listAcademicClasses, listDepartments, listSemesters, listSubjects]);

  const loadAll = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const [depts, sems, cls, subs] = await Promise.all([
        loaderRefs.current.listDepartments(),
        loaderRefs.current.listSemesters(),
        loaderRefs.current.listAcademicClasses(),
        loaderRefs.current.listSubjects()
      ]);
      setDepartments(depts);
      setSemesters(sems);
      setClasses(cls);
      setSubjects(subs);

      const qSnap = await getDocs(query(collection(db, "questionBank"), where("institutionId", "==", user.institutionId || user.id)));
      const list = qSnap.docs
        .map((d) => ({ id: d.id, ...(d.data() as Omit<BankQuestion, "id">) }))
        .filter((q) => canAccessAllocationScope(user, q))
        .sort((a, b) => (a.text || "").localeCompare(b.text || ""));
      setQuestions(list);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to load question bank.");
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const subjectsForSelection = useMemo(() => {
    if (!filters.departmentId && !filters.semesterId) return subjects;
    return subjects.filter(
      (s) => (!filters.departmentId || s.departmentId === filters.departmentId) && (!filters.semesterId || s.semesterId === filters.semesterId)
    );
  }, [subjects, filters.departmentId, filters.semesterId]);

  const chapters = useMemo(
    () => Array.from(new Set(questions.map((q) => q.chapter).filter((chapter): chapter is string => Boolean(chapter)))).sort(),
    [questions]
  );
  const topics = useMemo(
    () => Array.from(new Set(questions.map((q) => q.topic).filter((topic): topic is string => Boolean(topic)))).sort(),
    [questions]
  );

  const filtered = useMemo(() => {
    return questions.filter((q) => {
      if (filters.type && q.type !== filters.type) return false;
      if (filters.difficulty && q.difficulty !== filters.difficulty) return false;
      if (filters.subjectId && q.subjectId !== filters.subjectId) return false;
      if (filters.chapter && q.chapter !== filters.chapter) return false;
      if (filters.topic && q.topic !== filters.topic) return false;
      if (search.trim()) {
        const s = search.trim().toLowerCase();
        const hay = `${q.text} ${q.chapter || ""} ${q.topic || ""} ${q.options?.join(" ") || ""} ${q.explanation || ""}`.toLowerCase();
        if (!hay.includes(s)) return false;
      }
      return true;
    });
  }, [questions, filters, search]);

  const totals = useMemo(() => {
    const totalMarks = filtered.reduce((sum, q) => sum + (q.marks || 0), 0);
    const byType: Record<string, number> = {};
    const byDiff: Record<string, number> = {};
    filtered.forEach((q) => {
      byType[q.type] = (byType[q.type] || 0) + 1;
      byDiff[q.difficulty] = (byDiff[q.difficulty] || 0) + 1;
    });
    return { count: filtered.length, totalMarks, byType, byDiff };
  }, [filtered]);

  const openNew = () => {
    setDraft(emptyDraft(user));
    setShowEditor(true);
  };

  const openEdit = (q: BankQuestion) => {
    setDraft({
      id: q.id,
      type: q.type,
      text: q.text,
      options: q.options?.slice(0, 4) ?? ["", "", "", ""],
      correctOption: q.correctOption ?? 0,
      correctAnswer: q.correctAnswer || "",
      explanation: q.explanation || "",
      marks: q.marks || 1,
      difficulty: q.difficulty,
      chapter: q.chapter || "",
      topic: q.topic || "",
      subjectId: q.subjectId || "",
      departmentId: q.departmentId || "",
      semesterId: q.semesterId || "",
      classId: q.classroomId || ""
    });
    setShowEditor(true);
  };

  const saveQuestion = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) return;
    if (!draft.text.trim()) {
      toast.error("Enter the question text.");
      return;
    }
    if (draft.type === "mcq") {
      if (draft.options.some((o) => !o.trim())) {
        toast.error("Fill all 4 MCQ options (A, B, C, D).");
        return;
      }
      if (draft.correctOption < 0 || draft.correctOption > 3) {
        toast.error("Select the correct MCQ option.");
        return;
      }
    }
    if ((draft.type === "true_false" || draft.type === "fill_blank") && !draft.correctAnswer.trim()) {
      toast.error("Enter the correct answer.");
      return;
    }
    if (!draft.departmentId || !draft.semesterId || !draft.classId || !draft.subjectId) {
      toast.error("Select Department, Semester, Class, and Subject.");
      return;
    }
    if (!draft.marks || draft.marks <= 0) {
      toast.error("Assign marks greater than 0.");
      return;
    }

    setIsSaving(true);
    try {
      const dept = departments.find((d) => d.id === draft.departmentId);
      const sem = semesters.find((s) => s.id === draft.semesterId);
      const cls = classes.find((c) => c.id === draft.classId);
      const sub = subjects.find((s) => s.id === draft.subjectId);

      const payload: Omit<BankQuestion, "id"> = {
        type: draft.type,
        text: draft.text.trim(),
        options: draft.type === "mcq" ? draft.options.map((o) => o.trim()) : undefined,
        correctOption: draft.type === "mcq" ? draft.correctOption : undefined,
        correctAnswer: ["true_false", "fill_blank", "short_answer", "descriptive"].includes(draft.type) ? draft.correctAnswer.trim() : undefined,
        explanation: draft.explanation.trim() || undefined,
        marks: Number(draft.marks) || 1,
        difficulty: draft.difficulty,
        chapter: draft.chapter.trim() || undefined,
        topic: draft.topic.trim() || undefined,
        departmentId: draft.departmentId,
        department: dept?.name,
        semesterId: draft.semesterId,
        semester: sem?.name,
        classroomId: draft.classId,
        classroomName: cls?.name,
        classSection: cls?.section,
        subjectId: draft.subjectId,
        subject: sub?.name,
        institutionId: user.institutionId || user.id,
        createdBy: draft.id ? undefined : user.id,
        updatedAt: serverTimestamp() as unknown as Date
      };

      let nextId = draft.id || "";
      if (draft.id) {
        await updateDoc(doc(db, "questionBank", draft.id), {
          ...payload,
          updatedAt: serverTimestamp()
        });
      } else {
        const ref = await addDoc(collection(db, "questionBank"), {
          ...payload,
          createdAt: serverTimestamp()
        });
        nextId = ref.id;
      }

      const saved: BankQuestion = { id: nextId, ...payload };
      setQuestions((current) =>
        current.some((q) => q.id === nextId)
          ? current.map((q) => (q.id === nextId ? saved : q))
          : [saved, ...current].sort((a, b) => a.text.localeCompare(b.text))
      );
      setShowEditor(false);
      setDraft(emptyDraft(user));
      toast.success(draft.id ? "Question updated." : "Question added to bank.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save question.");
    } finally {
      setIsSaving(false);
    }
  };

  const deleteQuestion = async (q: BankQuestion) => {
    if (!window.confirm(`Delete this question?\n\n"${q.text.slice(0, 80)}"`)) return;
    try {
      await deleteDoc(doc(db, "questionBank", q.id));
      setQuestions((current) => current.filter((x) => x.id !== q.id));
      toast.success("Question deleted.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to delete question.");
    }
  };

  const parseBulk = async () => {
    if (!user || !draft.departmentId || !draft.semesterId || !draft.classId || !draft.subjectId) {
      toast.error("Select allocation scope (Department, Semester, Class, Subject) for bulk upload.");
      return;
    }
    let parsed: Partial<BankQuestion>[] = [];
    try {
      parsed = JSON.parse(bulkText) as Partial<BankQuestion>[];
    } catch {
      toast.error("Invalid JSON. Fix the format and try again.");
      return;
    }
    if (!Array.isArray(parsed) || parsed.length === 0) {
      toast.error("Provide a JSON array of at least one question.");
      return;
    }
    setIsSaving(true);
    const dept = departments.find((d) => d.id === draft.departmentId);
    const sem = semesters.find((s) => s.id === draft.semesterId);
    const cls = classes.find((c) => c.id === draft.classId);
    const sub = subjects.find((s) => s.id === draft.subjectId);
    let added = 0;
    const created: BankQuestion[] = [];
    try {
      for (const raw of parsed) {
        const type = (raw.type || "mcq") as QuestionType;
        const text = (raw.text || "").toString().trim();
        if (!text) continue;
        const payload: Omit<BankQuestion, "id"> = {
          type,
          text,
          options: type === "mcq" && Array.isArray(raw.options) ? raw.options.map((o: unknown) => String(o || "")) : undefined,
          correctOption: type === "mcq" && typeof raw.correctOption === "number" ? Math.max(0, Math.min(3, raw.correctOption)) : undefined,
          correctAnswer: ["true_false", "fill_blank", "short_answer", "descriptive"].includes(type) ? (raw.correctAnswer || "").toString().trim() : undefined,
          explanation: (raw.explanation || "").toString().trim() || undefined,
          marks: Number(raw.marks) || 1,
          difficulty: (raw.difficulty as DifficultyLevel) || "Easy",
          chapter: (raw.chapter || "").toString().trim() || undefined,
          topic: (raw.topic || "").toString().trim() || undefined,
          departmentId: draft.departmentId,
          department: dept?.name,
          semesterId: draft.semesterId,
          semester: sem?.name,
          classroomId: draft.classId,
          classroomName: cls?.name,
          classSection: cls?.section,
          subjectId: draft.subjectId,
          subject: sub?.name,
          institutionId: user.institutionId || user.id,
          createdBy: user.id,
          createdAt: serverTimestamp() as unknown as Date,
          updatedAt: serverTimestamp() as unknown as Date
        };
        const ref = await addDoc(collection(db, "questionBank"), payload);
        created.push({ id: ref.id, ...payload });
        added++;
      }
      setQuestions((current) =>
        [...created, ...current].sort((a, b) => a.text.localeCompare(b.text))
      );
      setBulkText("");
      setShowBulk(false);
      toast.success(`Bulk uploaded ${added} question${added === 1 ? "" : "s"}.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Bulk upload failed.");
    } finally {
      setIsSaving(false);
    }
  };

  const draftDepartments = departments;
  const draftSemesters = semesters.filter((s) => s.departmentId === draft.departmentId);
  const draftClasses = classes.filter((c) => c.departmentId === draft.departmentId && c.semesterId === draft.semesterId);
  const draftSubjects = subjects.filter((s) => s.departmentId === draft.departmentId && s.semesterId === draft.semesterId);

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white p-10 text-sm font-semibold text-slate-500 shadow-sm">
        <Loader2 className="animate-spin mr-3" size={18} /> Loading question bank...
      </div>
    );
  }

  return (
    <div className="space-y-7">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-ocean">Teacher Toolkit</p>
          <h1 className="mt-2 text-3xl font-black text-ink dark:text-white">Question Bank</h1>
          <p className="mt-1 max-w-3xl text-slate-600 dark:text-slate-400">
            Build a reusable, searchable question pool. Questions are scoped to your allocated Department, Semester, Class / Section, and Subject, then reused in Assignments, Examinations, and Student Practice sets.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => { setDraft(emptyDraft(user)); setShowBulk(true); }} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800">
            <UploadCloud size={16} /> Bulk Upload
          </button>
          <button onClick={openNew} className="inline-flex items-center gap-2 rounded-xl bg-ocean px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-700">
            <Plus size={16} /> Add Question
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <StatTile icon={ClipboardEdit} label="Total Questions" value={totals.count.toString()} color="bg-blue-100 text-blue-700" />
        <StatTile icon={Sparkles} label="Combined Marks" value={totals.totalMarks.toString()} color="bg-emerald-100 text-emerald-700" />
        <StatTile icon={CheckCircle2} label="MCQs" value={(totals.byType.mcq || 0).toString()} color="bg-violet-100 text-violet-700" />
        <StatTile icon={Tag} label="Difficulty (Easy)" value={(totals.byDiff.Easy || 0).toString()} color="bg-amber-100 text-amber-700" />
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
            <div className="relative lg:col-span-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search text, chapter, topic..." className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-ocean focus:ring-4 focus:ring-ocean/20 dark:border-slate-800 dark:bg-slate-950" />
            </div>
            <select value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value as QuestionType | "" })} className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-ocean dark:border-slate-800 dark:bg-slate-950">
              <option value="">All Types</option>
              {(Object.keys(QUESTION_TYPE_META) as QuestionType[]).map((t) => (
                <option key={t} value={t}>{QUESTION_TYPE_META[t].label}</option>
              ))}
            </select>
            <select value={filters.difficulty} onChange={(e) => setFilters({ ...filters, difficulty: e.target.value as DifficultyLevel | "" })} className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-ocean dark:border-slate-800 dark:bg-slate-950">
              <option value="">All Difficulties</option>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
            <select value={filters.subjectId} onChange={(e) => setFilters({ ...filters, subjectId: e.target.value })} className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-ocean dark:border-slate-800 dark:bg-slate-950">
              <option value="">All Subjects</option>
              {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <select value={filters.chapter} onChange={(e) => setFilters({ ...filters, chapter: e.target.value, topic: "" })} className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-ocean dark:border-slate-800 dark:bg-slate-950">
              <option value="">All Chapters</option>
              {chapters.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Filter size={14} /> {filtered.length} of {questions.length} questions
          </div>
        </div>
        {topics.length ? (
          <div className="mt-4 flex flex-wrap gap-2">
            <Chip onClick={() => setFilters({ ...filters, topic: "" })} active={!filters.topic}>All Topics</Chip>
            {topics.map((t) => <Chip key={t} active={filters.topic === t} onClick={() => setFilters({ ...filters, topic: t })}>{t}</Chip>)}
          </div>
        ) : null}
      </section>

      <section className="space-y-4">
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <ClipboardEdit className="mx-auto text-ocean" size={32} />
            <h2 className="mt-4 text-lg font-black text-ink dark:text-white">No questions match your filters</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">Add your first question, or try Bulk Upload to import a JSON array of MCQ, True/False, Fill-in-blanks, Short Answer, or Descriptive questions.</p>
          </div>
        ) : (
          filtered.map((q) => <QuestionCard key={q.id} q={q} onEdit={() => openEdit(q)} onDelete={() => deleteQuestion(q)} />)
        )}
      </section>

      {showEditor ? (
        <Modal title={draft.id ? "Edit Question" : "Add New Question"} onClose={() => { setShowEditor(false); setDraft(emptyDraft(user)); }}>
          <form onSubmit={saveQuestion} className="space-y-5">
            <div className="grid gap-4 lg:grid-cols-3">
              <Field label="Question Type">
                <select required value={draft.type} onChange={(e) => setDraft({ ...draft, type: e.target.value as QuestionType, options: e.target.value === "mcq" ? draft.options : ["", "", "", ""] })} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-ocean dark:border-slate-800 dark:bg-slate-950">
                  {(Object.keys(QUESTION_TYPE_META) as QuestionType[]).map((t) => (
                    <option key={t} value={t}>{QUESTION_TYPE_META[t].label} · {QUESTION_TYPE_META[t].sample}</option>
                  ))}
                </select>
              </Field>
              <Field label="Difficulty">
                <select required value={draft.difficulty} onChange={(e) => setDraft({ ...draft, difficulty: e.target.value as DifficultyLevel })} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-ocean dark:border-slate-800 dark:bg-slate-950">
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </Field>
              <Field label="Marks">
                <input type="number" min={1} step={1} value={draft.marks} onChange={(e) => setDraft({ ...draft, marks: Number(e.target.value) })} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-ocean dark:border-slate-800 dark:bg-slate-950" />
              </Field>
            </div>

            <Field label="Allocation Scope">
              <div className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-4 dark:border-slate-800 dark:bg-slate-950">
                <select required value={draft.departmentId} onChange={(e) => setDraft({ ...draft, departmentId: e.target.value, semesterId: "", classId: "", subjectId: "" })} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 outline-none focus:border-ocean dark:border-slate-800 dark:bg-slate-900">
                  <option value="">Department</option>
                  {draftDepartments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
                <select required value={draft.semesterId} onChange={(e) => setDraft({ ...draft, semesterId: e.target.value, classId: "", subjectId: "" })} disabled={!draft.departmentId} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 outline-none focus:border-ocean disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900">
                  <option value="">Semester</option>
                  {draftSemesters.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <select required value={draft.classId} onChange={(e) => setDraft({ ...draft, classId: e.target.value })} disabled={!draft.departmentId || !draft.semesterId} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 outline-none focus:border-ocean disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900">
                  <option value="">Class / Section</option>
                  {draftClasses.map((c) => <option key={c.id} value={c.id}>{c.name} · {c.section}</option>)}
                </select>
                <select required value={draft.subjectId} onChange={(e) => setDraft({ ...draft, subjectId: e.target.value })} disabled={!draft.departmentId || !draft.semesterId} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 outline-none focus:border-ocean disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900">
                  <option value="">Subject</option>
                  {draftSubjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            </Field>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Chapter">
                <input list="chapters-list" value={draft.chapter} onChange={(e) => setDraft({ ...draft, chapter: e.target.value })} placeholder="e.g. Light and Reflection" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-ocean dark:border-slate-800 dark:bg-slate-950" />
                <datalist id="chapters-list">{chapters.map((c) => <option key={c} value={c} />)}</datalist>
              </Field>
              <Field label="Topic">
                <input list="topics-list" value={draft.topic} onChange={(e) => setDraft({ ...draft, topic: e.target.value })} placeholder="e.g. Laws of Refraction" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-ocean dark:border-slate-800 dark:bg-slate-950" />
                <datalist id="topics-list">{topics.map((t) => <option key={t} value={t} />)}</datalist>
              </Field>
            </div>

            <Field label="Question Text">
              <textarea required rows={3} value={draft.text} onChange={(e) => setDraft({ ...draft, text: e.target.value })} placeholder="Type the full question text here..." className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-ocean focus:ring-4 focus:ring-ocean/20 dark:border-slate-800 dark:bg-slate-950" />
            </Field>

            {draft.type === "mcq" ? (
              <div className="space-y-3">
                <Field label="4 Options (A, B, C, D) — click the correct answer">
                  <div className="grid gap-2 md:grid-cols-2">
                    {["A", "B", "C", "D"].map((letter, idx) => {
                      const isCorrect = draft.correctOption === idx;
                      return (
                        <div key={letter} className={`relative overflow-hidden rounded-xl border transition ${isCorrect ? "border-ocean ring-4 ring-ocean/20" : "border-slate-200 dark:border-slate-800"}`}>
                          <button type="button" onClick={() => setDraft({ ...draft, correctOption: idx })} className={`absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-full border text-xs font-black transition ${isCorrect ? "border-ocean bg-ocean text-white" : "border-slate-200 text-slate-400 hover:border-slate-300"}`} aria-label={`Mark option ${letter} correct`}>
                            {isCorrect ? <Check size={14} /> : letter}
                          </button>
                          <div className="flex items-center gap-3 pr-14">
                            <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-l-xl font-black text-sm ${isCorrect ? "bg-ocean text-white" : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"}`}>{letter}</span>
                            <input type="text" value={draft.options[idx]} onChange={(e) => { const opts = draft.options.slice(); opts[idx] = e.target.value; setDraft({ ...draft, options: opts }); }} placeholder={`Option ${letter}`} className="w-full bg-transparent py-3 pr-3 outline-none" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Field>
              </div>
            ) : null}

            {draft.type === "true_false" ? (
              <Field label="Correct Answer">
                <div className="grid gap-3 md:grid-cols-2">
                  <button type="button" onClick={() => setDraft({ ...draft, correctAnswer: "True" })} className={`rounded-xl border-2 px-5 py-5 text-lg font-black transition ${draft.correctAnswer === "True" ? "border-ocean bg-ocean text-white shadow-lg shadow-blue-500/20" : "border-slate-200 text-slate-600 hover:border-ocean/60 dark:border-slate-800 dark:text-slate-200"}`}>
                    <CheckCircle2 className="inline mr-2 align-middle" size={18} /> True
                  </button>
                  <button type="button" onClick={() => setDraft({ ...draft, correctAnswer: "False" })} className={`rounded-xl border-2 px-5 py-5 text-lg font-black transition ${draft.correctAnswer === "False" ? "border-rose-500 bg-rose-500 text-white shadow-lg shadow-rose-500/20" : "border-slate-200 text-slate-600 hover:border-rose-400 dark:border-slate-800 dark:text-slate-200"}`}>
                    <X className="inline mr-2 align-middle" size={18} /> False
                  </button>
                </div>
              </Field>
            ) : null}

            {["fill_blank", "short_answer", "descriptive"].includes(draft.type) ? (
              <Field label={draft.type === "fill_blank" ? "Correct Answer (key phrase)" : "Reference Answer"}>
                <textarea rows={draft.type === "descriptive" ? 5 : 2} value={draft.correctAnswer} onChange={(e) => setDraft({ ...draft, correctAnswer: e.target.value })} placeholder={draft.type === "fill_blank" ? "Comma-separate multiple acceptable answers if needed, e.g. photosynthesis, Photosynthesis" : "Reference answer for evaluation and student practice explanations."} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-ocean dark:border-slate-800 dark:bg-slate-950" />
              </Field>
            ) : null}

            <Field label="Explanation (shown to students after practice submit)">
              <textarea rows={2} value={draft.explanation} onChange={(e) => setDraft({ ...draft, explanation: e.target.value })} placeholder="Optional context, formula reference, or why this answer is correct..." className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-ocean dark:border-slate-800 dark:bg-slate-950" />
            </Field>

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => { setShowEditor(false); setDraft(emptyDraft(user)); }} className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">Cancel</button>
              <button type="submit" disabled={isSaving} className="inline-flex items-center gap-2 rounded-xl bg-ocean px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-700 disabled:bg-blue-300">
                {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
                {draft.id ? "Save Changes" : "Add to Bank"}
              </button>
            </div>
          </form>
        </Modal>
      ) : null}

      {showBulk ? (
        <Modal title="Bulk Upload Questions (JSON Array)" onClose={() => { setShowBulk(false); setBulkText(""); }} wide>
          <div className="space-y-5">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm dark:border-slate-800 dark:bg-slate-950">
              <div className="flex items-start gap-3">
                <FileJson className="shrink-0 text-ocean mt-0.5" size={18} />
                <div>
                  <p className="font-black text-ink dark:text-white">Upload many questions at once</p>
                  <p className="mt-1 text-slate-600 dark:text-slate-400 leading-6">Set the allocation scope below (it applies to every question in this import), then paste a JSON array containing <code className="rounded bg-white px-1.5 py-0.5 text-xs font-bold border border-slate-200 dark:bg-slate-900 dark:border-slate-800">type, text</code> and type-specific fields like <code className="rounded bg-white px-1.5 py-0.5 text-xs font-bold border border-slate-200 dark:bg-slate-900 dark:border-slate-800">options, correctOption, correctAnswer, marks, difficulty, chapter, topic, explanation</code>. Marks and difficulty default to <code className="rounded bg-white px-1.5 py-0.5 text-xs font-bold border border-slate-200 dark:bg-slate-900 dark:border-slate-800">1 / Easy</code>. Template below.</p>
                </div>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-4">
              <select required value={draft.departmentId} onChange={(e) => setDraft({ ...draft, departmentId: e.target.value, semesterId: "", classId: "", subjectId: "" })} className="rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-ocean dark:border-slate-800 dark:bg-slate-950">
                <option value="">Department</option>
                {draftDepartments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
              <select required value={draft.semesterId} onChange={(e) => setDraft({ ...draft, semesterId: e.target.value, classId: "", subjectId: "" })} disabled={!draft.departmentId} className="rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-ocean disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950">
                <option value="">Semester</option>
                {draftSemesters.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <select required value={draft.classId} onChange={(e) => setDraft({ ...draft, classId: e.target.value })} disabled={!draft.departmentId || !draft.semesterId} className="rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-ocean disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950">
                <option value="">Class / Section</option>
                {draftClasses.map((c) => <option key={c.id} value={c.id}>{c.name} · {c.section}</option>)}
              </select>
              <select required value={draft.subjectId} onChange={(e) => setDraft({ ...draft, subjectId: e.target.value })} disabled={!draft.departmentId || !draft.semesterId} className="rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-ocean disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950">
                <option value="">Subject</option>
                {draftSubjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
              <div className="flex items-center justify-between px-4 py-2 border-b border-slate-200 text-xs font-black uppercase tracking-[0.16em] text-slate-500 dark:border-slate-800">
                JSON Payload
                <button type="button" onClick={() => setBulkText(BULK_TEMPLATE)} className="text-ocean normal-case tracking-normal text-sm font-bold">Use Sample Template</button>
              </div>
              <textarea rows={14} value={bulkText} onChange={(e) => setBulkText(e.target.value)} placeholder="Paste JSON array of questions here..." className="w-full rounded-b-xl bg-transparent px-4 py-3 font-mono text-xs outline-none" spellCheck={false} />
            </div>

            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => { setShowBulk(false); setBulkText(""); }} className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">Cancel</button>
              <button type="button" onClick={parseBulk} disabled={isSaving} className="inline-flex items-center gap-2 rounded-xl bg-ocean px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-700 disabled:bg-blue-300">
                {isSaving ? <Loader2 className="animate-spin" size={16} /> : <UploadCloud size={16} />}
                Import Questions
              </button>
            </div>
          </div>
        </Modal>
      ) : null}
    </div>
  );
};

const StatTile: React.FC<{ icon: React.ElementType; label: string; value: string; color: string }> = ({ icon: Icon, label, value, color }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
    <div className={`grid h-12 w-12 place-items-center rounded-xl ${color}`}>
      <Icon size={20} />
    </div>
    <p className="mt-4 text-3xl font-black text-ink dark:text-white">{value}</p>
    <p className="text-sm font-semibold text-slate-500">{label}</p>
  </div>
);

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="space-y-2">
    <label className="block text-xs font-black uppercase tracking-[0.14em] text-slate-500">{label}</label>
    {children}
  </div>
);

const Chip: React.FC<{ active?: boolean; onClick?: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
  <button type="button" onClick={onClick} className={`rounded-full px-4 py-1.5 text-xs font-bold transition ${active ? "bg-ocean text-white shadow" : "border border-slate-200 bg-white text-slate-600 hover:border-ocean hover:text-ocean dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"}`}>
    {children}
  </button>
);

const QuestionCard: React.FC<{ q: BankQuestion; onEdit: () => void; onDelete: () => void }> = ({ q, onEdit, onDelete }) => {
  const meta = QUESTION_TYPE_META[q.type];
  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 p-4 dark:border-slate-800">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-black ${meta.color}`}>
            {meta.short} · {meta.label}
          </span>
          <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-black ${DIFFICULTY_META[q.difficulty]}`}>{q.difficulty}</span>
          <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-[11px] font-black text-slate-600 dark:bg-slate-800 dark:text-slate-200">{q.marks} mark{q.marks === 1 ? "" : "s"}</span>
          {q.subject ? <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-[11px] font-black text-ocean dark:bg-blue-950/40">{q.subject}</span> : null}
          {q.chapter ? <span className="inline-flex rounded-full bg-violet-50 px-3 py-1 text-[11px] font-black text-violet-700 dark:bg-violet-950/40 dark:text-violet-200">Ch: {q.chapter}</span> : null}
          {q.topic ? <span className="inline-flex rounded-full bg-amber-50 px-3 py-1 text-[11px] font-black text-amber-700 dark:bg-amber-950/40 dark:text-amber-200">Topic: {q.topic}</span> : null}
        </div>
        <div className="flex items-center gap-1">
          <button onClick={onEdit} className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 text-slate-600 transition hover:border-ocean hover:text-ocean dark:border-slate-800 dark:text-slate-200" aria-label="Edit">
            <Edit3 size={15} />
          </button>
          <button onClick={onDelete} className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 text-slate-500 transition hover:border-rose-400 hover:text-rose-600 dark:border-slate-800" aria-label="Delete">
            <Trash2 size={15} />
          </button>
        </div>
      </div>
      <div className="p-5">
        <p className="whitespace-pre-wrap font-bold text-ink dark:text-white">{q.text}</p>
        {q.type === "mcq" && q.options?.length === 4 ? (
          <ol className="mt-4 space-y-2">
            {q.options.map((opt, idx) => (
              <li key={idx} className={`flex items-start gap-3 rounded-xl px-4 py-2.5 ${q.correctOption === idx ? "bg-emerald-50 ring-1 ring-emerald-200 dark:bg-emerald-950/30 dark:ring-emerald-900" : "bg-slate-50 dark:bg-slate-950"}`}>
                <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-black ${q.correctOption === idx ? "bg-emerald-600 text-white" : "bg-white text-slate-500 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800"}`}>
                  {String.fromCharCode(65 + idx)}
                </span>
                <span className="text-sm text-slate-700 dark:text-slate-200">{opt}</span>
                {q.correctOption === idx ? <span className="ml-auto shrink-0 rounded-full bg-emerald-600 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-white">Correct</span> : null}
              </li>
            ))}
          </ol>
        ) : null}
        {q.type === "true_false" || q.type === "fill_blank" || q.type === "short_answer" || q.type === "descriptive" ? (
          <div className="mt-4 rounded-xl bg-emerald-50 p-4 dark:bg-emerald-950/30">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-300">Reference Answer</p>
            <p className="mt-1 whitespace-pre-wrap text-sm font-bold text-emerald-900 dark:text-emerald-100">{q.correctAnswer || "—"}</p>
          </div>
        ) : null}
        {q.explanation ? (
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Explanation</p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-300">{q.explanation}</p>
          </div>
        ) : null}
        <div className="mt-4 flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
          {[q.department, q.semester, q.classroomName && `${q.classroomName}${q.classSection ? ` · Sec ${q.classSection}` : ""}`].filter(Boolean).map((tag) => (
            <span key={tag as string} className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 ring-1 ring-slate-200 dark:bg-slate-950 dark:ring-slate-800">
              <BookOpen size={11} /> {tag as string}
            </span>
          ))}
          <span className="ml-auto">Added {formatDate(q.createdAt)}</span>
        </div>
      </div>
    </article>
  );
};

const Modal: React.FC<{ title: string; children: React.ReactNode; onClose: () => void; wide?: boolean }> = ({ title, children, onClose, wide }) => (
  <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 backdrop-blur-sm md:items-center p-0 md:p-6" onClick={onClose}>
    <div onClick={(e) => e.stopPropagation()} className={`relative w-full max-h-[92vh] overflow-y-auto rounded-t-3xl bg-white shadow-2xl dark:bg-slate-900 md:rounded-3xl ${wide ? "md:max-w-5xl" : "md:max-w-3xl"}`}>
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/95 px-6 py-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
        <h2 className="text-xl font-black text-ink dark:text-white">{title}</h2>
        <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800" aria-label="Close">
          <X size={16} />
        </button>
      </div>
      <div className="p-6">{children}</div>
    </div>
  </div>
);

export default QuestionBankPage;
