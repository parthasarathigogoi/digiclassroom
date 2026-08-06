"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  ChevronRight,
  Download,
  FileText,
  Film,
  FolderOpen,
  Loader2,
  NotebookPen,
  Search,
  StickyNote
} from "lucide-react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { toast } from "sonner";
import { canAccessAllocationScope, useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";

type MaterialType = "notes" | "document" | "video" | "link" | "assignment_sheet" | "syllabus";

type StudyMaterial = {
  id: string;
  title: string;
  description?: string;
  type: MaterialType;
  subject?: string;
  subjectId?: string;
  department?: string;
  departmentId?: string;
  semester?: string;
  semesterId?: string;
  classroomName?: string;
  classroomId?: string;
  classSection?: string;
  topic?: string;
  fileUrl?: string;
  fileType?: string;
  fileSize?: string;
  videoUrl?: string;
  externalLink?: string;
  pages?: number;
  duration?: string;
  teacherName?: string;
  createdAt?: unknown;
  tags?: string[];
  institutionId?: string;
  chapter?: string;
};

const TYPE_META: Record<MaterialType, { label: string; icon: React.ElementType; color: string }> = {
  notes: { label: "Notes", icon: NotebookPen, color: "bg-blue-100 text-blue-700" },
  document: { label: "Document", icon: FileText, color: "bg-emerald-100 text-emerald-700" },
  video: { label: "Video", icon: Film, color: "bg-rose-100 text-rose-700" },
  link: { label: "Reference Link", icon: ChevronRight, color: "bg-amber-100 text-amber-700" },
  assignment_sheet: { label: "Assignment Sheet", icon: StickyNote, color: "bg-violet-100 text-violet-700" },
  syllabus: { label: "Syllabus", icon: BookOpen, color: "bg-cyan-100 text-cyan-700" }
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
  if (!date || Number.isNaN(date.getTime())) return "Not available";
  return date.toLocaleDateString(undefined, { dateStyle: "medium" });
};

const StudyMaterialsPage: React.FC = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [search, setSearch] = useState("");
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<MaterialType | null>(null);

  useEffect(() => {
    const loadMaterials = async () => {
      if (!user) return;
      setIsLoading(true);
      try {
        const snapshot = await getDocs(query(collection(db, "studyMaterials")));
        const list = snapshot.docs
          .map((item) => ({ id: item.id, ...(item.data() as Omit<StudyMaterial, "id">) }))
          .filter((m) => canAccessAllocationScope(user, m));
        setMaterials(list);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to load study materials.");
      } finally {
        setIsLoading(false);
      }
    };
    void loadMaterials();
  }, [user]);

  const subjects = useMemo(() => {
    const set = new Set<string>();
    materials.forEach((m) => m.subject && set.add(m.subject));
    return Array.from(set).sort();
  }, [materials]);

  const filtered = useMemo(() => {
    return materials.filter((m) => {
      if (selectedSubject && m.subject !== selectedSubject) return false;
      if (selectedType && m.type !== selectedType) return false;
      if (search.trim()) {
        const s = search.trim().toLowerCase();
        const hay = `${m.title} ${m.description || ""} ${m.topic || ""} ${m.chapter || ""} ${m.tags?.join(" ") || ""}`.toLowerCase();
        if (!hay.includes(s)) return false;
      }
      return true;
    });
  }, [materials, selectedSubject, selectedType, search]);

  const groupedBySubject = useMemo(() => {
    const map = new Map<string | null, StudyMaterial[]>();
    filtered.forEach((m) => {
      const key = m.subject || null;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(m);
    });
    return Array.from(map.entries());
  }, [filtered]);

  const counts = useMemo(() => {
    const total = materials.length;
    const byType: Record<string, number> = {};
    materials.forEach((m) => {
      byType[m.type] = (byType[m.type] || 0) + 1;
    });
    return { total, subjects: subjects.length, byType };
  }, [materials, subjects]);

  return (
    <div className="space-y-7">
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-ocean">Resources</p>
        <h1 className="mt-2 text-3xl font-black text-ink">Study Materials</h1>
        <p className="mt-1 text-slate-600">Notes, documents, videos, and links only for your Department, Semester, Class, and Subject.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard icon={FolderOpen} label="Total Materials" value={counts.total.toString()} color="bg-blue-100 text-blue-700" />
        <StatCard icon={BookOpen} label="Subjects" value={counts.subjects.toString()} color="bg-emerald-100 text-emerald-700" />
        <StatCard icon={NotebookPen} label="Notes" value={(counts.byType.notes || 0).toString()} color="bg-amber-100 text-amber-700" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, topic, chapter, or tags..."
            className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm outline-none transition focus:border-ocean focus:ring-4 focus:ring-ocean/20"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <FilterChip active={selectedSubject === null} onClick={() => setSelectedSubject(null)}>
            All Subjects
          </FilterChip>
          {subjects.map((s) => (
            <FilterChip key={s} active={selectedSubject === s} onClick={() => setSelectedSubject(s)}>
              {s}
            </FilterChip>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <TypeChip type={null} active={selectedType === null} onClick={() => setSelectedType(null)} />
        {(Object.keys(TYPE_META) as MaterialType[]).map((t) => (
          <TypeChip key={t} type={t} active={selectedType === t} onClick={() => setSelectedType(t)} />
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white p-10 text-sm font-semibold text-slate-500 shadow-sm">
          <Loader2 className="animate-spin" size={18} />
          Loading study materials...
        </div>
      ) : groupedBySubject.length ? (
        <div className="space-y-7">
          {groupedBySubject.map(([subject, list]) => (
            <section key={subject || "uncategorized"} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="grid h-12 w-12 place-items-center rounded-xl bg-ocean/10 text-ocean">
                    <BookOpen size={22} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-ink">{subject || "General Materials"}</h2>
                    <p className="text-sm text-slate-500">{list.length} resource{list.length > 1 ? "s" : ""}</p>
                  </div>
                </div>
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
                {list.map((m) => (
                  <MaterialCard key={m.id} material={m} />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
          <FolderOpen className="mx-auto text-ocean" size={32} />
          <h2 className="mt-4 text-lg font-black text-ink">No study materials found</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
            Teachers and organizers publish materials for specific Department, Semester, Class / Section, and Subject allocations.
          </p>
        </section>
      )}
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

const FilterChip: React.FC<{ active?: boolean; onClick?: () => void; children: React.ReactNode }> = ({
  active,
  onClick,
  children
}) => (
  <button
    onClick={onClick}
    className={`rounded-full px-4 py-2 text-sm font-bold transition ${
      active ? "bg-ocean text-white shadow" : "border border-slate-200 bg-white text-slate-700 hover:border-ocean hover:text-ocean"
    }`}
  >
    {children}
  </button>
);

const TypeChip: React.FC<{ type: MaterialType | null; active: boolean; onClick: () => void }> = ({ type, active, onClick }) => {
  if (type === null) {
    return (
      <button
        onClick={onClick}
        className={`rounded-full px-4 py-2 text-sm font-bold transition ${
          active ? "bg-slate-900 text-white" : "border border-slate-200 bg-white text-slate-700 hover:border-slate-400"
        }`}
      >
        All Types
      </button>
    );
  }
  const meta = TYPE_META[type];
  const Icon = meta.icon;
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition ${
        active ? meta.color + " shadow" : "border border-slate-200 bg-white text-slate-700 hover:border-ocean hover:text-ocean"
      }`}
    >
      <Icon size={14} /> {meta.label}
    </button>
  );
};

const MaterialCard: React.FC<{ material: StudyMaterial }> = ({ material }) => {
  const meta = TYPE_META[material.type] || TYPE_META.document;
  const Icon = meta.icon;
  const isExternal = material.type === "link" || material.type === "video" || !!material.externalLink || !!material.videoUrl;

  const open = () => {
    const url = material.fileUrl || material.videoUrl || material.externalLink;
    if (!url) {
      toast.info("This material has no downloadable or viewable link yet.");
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <article className="flex flex-col rounded-2xl border border-slate-100 bg-slate-50 p-5 transition hover:border-ocean/30 hover:bg-white hover:shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className={`grid h-10 w-10 place-items-center rounded-xl ${meta.color}`}>
          <Icon size={18} />
        </div>
        <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${meta.color}`}>
          {meta.label}
        </span>
      </div>

      <h3 className="mt-4 font-black text-ink">{material.title}</h3>
      {material.description ? (
        <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{material.description}</p>
      ) : null}

      <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
        {material.chapter ? (
          <Detail label="Chapter" value={material.chapter} />
        ) : material.topic ? (
          <Detail label="Topic" value={material.topic} />
        ) : null}
        <Detail label="Added" value={formatDate(material.createdAt)} />
        {material.pages ? <Detail label="Pages" value={`${material.pages}`} /> : null}
        {material.duration ? <Detail label="Duration" value={material.duration} /> : null}
        {material.fileSize ? <Detail label="Size" value={material.fileSize} /> : null}
        {material.teacherName ? <Detail label="Teacher" value={material.teacherName} /> : null}
        {material.classroomName ? <Detail label="Class" value={material.classroomName} /> : null}
      </div>

      {material.tags?.length ? (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {material.tags.map((t) => (
            <span key={t} className="rounded-full bg-white px-2.5 py-1 text-[10px] font-bold text-slate-600">
              #{t}
            </span>
          ))}
        </div>
      ) : null}

      <button
        onClick={open}
        className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-ocean px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700"
      >
        {isExternal ? <ChevronRight size={15} /> : <Download size={15} />}
        {isExternal ? "Open" : material.fileUrl ? "Download" : "View"}
      </button>
    </article>
  );
};

const Detail: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="rounded-lg bg-white px-3 py-2">
    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">{label}</p>
    <p className="mt-0.5 font-bold text-ink truncate">{value}</p>
  </div>
);

export default StudyMaterialsPage;
