"use client";

import React, { useState } from "react";
import Link from "next/link";
import { BookOpenCheck, CheckCircle2, Eye, EyeOff, KeyRound, Loader2, UserPlus } from "lucide-react";
import AuthShell from "@/components/auth/AuthShell";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const JoinClassroomPage: React.FC = () => {
  const { requestStudentAccess, isLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    rollNumber: "",
    password: "",
    confirmPassword: "",
    classJoinCode: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    try {
      setErrorMessage("");
      await requestStudentAccess({
        fullName: formData.fullName,
        email: formData.email,
        rollNumber: formData.rollNumber,
        password: formData.password,
        classJoinCode: formData.classJoinCode
      });
      setIsSubmitted(true);
      toast.success("Join request submitted successfully.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to submit your request right now.";
      setErrorMessage(message);
      toast.error(message);
    }
  };

  return (
    <AuthShell
      title="Join a classroom"
      description="Students can request access using a valid class join code. Once approved, they can sign in normally."
      backLink={{ href: "/login", label: "Back to Sign In" }}
      sideContent={
        <>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-100">Student Access</p>
            <h2 className="mt-4 text-4xl font-semibold leading-tight">Request entry to the right classroom with your join code.</h2>
          </div>

          <div className="grid gap-4">
            {[
              {
                icon: KeyRound,
                title: "Join code based",
                text: "Every request is tied to a class join code shared by your classroom team."
              },
              {
                icon: UserPlus,
                title: "Approval workflow",
                text: "Your request is sent to the Teacher and Organizer before access is activated."
              },
              {
                icon: BookOpenCheck,
                title: "Student-first simplicity",
                text: "The form stays clear and mobile-friendly so joining is straightforward from anywhere."
              }
            ].map((item) => (
              <div key={item.title} className="rounded-3xl border border-white/15 bg-white/10 p-5 backdrop-blur-sm">
                <div className="mb-3 inline-flex rounded-2xl bg-white/15 p-3">
                  <item.icon size={22} />
                </div>
                <h3 className="text-lg font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-blue-100/90">{item.text}</p>
              </div>
            ))}
          </div>
        </>
      }
      footer={
        <p className="text-sm text-slate-600">
          Already approved?{" "}
          <Link href="/login" className="font-semibold text-blue-700 transition hover:text-blue-800 hover:underline">
            Sign In
          </Link>
        </p>
      }
    >
      {isSubmitted ? (
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 text-emerald-800">
          <div className="mb-4 inline-flex rounded-2xl bg-emerald-100 p-3 text-emerald-700">
            <CheckCircle2 size={22} />
          </div>
          <p className="text-base font-semibold">Your request has been sent to the Teacher and Organizer for approval.</p>
          <p className="mt-3 text-sm leading-7">
            Once your request is approved, you can return to the main Sign In page and access your student dashboard.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {errorMessage ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMessage}
            </div>
          ) : null}

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700">Full Name</label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                placeholder="Enter your full name"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">Email Address</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                placeholder="student@email.com"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">Roll Number</label>
              <input
                type="text"
                value={formData.rollNumber}
                onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value })}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                placeholder="2026-BCS-014"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 pr-12 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                  placeholder="Create a password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-slate-700"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">Confirm Password</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 pr-12 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                  placeholder="Repeat your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-slate-700"
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="space-y-2 sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700">Class Join Code</label>
              <input
                type="text"
                value={formData.classJoinCode}
                onChange={(e) => setFormData({ ...formData, classJoinCode: e.target.value.toUpperCase() })}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 uppercase tracking-[0.14em] outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                placeholder="CLASS-2026-A1"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                Sending request...
              </>
            ) : (
              "Request to Join Classroom"
            )}
          </button>
        </form>
      )}
    </AuthShell>
  );
};

export default JoinClassroomPage;
