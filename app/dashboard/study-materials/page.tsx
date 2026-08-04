"use client";

import React, { useMemo, useState } from "react";
import { BookOpen, Download, FileText, PlayCircle, Search, Upload } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { materials as defaultMaterials, type Material } from "@/lib/student/data";

const iconByType = {
  PDF: FileText,
  Video: PlayCircle,
  Notes: BookOpen
};

const StudyMaterialsPage: React.FC = () => {
  const [query, setQuery] = useState("");
  const [materials, setMaterials] = useState<Material[]>(defaultMaterials);
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const filtered = useMemo(() => {
    const value = query.toLowerCase();
    return materials.filter((item) => `${item.title} ${item.subject} ${item.type}`.toLowerCase().includes(value));
  }, [query]);

  const uploadMaterial = (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim()) {
      toast.error("Enter a material title.");
      return;
    }
    setMaterials((current) => current.concat({
      id: Date.now().toString(),
      title,
      subject: "Data Structures",
      type: "PDF",
      size: "Uploaded"
    }));
    setTitle("");
    toast.success("Material uploaded for students");
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-ocean">{user?.role === "teacher" ? "Teacher Resources" : "Resources"}</p>
        <h1 className="mt-2 text-3xl font-black text-ink">Study Materials</h1>
        <p className="mt-1 text-slate-600">{user?.role === "teacher" ? "Upload and organize PDF, PPT, notes, diagrams, and recorded links." : "Search, open, and download your class resources."}</p>
      </div>

      {user?.role === "teacher" && (
        <form onSubmit={uploadMaterial} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row">
          <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Material title, e.g. Stack PPT" className="flex-1 rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-ocean" />
          <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-ocean px-5 py-3 text-sm font-bold text-white"><Upload size={18} /> Upload Material</button>
        </form>
      )}

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search material..." className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-12 pr-4 outline-none focus:border-ocean focus:ring-2 focus:ring-ocean/20" />
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((item) => {
          const Icon = iconByType[item.type];
          return (
            <article key={item.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-blue-100 text-blue-600">
                <Icon size={24} />
              </div>
              <h2 className="mt-5 text-xl font-black text-ink">{item.title}</h2>
              <p className="mt-1 text-sm text-slate-500">{item.subject} · {item.type} · {item.size}</p>
              <button onClick={() => toast.success(`${item.title} is ready to view`)} className="mt-5 mr-2 rounded-xl bg-ocean px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-700">
                Open
              </button>
              <button onClick={() => toast.success(`Downloaded ${item.title}`)} className="mt-5 inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 transition hover:border-ocean hover:text-ocean">
                <Download size={18} />
                Download
              </button>
            </article>
          );
        })}
      </div>
    </div>
  );
};

export default StudyMaterialsPage;
