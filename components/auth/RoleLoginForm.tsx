"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpen, Building2, Eye, EyeOff, GraduationCap, Loader2, LockKeyhole, Users, type LucideIcon } from "lucide-react";
import AuthShell from "@/components/auth/AuthShell";
import { getDashboardRouteByRole, type UserRole, useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

type RoleLoginFormProps = {
  role: UserRole;
};

type RoleConfig = {
  title: string;
  description: string;
  eyebrow: string;
  heading: string;
  emailLabel: string;
  emailPlaceholder: string;
  icon: LucideIcon;
  supportText: string;
};

const roleConfig: Record<UserRole, RoleConfig> = {
  organizer: {
    title: "Organizer Sign In",
    description: "Sign in with your institution email to manage your organization workspace.",
    eyebrow: "Organization Portal",
    heading: "Manage your institution without any Admin approval.",
    emailLabel: "Institution Email",
    emailPlaceholder: "admin@institution.edu",
    icon: Building2,
    supportText: "New organization?"
  },
  teacher: {
    title: "Teacher Sign In",
    description: "Sign in with your invited Gmail account to open your teacher dashboard.",
    eyebrow: "Teacher Portal",
    heading: "Access classes, assignments, attendance, and student activity.",
    emailLabel: "Gmail Address",
    emailPlaceholder: "teacher@gmail.com",
    icon: Users,
    supportText: "Teachers join from organizer invitations."
  },
  student: {
    title: "Student Sign In",
    description: "Sign in after your class join request has been approved.",
    eyebrow: "Student Portal",
    heading: "Continue learning from your approved classroom workspace.",
    emailLabel: "Email Address",
    emailPlaceholder: "student@email.com",
    icon: GraduationCap,
    supportText: "Need classroom access?"
  }
};

const RoleLoginForm: React.FC<RoleLoginFormProps> = ({ role }) => {
  const config = roleConfig[role];
  const router = useRouter();
  const { login, isLoading, user } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: true
  });

  useEffect(() => {
    if (user) {
      router.replace(getDashboardRouteByRole(user.role));
    }
  }, [router, user]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      setErrorMessage("");
      const signedInUser = await login(formData.email, formData.password, formData.rememberMe, role);
      toast.success(`${config.title} successful.`);
      router.replace(getDashboardRouteByRole(signedInUser.role));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Login failed. Please try again.";
      setErrorMessage(message);
      toast.error(message);
    }
  };

  return (
    <AuthShell
      title={config.title}
      description={config.description}
      backLink={{ href: "/login", label: "Choose another role" }}
      sideContent={
        <>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-100">{config.eyebrow}</p>
            <h2 className="mt-4 text-4xl font-semibold leading-tight">{config.heading}</h2>
            <p className="mt-4 max-w-md text-base leading-7 text-blue-100/90">
              DigiClassroom routes every account to the correct dashboard based on its saved role.
            </p>
          </div>

          <div className="grid gap-4">
            {[
              {
                icon: config.icon,
                title: `${config.title.replace(" Sign In", "")} dashboard`,
                text: "A role-matched workspace loads after successful authentication."
              },
              {
                icon: LockKeyhole,
                title: "Role protected",
                text: "Using the wrong portal for an account shows an error instead of opening another role."
              },
              {
                icon: BookOpen,
                title: "Organization connected",
                text: "Teachers and students remain tied to the organization that invited or approved them."
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
        <div className="flex flex-col gap-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
          {role === "organizer" ? (
            <p>
              {config.supportText}{" "}
              <Link href="/register" className="font-semibold text-blue-700 transition hover:text-blue-800 hover:underline">
                Create Organization
              </Link>
            </p>
          ) : role === "student" ? (
            <p>
              {config.supportText}{" "}
              <Link href="/join-classroom" className="font-semibold text-blue-700 transition hover:text-blue-800 hover:underline">
                Join Classroom
              </Link>
            </p>
          ) : (
            <p>{config.supportText}</p>
          )}
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {errorMessage ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </div>
        ) : null}

        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">{config.emailLabel}</label>
          <input
            type="email"
            value={formData.email}
            onChange={(event) => setFormData({ ...formData, email: event.target.value })}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition duration-200 placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
            placeholder={config.emailPlaceholder}
            required
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">Password</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={(event) => setFormData({ ...formData, password: event.target.value })}
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

        <div className="flex flex-col gap-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
          <label className="inline-flex items-center gap-3">
            <input
              type="checkbox"
              checked={formData.rememberMe}
              onChange={(event) => setFormData({ ...formData, rememberMe: event.target.checked })}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span>Remember me</span>
          </label>

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

export default RoleLoginForm;
