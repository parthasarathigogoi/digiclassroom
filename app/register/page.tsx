"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2, CheckCircle2, Eye, EyeOff, Loader2, Phone, School, ShieldCheck } from "lucide-react";
import AuthShell from "@/components/auth/AuthShell";
import { getDashboardRouteByRole, type InstitutionType, useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const RegisterPage: React.FC = () => {
  const router = useRouter();
  const { registerOrganizer, isLoading, user } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [formData, setFormData] = useState({
    fullName: "",
    institutionName: "",
    institutionType: "School" as InstitutionType,
    institutionEmail: "",
    phoneNumber: "",
    password: "",
    confirmPassword: ""
  });
  const institutionTypes: InstitutionType[] = ["School", "College", "University", "Coaching Centre", "Training Institute"];

  useEffect(() => {
    if (user) {
      router.replace(getDashboardRouteByRole(user.role));
    }
  }, [router, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    try {
      setErrorMessage("");
      await registerOrganizer({
        fullName: formData.fullName,
        institutionName: formData.institutionName,
        institutionType: formData.institutionType,
        institutionEmail: formData.institutionEmail,
        phoneNumber: formData.phoneNumber,
        password: formData.password
      });
      toast.success("Organization created successfully!");
      router.replace("/organizer/dashboard");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Registration failed. Please try again.";
      setErrorMessage(message);
      toast.error(message);
    }
  };

  return (
    <AuthShell
      title="Create your digital classroom"
      description="Create your organization workspace instantly and start managing DigiClassroom without admin approval."
      backLink={{ href: "/login", label: "Back to Sign In" }}
      sideContent={
        <>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-100">Organizer Sign Up</p>
            <h2 className="mt-4 text-4xl font-semibold leading-tight">Launch your organization workspace in one secure step.</h2>
          </div>

          <div className="grid gap-4">
            {[
              {
                icon: Building2,
                title: "Self-service setup",
                text: "Create the organization, owner account, and workspace automatically."
              },
              {
                icon: ShieldCheck,
                title: "Organizer ownership",
                text: "No Admin or Super Admin approval is required to start managing your institution."
              },
              {
                icon: CheckCircle2,
                title: "Instant dashboard access",
                text: "As soon as registration succeeds, you are taken straight to the Organizer Dashboard."
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
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-blue-700 transition hover:text-blue-800 hover:underline">
            Sign In
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

          <div className="space-y-2 sm:col-span-2">
            <label className="block text-sm font-medium text-slate-700">Institution Name</label>
            <input
              type="text"
              value={formData.institutionName}
              onChange={(e) => setFormData({ ...formData, institutionName: e.target.value })}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
              placeholder="DigiClassroom Academy"
              required
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <label className="block text-sm font-medium text-slate-700">Institution Type</label>
            <div className="relative">
              <School className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <select
                value={formData.institutionType}
                onChange={(e) => setFormData({ ...formData, institutionType: e.target.value as InstitutionType })}
                className="w-full appearance-none rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                required
              >
                {institutionTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">Institution Email</label>
            <input
              type="email"
              value={formData.institutionEmail}
              onChange={(e) => setFormData({ ...formData, institutionEmail: e.target.value })}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
              placeholder="admin@institution.edu"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">Phone Number</label>
            <div className="relative">
              <Phone className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="tel"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                placeholder="+91 98765 43210"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 pr-12 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                placeholder="Create a strong password"
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
              Creating organization...
            </>
          ) : (
            "Create Organization"
          )}
        </button>
      </form>
    </AuthShell>
  );
};

export default RegisterPage;
