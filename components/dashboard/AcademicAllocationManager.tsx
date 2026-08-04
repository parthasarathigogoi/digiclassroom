"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BookOpen, Building2, Loader2, Plus, Presentation, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import {
  type AcademicClass,
  type AcademicDepartment,
  type AcademicSemester,
  type AcademicSubject,
  useAuth
} from "@/contexts/AuthContext";

type AcademicAllocationManagerProps = {
  mode: "departments" | "classes" | "subjects";
};

const AcademicAllocationManager: React.FC<AcademicAllocationManagerProps> = ({ mode }) => {
  const {
    createDepartment,
    listDepartments,
    createSemester,
    listSemesters,
    createAcademicClass,
    listAcademicClasses,
    createSubject,
    listSubjects
  } = useAuth();
  const [departments, setDepartments] = useState<AcademicDepartment[]>([]);
  const [semesters, setSemesters] = useState<AcademicSemester[]>([]);
  const [classes, setClasses] = useState<AcademicClass[]>([]);
  const [subjects, setSubjects] = useState<AcademicSubject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [departmentForm, setDepartmentForm] = useState({ name: "", code: "" });
  const [semesterForm, setSemesterForm] = useState({ name: "", departmentId: "" });
  const [classForm, setClassForm] = useState({ name: "", section: "", classCode: "", departmentId: "", semesterId: "" });
  const [subjectForm, setSubjectForm] = useState({ name: "", code: "", departmentId: "", semesterId: "" });
  const loadersRef = useRef({ listDepartments, listSemesters, listAcademicClasses, listSubjects });

  useEffect(() => {
    loadersRef.current = { listDepartments, listSemesters, listAcademicClasses, listSubjects };
  }, [listAcademicClasses, listDepartments, listSemesters, listSubjects]);

  const selectedClassSemesters = useMemo(
    () => semesters.filter((semester) => !classForm.departmentId || semester.departmentId === classForm.departmentId),
    [classForm.departmentId, semesters]
  );
  const selectedSubjectSemesters = useMemo(
    () => semesters.filter((semester) => !subjectForm.departmentId || semester.departmentId === subjectForm.departmentId),
    [subjectForm.departmentId, semesters]
  );

  const loadAcademicStructure = useCallback(async () => {
    setIsLoading(true);

    try {
      const nextDepartments = await loadersRef.current.listDepartments();
      const nextSemesters = await loadersRef.current.listSemesters();
      const nextClasses = await loadersRef.current.listAcademicClasses();
      const nextSubjects = await loadersRef.current.listSubjects();

      setDepartments(nextDepartments);
      setSemesters(nextSemesters);
      setClasses(nextClasses);
      setSubjects(nextSubjects);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to load academic allocation data.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAcademicStructure();
  }, [loadAcademicStructure]);

  const saveDepartment = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);

    try {
      await createDepartment(departmentForm);
      setDepartmentForm({ name: "", code: "" });
      await loadAcademicStructure();
      toast.success("Department created.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to create department.");
    } finally {
      setIsSaving(false);
    }
  };

  const saveSemester = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);

    try {
      await createSemester(semesterForm);
      setSemesterForm({ name: "", departmentId: "" });
      await loadAcademicStructure();
      toast.success("Semester created.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to create semester.");
    } finally {
      setIsSaving(false);
    }
  };

  const saveClass = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);

    try {
      await createAcademicClass(classForm);
      setClassForm({ name: "", section: "", classCode: "", departmentId: "", semesterId: "" });
      await loadAcademicStructure();
      toast.success("Class created.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to create class.");
    } finally {
      setIsSaving(false);
    }
  };

  const saveSubject = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);

    try {
      await createSubject(subjectForm);
      setSubjectForm({ name: "", code: "", departmentId: "", semesterId: "" });
      await loadAcademicStructure();
      toast.success("Subject created.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to create subject.");
    } finally {
      setIsSaving(false);
    }
  };

  const title = mode === "departments" ? "Departments & Semesters" : mode === "classes" ? "Classes / Sections" : "Subjects";
  const eyebrow = mode === "departments" ? "Academic Structure" : mode === "classes" ? "Class Allocation" : "Subject Allocation";
  const Icon = mode === "departments" ? Building2 : mode === "classes" ? Presentation : BookOpen;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-ocean">{eyebrow}</p>
          <h1 className="mt-2 text-3xl font-black text-ink dark:text-white">{title}</h1>
          <p className="mt-1 max-w-3xl text-slate-600 dark:text-slate-400">Organizer-controlled Department → Semester → Class → Subject relationships. Records appear only after you create them.</p>
        </div>
        <button type="button" onClick={loadAcademicStructure} className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
          <RefreshCw size={17} />
          Refresh
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white p-10 text-sm font-semibold text-slate-500 dark:border-slate-800 dark:bg-slate-900">
          <Loader2 className="animate-spin" size={18} />
          Loading allocation records...
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-3">
              <Icon className="text-ocean" size={24} />
              <h2 className="text-xl font-black text-ink dark:text-white">Create Records</h2>
            </div>

            {mode === "departments" ? (
              <div className="mt-5 space-y-6">
                <form onSubmit={saveDepartment} className="space-y-4">
                  <h3 className="font-black text-ink dark:text-white">Create Department</h3>
                  <input required value={departmentForm.name} onChange={(event) => setDepartmentForm({ ...departmentForm, name: event.target.value })} placeholder="Department name" className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-ocean dark:border-slate-800 dark:bg-slate-950" />
                  <input required value={departmentForm.code} onChange={(event) => setDepartmentForm({ ...departmentForm, code: event.target.value })} placeholder="Department code" className="w-full rounded-xl border border-slate-200 px-4 py-3 uppercase outline-none focus:border-ocean dark:border-slate-800 dark:bg-slate-950" />
                  <button disabled={isSaving} className="inline-flex items-center gap-2 rounded-xl bg-ocean px-4 py-3 text-sm font-bold text-white disabled:bg-blue-300"><Plus size={16} /> Create Department</button>
                </form>

                <form onSubmit={saveSemester} className="space-y-4 border-t border-slate-100 pt-6 dark:border-slate-800">
                  <h3 className="font-black text-ink dark:text-white">Add Semester</h3>
                  <select required value={semesterForm.departmentId} onChange={(event) => setSemesterForm({ ...semesterForm, departmentId: event.target.value })} className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-ocean dark:border-slate-800 dark:bg-slate-950">
                    <option value="">Select department</option>
                    {departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}
                  </select>
                  <input required value={semesterForm.name} onChange={(event) => setSemesterForm({ ...semesterForm, name: event.target.value })} placeholder="Semester name" className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-ocean dark:border-slate-800 dark:bg-slate-950" />
                  <button disabled={isSaving} className="inline-flex items-center gap-2 rounded-xl bg-ocean px-4 py-3 text-sm font-bold text-white disabled:bg-blue-300"><Plus size={16} /> Add Semester</button>
                </form>
              </div>
            ) : mode === "classes" ? (
              <form onSubmit={saveClass} className="mt-5 space-y-4">
                <select required value={classForm.departmentId} onChange={(event) => setClassForm({ ...classForm, departmentId: event.target.value, semesterId: "" })} className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-ocean dark:border-slate-800 dark:bg-slate-950">
                  <option value="">Select department</option>
                  {departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}
                </select>
                <select required value={classForm.semesterId} onChange={(event) => setClassForm({ ...classForm, semesterId: event.target.value })} className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-ocean dark:border-slate-800 dark:bg-slate-950">
                  <option value="">Select semester</option>
                  {selectedClassSemesters.map((semester) => <option key={semester.id} value={semester.id}>{semester.name}</option>)}
                </select>
                <input required value={classForm.name} onChange={(event) => setClassForm({ ...classForm, name: event.target.value })} placeholder="Class name" className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-ocean dark:border-slate-800 dark:bg-slate-950" />
                <input required value={classForm.section} onChange={(event) => setClassForm({ ...classForm, section: event.target.value })} placeholder="Section" className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-ocean dark:border-slate-800 dark:bg-slate-950" />
                <input required value={classForm.classCode} onChange={(event) => setClassForm({ ...classForm, classCode: event.target.value.toUpperCase() })} placeholder="Unique class code" className="w-full rounded-xl border border-slate-200 px-4 py-3 uppercase outline-none focus:border-ocean dark:border-slate-800 dark:bg-slate-950" />
                <button disabled={isSaving} className="inline-flex items-center gap-2 rounded-xl bg-ocean px-4 py-3 text-sm font-bold text-white disabled:bg-blue-300"><Plus size={16} /> Create Class</button>
              </form>
            ) : (
              <form onSubmit={saveSubject} className="mt-5 space-y-4">
                <select required value={subjectForm.departmentId} onChange={(event) => setSubjectForm({ ...subjectForm, departmentId: event.target.value, semesterId: "" })} className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-ocean dark:border-slate-800 dark:bg-slate-950">
                  <option value="">Select department</option>
                  {departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}
                </select>
                <select required value={subjectForm.semesterId} onChange={(event) => setSubjectForm({ ...subjectForm, semesterId: event.target.value })} className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-ocean dark:border-slate-800 dark:bg-slate-950">
                  <option value="">Select semester</option>
                  {selectedSubjectSemesters.map((semester) => <option key={semester.id} value={semester.id}>{semester.name}</option>)}
                </select>
                <input required value={subjectForm.name} onChange={(event) => setSubjectForm({ ...subjectForm, name: event.target.value })} placeholder="Subject name" className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-ocean dark:border-slate-800 dark:bg-slate-950" />
                <input required value={subjectForm.code} onChange={(event) => setSubjectForm({ ...subjectForm, code: event.target.value })} placeholder="Subject code" className="w-full rounded-xl border border-slate-200 px-4 py-3 uppercase outline-none focus:border-ocean dark:border-slate-800 dark:bg-slate-950" />
                <button disabled={isSaving} className="inline-flex items-center gap-2 rounded-xl bg-ocean px-4 py-3 text-sm font-bold text-white disabled:bg-blue-300"><Plus size={16} /> Add Subject</button>
              </form>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-xl font-black text-ink dark:text-white">Current Records</h2>
            <div className="mt-5 space-y-3">
              {mode === "departments" && departments.length === 0 ? <EmptyState text="No departments created yet." /> : null}
              {mode === "classes" && classes.length === 0 ? <EmptyState text="No classes created yet." /> : null}
              {mode === "subjects" && subjects.length === 0 ? <EmptyState text="No subjects created yet." /> : null}

              {mode === "departments" ? departments.map((department) => (
                <RecordRow key={department.id} title={department.name} detail={`${department.code} · ${semesters.filter((semester) => semester.departmentId === department.id).length} semesters`} />
              )) : null}
              {mode === "classes" ? classes.map((academicClass) => (
                <RecordRow key={academicClass.id} title={`${academicClass.name} · ${academicClass.section}`} detail={`${academicClass.departmentName} · ${academicClass.semesterName} · Code ${academicClass.classCode}`} />
              )) : null}
              {mode === "subjects" ? subjects.map((subject) => {
                const department = departments.find((item) => item.id === subject.departmentId);
                const semester = semesters.find((item) => item.id === subject.semesterId);
                return <RecordRow key={subject.id} title={subject.name} detail={`${subject.code} · ${department?.name || "Department"} · ${semester?.name || "Semester"}`} />;
              }) : null}
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

const EmptyState: React.FC<{ text: string }> = ({ text }) => (
  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm font-medium text-slate-500 dark:border-slate-700 dark:bg-slate-950">
    {text}
  </div>
);

const RecordRow: React.FC<{ title: string; detail: string }> = ({ title, detail }) => (
  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
    <p className="font-black text-ink dark:text-white">{title}</p>
    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{detail}</p>
  </div>
);

export default AcademicAllocationManager;
