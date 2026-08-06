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
    confirmPassword: ""
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
        password: formData.password
      });
      setIsSubmitted(true);
      toast.success("Student account created successfully.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to submit your request right now.";
      setErrorMessage(message);
      toast.error(message);
    }
  };

  return (
    <AuthShell
      title="Join a classroom"
      description="Create your student account first. After login, enter your class join code from My Classes."
      backLink={{ href: "/login", label: "Back to Sign In" }}
      sideContent={
        <>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-100">Student Access</p>
            <h2 className="mt-4 text-4xl font-semibold leading-tight">Create your student login, then request access to your class.</h2>
          </div>

          <div className="grid gap-4">
            {[
              {
                icon: UserPlus,
                title: "Student account",
                text: "Register with your name, roll number, email, and password."
              },
              {
                icon: KeyRound,
                title: "Class join code",
                text: "After login, submit the class code shared by your teacher or organizer."
              },
              {
                icon: BookOpenCheck,
                title: "Automatic subjects",
                text: "After approval, your dashboard shows only the teachers and subjects assigned to your class."
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
          <p className="text-base font-semibold">Your student account is ready.</p>
          <p className="mt-3 text-sm leading-7">
            Sign in to the Student Dashboard, open My Classes, and enter your class join code to request access.
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
                placeholder="Enter your roll number"
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
              "Create Student Account"
            )}
          </button>
        </form>
      )}
    </AuthShell>
  );
};

export default JoinClassroomPage;
