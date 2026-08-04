"use client";

import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, CheckCircle2, Search, Users } from "lucide-react";
import { toast } from "sonner";
import { availableClassrooms, classCodes, type Classroom } from "@/lib/student/data";

const ClassroomsPage: React.FC = () => {
  const [query, setQuery] = useState("");
  const [classCode, setClassCode] = useState("");
  const [classrooms, setClassrooms] = useState<Classroom[]>(availableClassrooms);

  const visibleClassrooms = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return classrooms;
    return classrooms.filter((item) => `${item.name} ${item.subject} ${item.teacher}`.toLowerCase().includes(value));
  }, [classrooms, query]);

  const joinClass = (event: React.FormEvent) => {
    event.preventDefault();
    const classroom = classCodes.get(classCode.trim().toUpperCase());
    if (!classroom) {
      toast.error("Class code not found. Try MATH101, PHYS201, or CHEM301.");
      return;
    }
    if (classrooms.some((item) => item.id === classroom.id)) {
      toast.info("You are already enrolled in this class.");
      return;
    }
    const nextClassrooms = [...classrooms, classroom];
    setClassrooms(nextClassrooms);
    setClassCode("");
    toast.success(`Joined ${classroom.name}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-ocean">Student Classes</p>
          <h1 className="mt-2 text-3xl font-black text-ink">My Classes</h1>
          <p className="mt-1 text-slate-600">Join classes using codes from your teacher.</p>
        </div>
        <form onSubmit={joinClass} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:flex-row">
          <input
            value={classCode}
            onChange={(event) => setClassCode(event.target.value)}
            placeholder="Enter class code"
            className="rounded-xl border border-slate-200 px-4 py-3 font-semibold uppercase outline-none focus:border-ocean focus:ring-2 focus:ring-ocean/20"
          />
          <button className="rounded-xl bg-ocean px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700">
            Join Class
          </button>
        </form>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search your classes..." className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-12 pr-4 outline-none focus:border-ocean focus:ring-2 focus:ring-ocean/20" />
      </div>

      {classrooms.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <BookOpen className="mx-auto text-ocean" size={42} />
          <h2 className="mt-4 text-xl font-black text-ink">No classes yet</h2>
          <p className="mt-2 text-slate-600">Use demo code MATH101, PHYS201, or CHEM301 to join your first class.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {visibleClassrooms.map((classroom, index) => (
            <motion.article key={classroom.id} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-blue-100 text-blue-600">
                  <BookOpen size={24} />
                </div>
                <CheckCircle2 className="text-mint" size={22} />
              </div>
              <h3 className="mt-5 text-xl font-black text-ink">{classroom.name}</h3>
              <p className="text-slate-600">{classroom.subject} · {classroom.teacher}</p>
              <div className="mt-5 flex items-center gap-2 text-sm text-slate-500">
                <Users size={16} />
                <span>{classroom.students} learners enrolled</span>
              </div>
              <div className="mt-5">
                <div className="mb-2 flex justify-between text-sm font-semibold">
                  <span>Progress</span>
                  <span>{classroom.progress}%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-ocean" style={{ width: `${classroom.progress}%` }} />
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClassroomsPage;
