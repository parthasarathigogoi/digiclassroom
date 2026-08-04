"use client";

import React, { useEffect, useState } from "react";
import { Check, Loader2, RefreshCw, X } from "lucide-react";
import { toast } from "sonner";
import { type StudentAccessRequest, useAuth } from "@/contexts/AuthContext";

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
  const { listPendingStudentRequests, decideStudentRequest } = useAuth();
  const [requests, setRequests] = useState<StudentAccessRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadRequests = async () => {
    setIsLoading(true);
    try {
      setRequests(await listPendingStudentRequests());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to load pending requests.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadRequests();
  }, []);

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
              <div key={request.id} className="grid gap-4 p-5 lg:grid-cols-[1.2fr_0.9fr_0.7fr_auto] lg:items-center">
                <div>
                  <p className="font-black text-ink">{request.name}</p>
                  <p className="mt-1 text-sm text-slate-500">{request.email}</p>
                </div>
                <div className="text-sm">
                  <p className="font-bold text-slate-700">Roll {request.rollNumber}</p>
                  <p className="mt-1 text-slate-500">{request.classroomName || "Requested Classroom"}</p>
                </div>
                <div className="text-sm">
                  <p className="font-bold uppercase tracking-[0.12em] text-ocean">{request.classJoinCode}</p>
                  <p className="mt-1 text-slate-500">{formatDate(request.approvalRequestedAt)}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={busyId === request.id}
                    onClick={() => handleDecision(request.id, "approve")}
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:bg-emerald-300"
                  >
                    <Check size={16} />
                    Approve
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
