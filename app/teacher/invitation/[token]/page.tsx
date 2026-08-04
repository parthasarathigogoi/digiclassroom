"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import AuthShell from "@/components/auth/AuthShell";
import { useAuth } from "@/contexts/AuthContext";

const TeacherInvitationPage: React.FC = () => {
  const params = useParams<{ token: string }>();
  const router = useRouter();
  const { activateTeacherInvitation, getTeacherInvitation, isLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: ""
  });
  const getTeacherInvitationRef = useRef(getTeacherInvitation);

  useEffect(() => {
    getTeacherInvitationRef.current = getTeacherInvitation;
  }, [getTeacherInvitation]);

  const loadInvitation = useCallback(async () => {
    try {
      const invitation = await getTeacherInvitationRef.current(params.token);
      setFormData((current) => ({ ...current, email: invitation.email }));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Invalid invitation link.");
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
      await activateTeacherInvitation({
        token: params.token,
        password: formData.password
      });
      toast.success("Joined organization successfully.");
      router.replace("/teacher/dashboard");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to activate invitation.");
    }
  };

  return (
    <AuthShell
      title="Join organization"
      description="Create your password to join your DigiClassroom organization."
      backLink={{ href: "/login", label: "Back to Sign In" }}
      sideContent={
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-100">Teacher Invitation</p>
          <h2 className="mt-4 text-4xl font-semibold leading-tight">Accept your invitation and enter the Teacher Dashboard.</h2>
          <p className="mt-4 max-w-md text-base leading-7 text-blue-100/90">After activation, you will be sent to the Teacher Dashboard.</p>
        </div>
      }
    >
      {isValidating ? (
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm font-semibold text-slate-600">
          <Loader2 className="animate-spin" size={18} />
          Validating invitation...
        </div>
      ) : errorMessage && !formData.email ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{errorMessage}</div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {errorMessage ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{errorMessage}</div> : null}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">Gmail</label>
            <input
              type="email"
              value={formData.email}
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
            Join Organization
          </button>
        </form>
      )}
    </AuthShell>
  );
};

export default TeacherInvitationPage;
