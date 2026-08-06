"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  BarChart3,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Eye,
  EyeOff,
  Filter,
  Loader2,
  Play,
  RefreshCw,
  Send,
  Shuffle,
  Target,
  Timer,
  Trophy,
  XCircle
} from "lucide-react";
import {
  addDoc,
  collection,
  getDocs,
  query,
  serverTimestamp,
  where
} from "firebase/firestore";
import { toast } from "sonner";
import {
  canAccessAllocationScope,
  useAuth
} from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";

type QuestionType = "mcq" | "true_false" | "fill_blank" | "short_answer" | "descriptive";
type DifficultyLevel = "Easy" | "Medium" | "Hard";

type BankQuestion = {
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
};

type PracticeQuestion = BankQuestion & {
  attemptOptions?: string[];
  attemptOptionMapping?: number[];
};

type PracticeConfig = {
  subjectId: string;
  chapter: string;
  topic: string;
  questionType: QuestionType | "";
  difficulty: DifficultyLevel | "";
  questionCount: number;
  totalMarks: number;
  timeLimitMinutes: number;
};

type ScoredQuestion = {
  question: PracticeQuestion;
  userAnswer: string;
  isCorrect: boolean;
  scoredMarks: number;
  maxMarks: number;
};

const QUESTION_TYPE_META: Record<QuestionType, { label: string; short: string; color: string }> = {
  mcq: { label: "Multiple Choice", short: "MCQ", color: "bg-blue-100 text-blue-700" },
  true_false: { label: "True / False", short: "T/F", color: "bg-emerald-100 text-emerald-700" },
  fill_blank: { label: "Fill in the Blanks", short: "Fill", color: "bg-amber-100 text-amber-700" },
  short_answer: { label: "Short Answer", short: "Short", color: "bg-violet-100 text-violet-700" },
  descriptive: { label: "Descriptive", short: "Desc", color: "bg-rose-100 text-rose-700" }
};

const DIFFICULTY_META: Record<DifficultyLevel, string> = {
  Easy: "bg-emerald-100 text-emerald-700",
  Medium: "bg-amber-100 text-amber-700",
  Hard: "bg-rose-100 text-rose-700"
};

type Mode = "builder" | "attempt" | "result";

const shuffle = <T,>(list: T[]): T[] => {
  const arr = list.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

const choosePracticeSet = (pool: BankQuestion[], cfg: PracticeConfig): PracticeQuestion[] => {
  let candidates = pool.slice();
  if (cfg.subjectId) candidates = candidates.filter((q) => q.subjectId === cfg.subjectId);
  if (cfg.chapter) candidates = candidates.filter((q) => q.chapter === cfg.chapter);
  if (cfg.topic) candidates = candidates.filter((q) => q.topic === cfg.topic);
  if (cfg.questionType) candidates = candidates.filter((q) => q.type === cfg.questionType);
  if (cfg.difficulty) candidates = candidates.filter((q) => q.difficulty === cfg.difficulty);

  const wantsMarks = Number(cfg.totalMarks) || 0;
  const wantsCount = Number(cfg.questionCount) || 0;

  const easyPool = shuffle(candidates.filter((q) => q.difficulty === "Easy"));
  const mediumPool = shuffle(candidates.filter((q) => q.difficulty === "Medium"));
  const hardPool = shuffle(candidates.filter((q) => q.difficulty === "Hard"));

  const ordered: BankQuestion[] = [];
  while (easyPool.length || mediumPool.length || hardPool.length) {
    const pick = (p: BankQuestion[]) => p.shift() as BankQuestion | undefined;
    const e = pick(easyPool), m = pick(mediumPool), h = pick(hardPool);
    if (e) ordered.push(e);
    if (m) ordered.push(m);
    if (h) ordered.push(h);
  }

  const selected: BankQuestion[] = [];
  let marksSoFar = 0;

  const applyCountCap = () => {
    if (wantsCount > 0) {
      const limited = ordered.slice(0, wantsCount);
      if (wantsMarks > 0) {
        const sum = limited.reduce((s, q) => s + (q.marks || 0), 0);
        if (sum > wantsMarks) {
          const greedy: BankQuestion[] = [];
          let gsum = 0;
          for (const q of limited) {
            if (gsum + (q.marks || 0) <= wantsMarks) {
              greedy.push(q);
              gsum += q.marks || 0;
            }
          }
          return greedy;
        }
      }
      return limited;
    }
    return ordered;
  };

  const applyMarksCap = (list: BankQuestion[]) => {
    if (wantsMarks <= 0) return list;
    const out: BankQuestion[] = [];
    for (const q of list) {
      if (marksSoFar + (q.marks || 0) <= wantsMarks) {
        out.push(q);
        marksSoFar += q.marks || 0;
      }
    }
    return out;
  };

  if (wantsCount > 0) {
    selected.push(...applyMarksCap(applyCountCap()));
  } else if (wantsMarks > 0) {
    selected.push(...applyMarksCap(ordered));
  } else {
    selected.push(...ordered.slice(0, 25));
  }

  const finalShuffle = shuffle(selected);
  return finalShuffle.map((q) => {
    if (q.type === "mcq" && Array.isArray(q.options) && q.options.length === 4) {
      const mapping = [0, 1, 2, 3];
      const shuffledOrder = shuffle(mapping);
      const shuffledOptions = shuffledOrder.map((originalIdx) => q.options?.[originalIdx] || "");
      const newCorrect = shuffledOrder.findIndex((idx) => idx === q.correctOption);
      return {
        ...q,
        attemptOptions: shuffledOptions,
        attemptOptionMapping: shuffledOrder,
        correctOption: newCorrect === -1 ? q.correctOption : newCorrect
      } as PracticeQuestion;
    }
    return q as PracticeQuestion;
  });
};

const gradeTextAnswer = (answer: string, reference: string, qType: QuestionType): { correct: boolean; score: number } => {
  const clean = (v: string) => v.toLowerCase().replace(/\s+/g, " ").trim();
  const a = clean(answer || "");
  const r = clean(reference || "");
  if (!a || !r) return { correct: false, score: 0 };
  if (a === r) return { correct: true, score: 1 };
  if (qType === "fill_blank") {
    const options = r.split(",").map((s) => s.trim()).filter(Boolean);
    if (options.some((opt) => a === clean(opt))) return { correct: true, score: 1 };
    if (options.some((opt) => a.includes(clean(opt)) || clean(opt).includes(a))) return { correct: true, score: 1 };
  }
  if (qType === "true_false") {
    const truthy = ["true", "t", "1", "yes", "correct"];
    const falsy = ["false", "f", "0", "no", "incorrect", "wrong"];
    const aBool = truthy.includes(a);
    const rBool = truthy.includes(r);
    if (truthy.includes(a) && rBool) return { correct: true, score: 1 };
    if (falsy.includes(a) && falsy.some((x) => r === x || r === clean(x))) return { correct: true, score: 1 };
    if (aBool === rBool && (truthy.includes(a) || falsy.includes(a))) return { correct: true, score: 1 };
  }
  const aWords = a.split(" ").filter(Boolean);
  const rWords = r.split(" ").filter(Boolean);
  if (aWords.length === 0 || rWords.length === 0) return { correct: false, score: 0 };
  const matches = aWords.reduce((acc, w) => (rWords.some((rw) => rw.includes(w) || w.includes(rw)) ? acc + 1 : acc), 0);
  const ratio = matches / rWords.length;
  if (qType === "short_answer") return ratio >= 0.6 ? { correct: true, score: Math.max(0.5, ratio) } : { correct: false, score: 0 };
  return { correct: false, score: 0 };
};

const PracticeCenterPage: React.FC = () => {
  const { user, isLoading: authLoading } = useAuth();
  const [allQuestions, setAllQuestions] = useState<BankQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mode, setMode] = useState<Mode>("builder");
  const [config, setConfig] = useState<PracticeConfig>({
    subjectId: "",
    chapter: "",
    topic: "",
    questionType: "",
    difficulty: "",
    questionCount: 10,
    totalMarks: 20,
    timeLimitMinutes: 0
  });
  const [showMarks, setShowMarks] = useState(true);
  const [activeSet, setActiveSet] = useState<PracticeQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [remaining, setRemaining] = useState(0);
  const [scored, setScored] = useState<ScoredQuestion[]>([]);
  const [seed, setSeed] = useState(() => Date.now());
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const answersRef = useRef(answers);

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  const loadBank = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const snap = await getDocs(query(collection(db, "questionBank"), where("institutionId", "==", user.institutionId || user.id)));
      const list = snap.docs
        .map((d) => ({ id: d.id, ...(d.data() as Omit<BankQuestion, "id">) }))
        .filter((q) => canAccessAllocationScope(user, q));
      setAllQuestions(list);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to load question bank.");
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void loadBank();
  }, [loadBank]);

  const availableSubjects = useMemo(() => {
    const seen = new Map<string, { id: string; name: string | undefined }>();

    allQuestions.forEach((q) => {
      if (!q.subjectId) return;
      if (!seen.has(q.subjectId)) {
        seen.set(q.subjectId, { id: q.subjectId, name: q.subject });
      }
    });

    return Array.from(seen.values());
  }, [allQuestions]);
  const chaptersForSubject = useMemo(
    () =>
      Array.from(
        new Set(
          allQuestions
            .filter((q) => !config.subjectId || q.subjectId === config.subjectId)
            .map((q) => q.chapter)
            .filter((chapter): chapter is string => Boolean(chapter))
        )
      ).sort(),
    [allQuestions, config.subjectId]
  );
  const topicsForSelection = useMemo(() => {
    const filtered = allQuestions.filter((q) => {
      if (config.subjectId && q.subjectId !== config.subjectId) return false;
      if (config.chapter && q.chapter !== config.chapter) return false;
      return true;
    });
    return Array.from(
      new Set(filtered.map((q) => q.topic).filter((topic): topic is string => Boolean(topic)))
    ).sort();
  }, [allQuestions, config.subjectId, config.chapter]);

  const countsBySubject = useMemo(() => {
    const map = new Map<string, { qs: number; marks: number }>();
    allQuestions.forEach((q) => {
      if (!q.subjectId) return;
      const cur = map.get(q.subjectId) || { qs: 0, marks: 0 };
      map.set(q.subjectId, { qs: cur.qs + 1, marks: cur.marks + (q.marks || 0) });
    });
    return map;
  }, [allQuestions]);

  const previewPool = useMemo(() => {
    return allQuestions.filter((q) => {
      if (config.subjectId && q.subjectId !== config.subjectId) return false;
      if (config.chapter && q.chapter !== config.chapter) return false;
      if (config.topic && q.topic !== config.topic) return false;
      if (config.questionType && q.type !== config.questionType) return false;
      if (config.difficulty && q.difficulty !== config.difficulty) return false;
      return true;
    });
  }, [allQuestions, config]);

  const startPractice = () => {
    if (previewPool.length === 0) {
      toast.error("No questions match these filters.");
      return;
    }
    const set = choosePracticeSet(previewPool, config);
    if (set.length === 0) {
      toast.error("Try relaxing the total marks or question count — no questions fit your filters.");
      return;
    }
    setActiveSet(set);
    setAnswers({});
    setCurrentIdx(0);
    setScored([]);
    setMode("attempt");
    setRemaining(Math.max(0, config.timeLimitMinutes || 0) * 60);
    toast.success(`Generated practice set with ${set.length} question${set.length === 1 ? "" : "s"}.`);
  };

  const scoreAndFinish = (auto = false) => {
    const latest = answersRef.current;
    const result: ScoredQuestion[] = activeSet.map((q) => {
      const answer = latest[q.id] || "";
      const max = q.marks || 1;
      if (q.type === "mcq") {
        const picked = Number.isFinite(Number(answer)) && answer !== "" ? Number(answer) : -1;
        const correct = picked === q.correctOption;
        return { question: q, userAnswer: answer, isCorrect: correct, scoredMarks: correct ? max : 0, maxMarks: max };
      }
      if (q.type === "true_false") {
        const { correct, score } = gradeTextAnswer(answer, q.correctAnswer || "", q.type);
        return { question: q, userAnswer: answer, isCorrect: correct, scoredMarks: Math.round(max * score), maxMarks: max };
      }
      if (q.type === "fill_blank") {
        const { correct, score } = gradeTextAnswer(answer, q.correctAnswer || "", q.type);
        return { question: q, userAnswer: answer, isCorrect: correct, scoredMarks: Math.round(max * score), maxMarks: max };
      }
      if (q.type === "short_answer") {
        const { correct, score } = gradeTextAnswer(answer, q.correctAnswer || "", q.type);
        return { question: q, userAnswer: answer, isCorrect: correct, scoredMarks: Math.round(max * score), maxMarks: max };
      }
      const { correct, score } = gradeTextAnswer(answer, q.correctAnswer || "", q.type);
      return { question: q, userAnswer: answer, isCorrect: correct, scoredMarks: Math.round(max * Math.min(0.5, score)), maxMarks: max };
    });
    setScored(result);
    setMode("result");
    toast.success(auto ? "Time over — answers scored." : "Answers scored. Check your result!");
    void logAttempt(result);
  };

  const logAttempt = async (result: ScoredQuestion[]) => {
    if (!user) return;
    try {
      const earned = result.reduce((s, r) => s + r.scoredMarks, 0);
      const max = result.reduce((s, r) => s + r.maxMarks, 0);
      const correctCount = result.filter((r) => r.isCorrect).length;
      await addDoc(collection(db, "practiceAttempts"), {
        studentId: user.id,
        subjectId: config.subjectId,
        subject: availableSubjects.find((s) => s.id === config.subjectId)?.name,
        chapter: config.chapter || undefined,
        topic: config.topic || undefined,
        totalQuestions: result.length,
        correctCount,
        earnedMarks: earned,
        totalMarks: max,
        percentage: max > 0 ? Math.round((earned / max) * 100) : 0,
        durationSeconds: Math.max(0, (config.timeLimitMinutes || 0) * 60 - remaining),
        createdAt: serverTimestamp(),
        institutionId: user.institutionId || user.id
      });
    } catch {
    }
  };

  useEffect(() => {
    if (mode !== "attempt") return;
    if (config.timeLimitMinutes <= 0) return;
    if (remaining <= 0) {
      scoreAndFinish(true);
      return;
    }
    timerRef.current = setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, remaining, activeSet.length]);

  const retry = () => {
    const nextSeed = Date.now();
    setSeed(nextSeed);
    const preview = previewPool.length ? previewPool : allQuestions;
    const next = choosePracticeSet(preview, config);
    if (next.length === 0) {
      toast.error("No more questions available.");
      return;
    }
    setActiveSet(next);
    setAnswers({});
    setCurrentIdx(0);
    setScored([]);
    setRemaining(Math.max(0, config.timeLimitMinutes || 0) * 60);
    setMode("attempt");
    toast.success("New randomized practice set generated.");
  };

  const backToBuilder = () => {
    setMode("builder");
    setActiveSet([]);
    setScored([]);
    setAnswers({});
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white p-10 text-sm font-semibold text-slate-500 shadow-sm">
        <Loader2 className="mr-3 animate-spin" size={18} /> Loading practice center...
      </div>
    );
  }

  return (
    <div className="space-y-7" key={seed}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-ocean">Student Practice</p>
          <h1 className="mt-2 text-3xl font-black text-ink dark:text-white">Question Bank & Practice Center</h1>
          <p className="mt-1 max-w-3xl text-slate-600 dark:text-slate-400">
            Build custom practice sets from your teacher&apos;s Question Bank, limited to your allocated Department, Semester, Class / Section, and Subjects. Questions are randomized on every attempt so you never get the same paper twice.
          </p>
        </div>
        {mode !== "builder" ? (
          <button onClick={backToBuilder} className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
            <ArrowLeft size={16} /> Back to Builder
          </button>
        ) : null}
      </div>

      {mode === "builder" ? <BuilderView config={config} setConfig={setConfig} subjects={availableSubjects} countsBySubject={countsBySubject} chapters={chaptersForSubject} topics={topicsForSelection} pool={previewPool} start={startPractice} showMarks={showMarks} setShowMarks={setShowMarks} totalBankSize={allQuestions.length} /> : null}

      {mode === "attempt" && activeSet.length ? (
        <AttemptView
          questions={activeSet}
          currentIdx={currentIdx}
          setCurrentIdx={setCurrentIdx}
          answers={answers}
          setAnswers={setAnswers}
          finish={() => scoreAndFinish(false)}
          remainingSeconds={remaining}
          showMarks={showMarks}
          config={config}
        />
      ) : null}

      {mode === "result" && scored.length ? (
        <ResultView scored={scored} onRetry={retry} onBack={backToBuilder} />
      ) : null}
    </div>
  );
};

const BuilderView: React.FC<{
  config: PracticeConfig;
  setConfig: React.Dispatch<React.SetStateAction<PracticeConfig>>;
  subjects: { id: string; name: string | undefined }[];
  countsBySubject: Map<string, { qs: number; marks: number }>;
  chapters: string[];
  topics: string[];
  pool: BankQuestion[];
  start: () => void;
  showMarks: boolean;
  setShowMarks: (b: boolean) => void;
  totalBankSize: number;
}> = ({ config, setConfig, subjects, countsBySubject, chapters, topics, pool, start, showMarks, setShowMarks, totalBankSize }) => {
  const totalMarksInPool = pool.reduce((s, q) => s + (q.marks || 0), 0);
  const recommendedQuestions = pool.length ? Math.min(20, Math.max(5, Math.round(pool.length / 2))) : 10;
  const recommendedMarks = totalMarksInPool ? Math.min(50, Math.max(10, Math.round(totalMarksInPool / 2))) : 20;

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_0.7fr]">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black text-ink dark:text-white">Build Your Practice Set</h2>
          <div className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-black tracking-[0.14em] uppercase text-slate-500 dark:bg-slate-800 dark:text-slate-300">
            <Filter size={11} /> Filters
          </div>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <Field label="Subject">
            <select value={config.subjectId} onChange={(e) => setConfig({ ...config, subjectId: e.target.value, chapter: "", topic: "" })} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-ocean focus:ring-4 focus:ring-ocean/20 dark:border-slate-800 dark:bg-slate-950">
              <option value="">All Available Subjects</option>
              {subjects.map((s) => <option key={s.id} value={s.id}>{s.name || s.id}</option>)}
            </select>
          </Field>
          <Field label="Chapter">
            <select value={config.chapter} onChange={(e) => setConfig({ ...config, chapter: e.target.value, topic: "" })} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-ocean dark:border-slate-800 dark:bg-slate-950">
              <option value="">Any Chapter</option>
              {chapters.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Topic">
            <select value={config.topic} onChange={(e) => setConfig({ ...config, topic: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-ocean dark:border-slate-800 dark:bg-slate-950">
              <option value="">Any Topic</option>
              {topics.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Question Type">
            <select value={config.questionType} onChange={(e) => setConfig({ ...config, questionType: e.target.value as QuestionType | "" })} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-ocean dark:border-slate-800 dark:bg-slate-950">
              <option value="">All Types</option>
              {(Object.keys(QUESTION_TYPE_META) as QuestionType[]).map((t) => <option key={t} value={t}>{QUESTION_TYPE_META[t].label}</option>)}
            </select>
          </Field>
          <Field label="Difficulty Level">
            <select value={config.difficulty} onChange={(e) => setConfig({ ...config, difficulty: e.target.value as DifficultyLevel | "" })} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-ocean dark:border-slate-800 dark:bg-slate-950">
              <option value="">Mix of Easy · Medium · Hard</option>
              <option value="Easy">Easy only</option>
              <option value="Medium">Medium only</option>
              <option value="Hard">Hard only</option>
            </select>
          </Field>
          <Field label={`Time Limit (optional) · ${config.timeLimitMinutes ? `${config.timeLimitMinutes} min` : "No timer"}`}>
            <div className="flex items-center gap-2">
              <input type="range" min={0} max={180} step={5} value={config.timeLimitMinutes} onChange={(e) => setConfig({ ...config, timeLimitMinutes: Number(e.target.value) })} className="w-full accent-ocean" />
              <input type="number" min={0} step={1} value={config.timeLimitMinutes} onChange={(e) => setConfig({ ...config, timeLimitMinutes: Number(e.target.value) })} className="w-24 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-ocean dark:border-slate-800 dark:bg-slate-950" />
            </div>
          </Field>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <Field label={`Number of Questions · ${config.questionCount || "Auto"}`}>
            <div className="flex items-center gap-2">
              <input type="range" min={0} max={Math.max(5, pool.length)} step={1} value={config.questionCount} onChange={(e) => setConfig({ ...config, questionCount: Number(e.target.value) })} className="w-full accent-ocean" disabled={pool.length === 0} />
              <input type="number" min={0} step={1} value={config.questionCount} onChange={(e) => setConfig({ ...config, questionCount: Number(e.target.value) })} className="w-24 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-ocean dark:border-slate-800 dark:bg-slate-950" />
            </div>
            <p className="mt-2 text-[11px] text-slate-500">Set to 0 to pick as many as fit the Total Marks budget.</p>
          </Field>
          <Field label={`Total Marks Target · ${config.totalMarks || "No cap"}`}>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setShowMarks(!showMarks)} className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-slate-200 text-slate-500 hover:border-ocean hover:text-ocean dark:border-slate-800" aria-label="Toggle marks visibility">
                {showMarks ? <Eye size={16} /> : <EyeOff size={16} />}
              </button>
              <input type="number" min={0} step={1} value={showMarks ? config.totalMarks : "•".repeat(3)} onChange={(e) => setConfig({ ...config, totalMarks: Number(e.target.value) })} disabled={!showMarks} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 outline-none focus:border-ocean disabled:opacity-60 dark:border-slate-800 dark:bg-slate-950" />
            </div>
            <p className="mt-2 text-[11px] text-slate-500">Set to 0 to ignore the marks budget and only use Number of Questions.</p>
          </Field>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setConfig({ ...config, questionCount: recommendedQuestions, totalMarks: recommendedMarks, difficulty: "", questionType: "", timeLimitMinutes: 15 })} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 hover:border-ocean hover:text-ocean dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
              <Shuffle className="mr-1 inline" size={12} /> Quick Start
            </button>
            <button onClick={() => setConfig({ ...config, difficulty: "Easy", questionType: "mcq", questionCount: 10, totalMarks: 10, timeLimitMinutes: 10 })} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 hover:border-emerald-400 hover:text-emerald-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
              Easy MCQ Sprint
            </button>
            <button onClick={() => setConfig({ ...config, difficulty: "Hard", questionType: "", questionCount: 15, totalMarks: 40, timeLimitMinutes: 30 })} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 hover:border-rose-400 hover:text-rose-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
              Hard Mock Test
            </button>
          </div>
          <button onClick={start} disabled={pool.length === 0} className="inline-flex items-center gap-2 rounded-xl bg-ocean px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-700 disabled:bg-blue-300">
            <Play size={16} /> Start Practice Test
          </button>
        </div>
      </div>

      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-2">
          <Stat icon={Target} label="Matched Questions" value={pool.length.toString()} hint={`of ${totalBankSize} total`} color="bg-blue-100 text-blue-700" />
          <Stat icon={Trophy} label="Matched Marks Pool" value={totalMarksInPool.toString()} hint="across matches" color="bg-emerald-100 text-emerald-700" />
          <Stat icon={BookOpen} label="Subjects in Pool" value={subjects.length.toString()} hint="allocated to you" color="bg-violet-100 text-violet-700" />
          <Stat icon={CalendarClock} label="Chapters Covered" value={chapters.length.toString()} hint="across subjects" color="bg-amber-100 text-amber-700" />
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black uppercase tracking-[0.16em] text-ocean">Subject Coverage</h3>
            <BookOpen className="text-ocean" size={16} />
          </div>
          <div className="mt-4 space-y-3">
            {subjects.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400">No questions uploaded for your classes yet. Check back after your teacher populates the Question Bank.</p>
            ) : (
              subjects.map((s) => {
                const counts = countsBySubject.get(s.id) || { qs: 0, marks: 0 };
                return (
                  <div key={s.id} className={`rounded-xl border border-slate-200 p-4 transition ${s.id === config.subjectId ? "border-ocean bg-ocean/5 shadow" : "bg-white dark:border-slate-800 dark:bg-slate-950"}`}>
                    <div className="flex items-center justify-between">
                      <p className="font-black text-ink dark:text-white">{s.name || s.id}</p>
                      <span className="rounded-full bg-blue-100 px-3 py-1 text-[11px] font-black text-blue-700">{counts.qs} Qs · {counts.marks} Ms</span>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div className="h-full rounded-full bg-gradient-to-r from-ocean to-emerald-400" style={{ width: `${totalBankSize ? Math.min(100, Math.round((counts.qs / totalBankSize) * 100)) : 0}%` }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {pool.length ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-sm font-black uppercase tracking-[0.16em] text-ocean">Matched Sample</h3>
            <div className="mt-4 space-y-3">
              {pool.slice(0, 4).map((q) => (
                <div key={q.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950">
                  <div className="flex flex-wrap gap-1.5">
                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-black ${QUESTION_TYPE_META[q.type].color}`}>{QUESTION_TYPE_META[q.type].short}</span>
                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-black ${DIFFICULTY_META[q.difficulty]}`}>{q.difficulty}</span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-black text-slate-600 dark:bg-slate-800 dark:text-slate-200">{q.marks}M</span>
                    {q.subject ? <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-black text-ocean dark:bg-blue-950/30">{q.subject}</span> : null}
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm font-bold text-ink dark:text-white">{q.text}</p>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

const AttemptView: React.FC<{
  questions: PracticeQuestion[];
  currentIdx: number;
  setCurrentIdx: (n: number) => void;
  answers: Record<string, string>;
  setAnswers: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  finish: () => void;
  remainingSeconds: number;
  showMarks: boolean;
  config: PracticeConfig;
}> = ({ questions, currentIdx, setCurrentIdx, answers, setAnswers, finish, remainingSeconds, showMarks, config }) => {
  const q = questions[currentIdx];
  const answeredCount = questions.filter((x) => (answers[x.id] || "").toString().trim()).length;
  const totalMax = questions.reduce((s, x) => s + (x.marks || 0), 0);
  const showTimer = config.timeLimitMinutes > 0;

  const mmss = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  const timerColor = !showTimer ? "text-slate-600" : remainingSeconds < 60 ? "text-rose-600" : remainingSeconds < 300 ? "text-amber-600" : "text-ocean";

  const setAnswer = (value: string) => {
    setAnswers((prev) => ({ ...prev, [q.id]: value }));
  };

  const currentAnswer = answers[q.id] || "";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-col gap-4 border-b border-slate-200 p-5 md:flex-row md:items-center md:justify-between dark:border-slate-800">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-ocean">Practice Mode</p>
          <h2 className="mt-1 text-lg font-black text-ink dark:text-white">Question {currentIdx + 1} of {questions.length}</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs font-black">
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-2 text-blue-700">
            <CheckCircle2 size={13} /> Answered {answeredCount}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-2 text-slate-600 dark:bg-slate-800 dark:text-slate-200">
            <BarChart3 size={13} /> {showMarks ? `Max ${totalMax} marks` : "Marks hidden"}
          </span>
          <span className={`inline-flex items-center gap-1 rounded-full px-3 py-2 ${showTimer ? "bg-white ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700" : "bg-slate-50 dark:bg-slate-800"} ${timerColor}`}>
            {showTimer ? <Timer size={13} /> : <Clock3 size={13} />}
            {showTimer ? mmss(remainingSeconds) : "No Timer"}
          </span>
          <button onClick={() => window.confirm("Finish this practice now and see your score?") && finish()} className="inline-flex items-center gap-1 rounded-xl bg-ocean px-4 py-2 text-white shadow hover:bg-blue-700">
            <Send size={13} /> Submit
          </button>
        </div>
      </div>

      <div className="grid gap-6 p-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <QuestionHeaderChip q={q} showMarks={showMarks} />
          <p className="whitespace-pre-wrap text-lg font-bold leading-8 text-ink dark:text-white">{q.text}</p>

          {q.type === "mcq" && q.attemptOptions ? (
            <div className="space-y-3">
              {q.attemptOptions.map((opt, idx) => {
                const letter = String.fromCharCode(65 + idx);
                const picked = currentAnswer === String(idx);
                return (
                  <button
                    type="button"
                    key={idx}
                    onClick={() => setAnswer(String(idx))}
                    className={`flex w-full items-start gap-4 rounded-2xl border-2 px-5 py-4 text-left transition ${picked ? "border-ocean bg-ocean/5 shadow" : "border-slate-200 hover:border-ocean/60 dark:border-slate-800 dark:hover:border-ocean/50"}`}
                  >
                    <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full text-sm font-black ${picked ? "bg-ocean text-white" : "bg-slate-100 text-slate-500 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700"}`}>{letter}</span>
                    <span className="pt-1.5 text-sm font-semibold text-slate-700 dark:text-slate-200">{opt}</span>
                    {picked ? <CheckCircle2 className="ml-auto text-ocean mt-1" size={18} /> : null}
                  </button>
                );
              })}
            </div>
          ) : null}

          {q.type === "true_false" ? (
            <div className="grid gap-3 md:grid-cols-2">
              {["True", "False"].map((val) => (
                <button key={val} type="button" onClick={() => setAnswer(val)} className={`rounded-2xl border-2 px-6 py-7 text-xl font-black transition ${currentAnswer === val ? val === "True" ? "border-emerald-500 bg-emerald-50 text-emerald-700 shadow dark:bg-emerald-950/30" : "border-rose-500 bg-rose-50 text-rose-700 shadow dark:bg-rose-950/30" : "border-slate-200 text-slate-600 hover:border-ocean/60 dark:border-slate-800 dark:text-slate-200"}`}>
                  {val === "True" ? <CheckCircle2 className="inline mr-2 align-middle" size={18} /> : <XCircle className="inline mr-2 align-middle" size={18} />} {val}
                </button>
              ))}
            </div>
          ) : null}

          {q.type === "fill_blank" || q.type === "short_answer" || q.type === "descriptive" ? (
            <div className="space-y-2">
              <label className="block text-xs font-black uppercase tracking-[0.16em] text-slate-500">Your Answer</label>
              {q.type === "fill_blank" ? (
                <input value={currentAnswer} onChange={(e) => setAnswer(e.target.value)} placeholder="Type the answer or short phrase here..." className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 outline-none focus:border-ocean focus:ring-4 focus:ring-ocean/20 dark:border-slate-800 dark:bg-slate-950" />
              ) : (
                <textarea rows={q.type === "descriptive" ? 9 : 4} value={currentAnswer} onChange={(e) => setAnswer(e.target.value)} placeholder={q.type === "descriptive" ? "Write a detailed paragraph-style answer..." : "Write 2-4 sentences..."} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 outline-none focus:border-ocean focus:ring-4 focus:ring-ocean/20 dark:border-slate-800 dark:bg-slate-950" />
              )}
              <p className="text-[11px] text-slate-500">This answer will be scored against the reference key after you submit.</p>
            </div>
          ) : null}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Navigator</h3>
              <span className="text-[11px] font-black text-slate-500">{answeredCount}/{questions.length} · {questions.length - answeredCount} left</span>
            </div>
            <div className="mt-3 grid grid-cols-8 gap-2">
              {questions.map((x, idx) => {
                const answered = (answers[x.id] || "").toString().trim();
                const active = idx === currentIdx;
                return (
                  <button
                    key={x.id}
                    onClick={() => setCurrentIdx(idx)}
                    className={`grid h-9 w-full place-items-center rounded-lg text-xs font-black transition ${active ? "bg-ocean text-white shadow" : answered ? "bg-emerald-500 text-white" : "bg-white ring-1 ring-slate-200 text-slate-500 hover:ring-ocean dark:bg-slate-900 dark:ring-slate-800 dark:text-slate-300"}`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
            <div className="mt-4 flex gap-2">
              <button disabled={currentIdx === 0} onClick={() => setCurrentIdx(Math.max(0, currentIdx - 1))} className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-black text-slate-600 transition disabled:opacity-40 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800">Previous</button>
              <button disabled={currentIdx === questions.length - 1} onClick={() => setCurrentIdx(Math.min(questions.length - 1, currentIdx + 1))} className="flex-1 rounded-xl bg-ocean px-3 py-2.5 text-xs font-black text-white transition disabled:opacity-40 hover:bg-blue-700">Next</button>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-2 text-slate-500">
              <AlertCircle size={14} />
              <p className="text-[11px] font-black uppercase tracking-[0.16em]">Tips</p>
            </div>
            <ul className="mt-3 space-y-2 text-[13px] leading-6 text-slate-600 dark:text-slate-300">
              <li>• MCQ option order is shuffled every attempt.</li>
              <li>• Practice sets are generated with a brand new shuffle.</li>
              <li>• Click Submit above whenever you are ready to score.</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
};

const QuestionHeaderChip: React.FC<{ q: PracticeQuestion; showMarks: boolean }> = ({ q, showMarks }) => {
  const meta = QUESTION_TYPE_META[q.type];
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-black ${meta.color}`}>{meta.short} · {meta.label}</span>
      <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-black ${DIFFICULTY_META[q.difficulty]}`}>{q.difficulty}</span>
      <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-[11px] font-black text-slate-600 dark:bg-slate-800 dark:text-slate-200">{showMarks ? `${q.marks} mark${q.marks === 1 ? "" : "s"}` : "— marks"}</span>
      {q.subject ? <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-[11px] font-black text-ocean dark:bg-blue-950/30">{q.subject}</span> : null}
      {q.chapter ? <span className="inline-flex rounded-full bg-violet-50 px-3 py-1 text-[11px] font-black text-violet-700 dark:bg-violet-950/30 dark:text-violet-200">Chapter: {q.chapter}</span> : null}
      {q.topic ? <span className="inline-flex rounded-full bg-amber-50 px-3 py-1 text-[11px] font-black text-amber-700 dark:bg-amber-950/30 dark:text-amber-200">Topic: {q.topic}</span> : null}
    </div>
  );
};

const ResultView: React.FC<{ scored: ScoredQuestion[]; onRetry: () => void; onBack: () => void }> = ({ scored, onRetry, onBack }) => {
  const earned = scored.reduce((s, r) => s + r.scoredMarks, 0);
  const max = scored.reduce((s, r) => s + r.maxMarks, 0);
  const correct = scored.filter((r) => r.isCorrect).length;
  const incorrect = scored.length - correct;
  const percentage = max > 0 ? Math.round((earned / max) * 100) : 0;
  const verdict = percentage >= 80 ? { label: "Excellent work", color: "text-emerald-600", emoji: "🏆" } : percentage >= 60 ? { label: "Good progress", color: "text-ocean", emoji: "🚀" } : percentage >= 40 ? { label: "Keep practicing", color: "text-amber-600", emoji: "📘" } : { label: "Review and retry", color: "text-rose-600", emoji: "🎯" };

  return (
    <div className="space-y-6">
      <section className="grid gap-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-[1fr_auto] dark:border-slate-800 dark:bg-slate-900 md:items-center">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-ocean">Practice Result</p>
          <h2 className={`mt-2 text-2xl font-black text-ink dark:text-white`}>{verdict.emoji} {verdict.label} — you scored <span className={verdict.color}>{earned}/{max}</span></h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Practice another randomized set with the same filters to improve accuracy.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={onBack} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
            <ArrowLeft size={16} /> Back to Builder
          </button>
          <button onClick={onRetry} className="inline-flex items-center gap-2 rounded-xl bg-ocean px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-700">
            <RefreshCw size={16} /> Generate New Random Set
          </button>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-4">
        <Stat icon={Trophy} label="Score (%)" value={`${percentage}%`} hint={`${earned} of ${max} marks`} color={`${percentage >= 60 ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`} />
        <Stat icon={CheckCircle2} label="Correct" value={correct.toString()} hint="question(s)" color="bg-emerald-100 text-emerald-700" />
        <Stat icon={XCircle} label="Incorrect" value={incorrect.toString()} hint="question(s)" color="bg-rose-100 text-rose-700" />
        <Stat icon={Shuffle} label="Attempt Size" value={scored.length.toString()} hint="questions" color="bg-blue-100 text-blue-700" />
      </div>

      <div className="space-y-4">
        {scored.map((r, idx) => (
          <article key={r.question.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className={`flex flex-wrap items-center justify-between gap-3 border-b p-4 dark:border-slate-800 ${r.isCorrect ? "bg-emerald-50/70 border-emerald-100 dark:bg-emerald-950/30 dark:border-emerald-900" : "bg-rose-50/60 border-rose-100 dark:bg-rose-950/30 dark:border-rose-900"}`}>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-black ${r.isCorrect ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"}`}>
                  {r.isCorrect ? <CheckCircle2 size={12} /> : <XCircle size={12} />} {r.isCorrect ? "CORRECT" : "INCORRECT"} · Q{idx + 1}
                </span>
                <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-black ${QUESTION_TYPE_META[r.question.type].color}`}>{QUESTION_TYPE_META[r.question.type].short}</span>
                <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-black ${DIFFICULTY_META[r.question.difficulty]}`}>{r.question.difficulty}</span>
              </div>
              <span className="rounded-full bg-white px-3 py-1 text-[11px] font-black ring-1 ring-slate-200 text-slate-600 dark:bg-slate-900 dark:ring-slate-700 dark:text-slate-200">
                Score: {r.scoredMarks} / {r.maxMarks}
              </span>
            </div>
            <div className="p-5 space-y-4">
              <QuestionHeaderChip q={r.question} showMarks={true} />
              <p className="whitespace-pre-wrap text-lg font-bold leading-8 text-ink dark:text-white">{r.question.text}</p>

              {r.question.type === "mcq" && r.question.attemptOptions ? (
                <ol className="space-y-2">
                  {r.question.attemptOptions.map((opt, idx) => {
                    const letter = String.fromCharCode(65 + idx);
                    const correct = r.question.correctOption === idx;
                    const picked = r.userAnswer === String(idx);
                    let className = "bg-slate-50 dark:bg-slate-950";
                    if (correct) className = "bg-emerald-50 ring-1 ring-emerald-200 dark:bg-emerald-950/30 dark:ring-emerald-900";
                    else if (picked) className = "bg-rose-50 ring-1 ring-rose-200 dark:bg-rose-950/30 dark:ring-rose-900";
                    return (
                      <li key={idx} className={`flex items-start gap-3 rounded-xl px-4 py-3 ${className}`}>
                        <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-black ${correct ? "bg-emerald-600 text-white" : picked ? "bg-rose-600 text-white" : "bg-white ring-1 ring-slate-200 text-slate-500 dark:bg-slate-900 dark:ring-slate-800 dark:text-slate-300"}`}>{letter}</span>
                        <span className="text-sm text-slate-700 dark:text-slate-200">{opt}</span>
                        {correct ? <span className="ml-auto shrink-0 rounded-full bg-emerald-600 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-white">Answer</span> : null}
                        {picked && !correct ? <span className="ml-auto shrink-0 rounded-full bg-rose-600 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-white">Your Pick</span> : null}
                      </li>
                    );
                  })}
                </ol>
              ) : null}

              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Your Answer</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm font-bold text-ink dark:text-white">{r.userAnswer || "(skipped)"}</p>
                </div>
                {r.question.type !== "mcq" ? (
                  <div className="rounded-xl bg-emerald-50 p-4 dark:bg-emerald-950/30">
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-300">Correct / Reference</p>
                    <p className="mt-1 whitespace-pre-wrap text-sm font-bold text-emerald-900 dark:text-emerald-100">{r.question.correctAnswer || "—"}</p>
                  </div>
                ) : null}
              </div>

              {r.question.explanation ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Explanation</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-300">{r.question.explanation}</p>
                </div>
              ) : null}
            </div>
          </article>
        ))}
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-dashed border-slate-300 bg-white p-6 sm:flex-row sm:items-center sm:justify-between dark:border-slate-700 dark:bg-slate-900">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-ocean">Next up</p>
          <p className="mt-1 text-lg font-black text-ink dark:text-white">Ready for another random practice set?</p>
          <p className="mt-0.5 text-sm text-slate-500">Questions and MCQ option order re-shuffled each time.</p>
        </div>
        <button onClick={onRetry} className="inline-flex items-center gap-2 rounded-xl bg-ocean px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-700">
          <RefreshCw size={16} /> Retry New Random Set
        </button>
      </div>
    </div>
  );
};

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="space-y-2">
    <label className="block text-xs font-black uppercase tracking-[0.14em] text-slate-500">{label}</label>
    {children}
  </div>
);

const Stat: React.FC<{ icon: React.ElementType; label: string; value: string; hint?: string; color: string }> = ({ icon: Icon, label, value, hint, color }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
    <div className={`grid h-12 w-12 place-items-center rounded-xl ${color}`}>
      <Icon size={20} />
    </div>
    <p className="mt-4 text-3xl font-black text-ink dark:text-white">{value}</p>
    <div className="mt-1 flex items-baseline justify-between">
      <p className="text-sm font-semibold text-slate-500">{label}</p>
      {hint ? <p className="text-[11px] text-slate-400">{hint}</p> : null}
    </div>
  </div>
);

export default PracticeCenterPage;
