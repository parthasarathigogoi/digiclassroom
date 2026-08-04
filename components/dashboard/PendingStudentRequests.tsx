"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Check, Loader2, RefreshCw, X } from "lucide-react";
import { toast } from "sonner";
import { type AcademicClass, type AcademicDepartment, type AcademicSemester, type StudentAccessRequest, useAuth } from "@/contexts/AuthContext";

const formatDate = (value: unknown) => {
  if (!value || typeof value !== "object" || !("toDate" in value) || typeof value.toDate !== "function") {
    return "Just now";
  }

  return value.toDate().toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
};

const PendingStudentRequests: React.FC = () => {
  const { listPendingStudentRequests, decideStudentRequest, allocateStudent, listDepartments, listSemesters, listAcademicClasses } = useAuth();
  const [requests, setRequests] = useState<StudentAccessRequest[]>([]);
  const [departments, setDepartments] = useState<AcademicDepartment[]>([]);
  const [semesters, setSemesters] = useState<AcademicSemester[]>([]);
  const [classes, setClasses] = useState<AcademicClass[]>([]);
  const [allocations, setAllocations] = useState<Record<string, { departmentId: string; semesterId: string; classId: string }>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const loadersRef = useRef({ listPendingStudentRequests, listDepartments, listSemesters, listAcademicClasses });

  useEffect(() => {
    loadersRef.current = { listPendingStudentRequests, listDepartments, listSemesters, listAcademicClasses };
  }, [listAcademicClasses, listDepartments, listPendingStudentRequests, listSemesters]);

  const loadRequests = useCallback(async () => {
    setIsLoading(true);
    try {
      const [nextRequests, nextDepartments, nextSemesters, nextClasses] = await Promise.all([
        loadersRef.current.listPendingStudentRequests(),
        loadersRef.current.listDepartments(),
        loadersRef.current.listSemesters(),
        loadersRef.current.listAcademicClasses()
      ]);

      setRequests(nextRequests);
      setDepartments(nextDepartments);
      setSemesters(nextSemesters);
      setClasses(nextClasses);
      setAllocations(
        nextRequests.reduce<Record<string, { departmentId: string; semesterId: string; classId: string }>>((current, request) => {
          current[request.id] = {
            departmentId: request.departmentId || "",
            semesterId: request.semesterId || "",
            classId: request.classroomId || ""
          };
          return current;
        }, {})
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to load pending requests.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRequests();
  }, [loadRequests]);

  const handleDecision = async (studentId: string, decision: "approve" | "reject") => {
    setBusyId(studentId);
    try {
      await decideStudentRequest(studentId, decision);
      setRequests((current) => current.filter((request) => request.id !== studentId));
      toast.success(decision === "approve" ? "Student approved." : "Student request rejected.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update request.");
    } finally {
      setBusyId(null);
    }
  };

  const handleAllocateAndApprove = async (studentId: string) => {
    const allocation = allocations[studentId];

    if (!allocation?.departmentId || !allocation.semesterId || !allocation.classId) {
      toast.error("Select Department, Semester, and Class before approving.");
      return;
    }

    setBusyId(studentId);
    try {
      await allocateStudent({ studentId, ...allocation, approve: true });
      setRequests((current) => current.filter((request) => request.id !== studentId));
      toast.success("Student allocated and approved.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to allocate student.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-ocean">Student Approval</p>
          <h1 className="mt-2 text-3xl font-black text-ink">Pending Requests</h1>
          <p className="mt-1 text-slate-600">Review students before granting classroom access.</p>
        </div>
        <button
          type="button"
          onClick={loadRequests}
          className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
        >
          <RefreshCw size={17} />
          Refresh
        </button>
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {isLoading ? (
          <div className="flex items-center justify-center gap-3 p-10 text-sm font-semibold text-slate-500">
            <Loader2 className="animate-spin" size={18} />
            Loading pending requests...
          </div>
        ) : requests.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-lg font-black text-ink">No pending requests</p>
            <p className="mt-2 text-sm text-slate-500">New student join requests will appear here after they submit a valid class code.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {requests.map((request) => (
              <div key={request.id} className="grid gap-4 p-5 xl:grid-cols-[1fr_1.4fr_auto] xl:items-center">
                <div>
                  <p className="font-black text-ink">{request.name}</p>
                  <p className="mt-1 text-sm text-slate-500">{request.email}</p>
                  <p className="font-bold text-slate-700">Roll {request.rollNumber}</p>
                  <p className="font-bold uppercase tracking-[0.12em] text-ocean">{request.classJoinCode}</p>
                  <p className="mt-1 text-slate-500">{formatDate(request.approvalRequestedAt)}</p>
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                  <select
                    value={allocations[request.id]?.departmentId || ""}
                    onChange={(event) => setAllocations((current) => ({ ...current, [request.id]: { departmentId: event.target.value, semesterId: "", classId: "" } }))}
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-ocean"
                  >
                    <option value="">Department</option>
                    {departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}
                  </select>
                  <select
                    value={allocations[request.id]?.semesterId || ""}
                    onChange={(event) => setAllocations((current) => ({ ...current, [request.id]: { ...current[request.id], semesterId: event.target.value, classId: "" } }))}
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-ocean"
                  >
                    <option value="">Semester</option>
                    {semesters.filter((semester) => semester.departmentId === allocations[request.id]?.departmentId).map((semester) => <option key={semester.id} value={semester.id}>{semester.name}</option>)}
                  </select>
                  <select
                    value={allocations[request.id]?.classId || ""}
                    onChange={(event) => setAllocations((current) => ({ ...current, [request.id]: { ...current[request.id], classId: event.target.value } }))}
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-ocean"
                  >
                    <option value="">Class</option>
                    {classes
                      .filter((academicClass) => academicClass.departmentId === allocations[request.id]?.departmentId && academicClass.semesterId === allocations[request.id]?.semesterId)
                      .map((academicClass) => <option key={academicClass.id} value={academicClass.id}>{academicClass.name} · {academicClass.section}</option>)}
                  </select>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={busyId === request.id}
                    onClick={() => handleAllocateAndApprove(request.id)}
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:bg-emerald-300"
                  >
                    <Check size={16} />
                    Allocate & Approve
                  </button>
                  <button
                    type="button"
                    disabled={busyId === request.id}
                    onClick={() => handleDecision(request.id, "reject")}
                    className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-bold text-red-700 transition hover:bg-red-100 disabled:opacity-60"
                  >
                    <X size={16} />
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default PendingStudentRequests;
