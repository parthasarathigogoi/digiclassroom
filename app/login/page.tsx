"use client";
import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2, Eye, EyeOff, Loader2, LockKeyhole, PanelsTopLeft } from "lucide-react";
import AuthShell from "@/components/auth/AuthShell";
import { getDashboardRouteByRole, useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const LoginPage: React.FC = () => {
  const router = useRouter();
  const { login, logout, isLoading } = useAuth();
  const logoutRef = useRef(logout);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });

  useEffect(() => {
    logoutRef.current = logout;
  }, [logout]);

  useEffect(() => {
    void logoutRef.current();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setErrorMessage("");
      const signedInUser = await login(formData.email, formData.password, false);
      toast.success("Login successful!");
      router.replace(getDashboardRouteByRole(signedInUser.role));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Login failed. Please try again.";
      setErrorMessage(message);
      toast.error(message);
    }
  };

  return (
    <AuthShell
      title="Welcome back"
      description="Sign in with your institution email to manage your organization workspace."
      sideContent={
        <>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-100">Organizer Access</p>
            <h2 className="mt-4 text-4xl font-semibold leading-tight">Return to your organization command center.</h2>
            <p className="mt-4 max-w-md text-base leading-7 text-blue-100/90">
              Manage teachers, students, classes, subjects, and settings from one clean self-service dashboard.
            </p>
          </div>

          <div className="grid gap-4">
            {[
              {
                icon: Building2,
                title: "Organization workspace",
                text: "Load your institution profile and continue where your team left off."
              },
              {
                icon: PanelsTopLeft,
                title: "Operational dashboard",
                text: "Track classes, assignments, exams, live sessions, and student approvals."
              },
              {
                icon: LockKeyhole,
                title: "Secure sessions",
                text: "Every login starts from credentials so accounts are not selected automatically."
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
          New organization?{" "}
          <Link href="/register" className="font-semibold text-blue-700 transition hover:text-blue-800 hover:underline">
            Create Organization
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {errorMessage ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </div>
        ) : null}

        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">Institution Email</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition duration-200 placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
            placeholder="admin@institution.edu"
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
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 pr-12 text-slate-900 outline-none transition duration-200 placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
              placeholder="Enter your password"
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

        <div className="flex justify-end text-sm text-slate-600">
          <Link href="/forgot-password" className="font-medium text-blue-700 transition hover:text-blue-800 hover:underline">
            Forgot password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition duration-200 hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
        >
          {isLoading ? (
            <>
              <Loader2 className="animate-spin" size={18} />
              Signing in...
            </>
          ) : (
            "Sign In"
          )}
        </button>
      </form>
    </AuthShell>
  );
};

export default LoginPage;
