"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, GraduationCap, BookOpen, Users, Calendar } from "lucide-react";
import { toast } from "sonner";
import AuthShell from "@/components/auth/AuthShell";
import { useAuth } from "@/contexts/AuthContext";

const StudentInvitationPage: React.FC = () => {
  const params = useParams<{ token: string }>();
  const router = useRouter();
  const { activateStudentInvitation, getStudentInvitation, isLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [invitationData, setInvitationData] = useState<{
    studentName: string;
    email: string;
    rollNumber: string;
    department: string;
    semester: string;
    classroomName: string;
    classSection: string;
    subjects: string[];
  } | null>(null);
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: ""
  });
  const getStudentInvitationRef = useRef(getStudentInvitation);

  useEffect(() => {
    getStudentInvitationRef.current = getStudentInvitation;
  }, [getStudentInvitation]);

  const loadInvitation = useCallback(async () => {
    try {
      const invitation = await getStudentInvitationRef.current(params.token);
      setInvitationData({
        studentName: invitation.studentName,
        email: invitation.email,
        rollNumber: invitation.rollNumber,
        department: invitation.department,
        semester: invitation.semester,
        classroomName: invitation.classroomName,
        classSection: invitation.classSection,
        subjects: invitation.subjects
      });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Invalid or expired invitation link.");
    } finally {
      setIsValidating(false);
    }
  }, [params.token]);

  useEffect(() => {
    void loadInvitation();
  }, [loadInvitation]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    try {
      await activateStudentInvitation({
        token: params.token,
        password: formData.password
      });
      toast.success("Welcome! Your student account has been created.");
      router.replace("/student/dashboard");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to activate invitation.");
    }
  };

  return (
    <AuthShell
      title="Accept student invitation"
      description="Create your password to activate your student account and access your allocated classes."
      backLink={{ href: "/login", label: "Back to Sign In" }}
      sideContent={
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-100">Student Invitation</p>
          <h2 className="mt-4 text-4xl font-semibold leading-tight">Create your account and enter the Student Dashboard.</h2>
          <p className="mt-4 max-w-md text-base leading-7 text-blue-100/90">After creating your password, you will be automatically signed in to your classes, study materials, assignments, and exams.</p>
          {invitationData ? (
            <div className="mt-8 space-y-4 rounded-3xl border border-white/20 bg-white/10 p-6 backdrop-blur">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-200">Your Class Allocation</p>
              <div className="grid grid-cols-2 gap-3">
                <AllocationBadge icon={BookOpen} label="Department" value={invitationData.department} />
                <AllocationBadge icon={Calendar} label="Semester" value={invitationData.semester} />
                <AllocationBadge icon={Users} label="Class" value={`${invitationData.classroomName}${invitationData.classSection ? ` · Sec ${invitationData.classSection}` : ""}`} />
                <AllocationBadge icon={GraduationCap} label="Subjects" value={`${invitationData.subjects.length} subject${invitationData.subjects.length > 1 ? "s" : ""}`} />
              </div>
              {invitationData.subjects.length ? (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {invitationData.subjects.map((subject) => (
                    <span key={subject} className="rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold text-white">
                      {subject}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      }
    >
      {isValidating ? (
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm font-semibold text-slate-600">
          <Loader2 className="animate-spin" size={18} />
          Validating invitation...
        </div>
      ) : errorMessage && !invitationData ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{errorMessage}</div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {errorMessage ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{errorMessage}</div> : null}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">Student Name</label>
            <input
              type="text"
              value={invitationData?.studentName || ""}
              readOnly
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-600 outline-none"
            />
          </div>
          {invitationData?.rollNumber ? (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">Roll Number</label>
              <input
                type="text"
                value={invitationData.rollNumber}
                readOnly
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-600 outline-none"
              />
            </div>
          ) : null}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">Email Address</label>
            <input
              type="email"
              value={invitationData?.email || ""}
              readOnly
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-600 outline-none"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">Create Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(event) => setFormData({ ...formData, password: event.target.value })}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 pr-12 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                required
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">Confirm Password</label>
            <input
              type={showPassword ? "text" : "password"}
              value={formData.confirmPassword}
              onChange={(event) => setFormData({ ...formData, confirmPassword: event.target.value })}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
              required
            />
          </div>
          <button type="submit" disabled={isLoading} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:bg-blue-400">
            {isLoading ? <Loader2 className="animate-spin" size={18} /> : null}
            Activate Student Account
          </button>
        </form>
      )}
    </AuthShell>
  );
};

const AllocationBadge: React.FC<{ icon: React.ElementType; label: string; value: string }> = ({ icon: Icon, label, value }) => (
  <div className="rounded-2xl bg-white/10 px-4 py-3">
    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-blue-200/90">
      <Icon size={12} />
      {label}
    </div>
    <p className="mt-1.5 truncate text-sm font-bold text-white">{value || "—"}</p>
  </div>
);

export default StudentInvitationPage;
