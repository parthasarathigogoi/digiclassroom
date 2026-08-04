"use client";
import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, MailCheck, ShieldCheck } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import AuthShell from "@/components/auth/AuthShell";
import { toast } from "sonner";

const ForgotPasswordPage: React.FC = () => {
  const { forgotPassword, isLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [isEmailSent, setIsEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await forgotPassword(email);
      setIsEmailSent(true);
      toast.success("Password reset link sent to your email!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to send reset link. Please try again.");
    }
  };

  return (
    <AuthShell
      title="Reset your password"
      description={
        isEmailSent
          ? "Check your inbox for the reset link and follow the secure password reset steps."
          : "Enter your email address and we will send a secure reset link to help you sign back in."
      }
      backLink={{ href: "/login", label: "Back to Sign In" }}
      sideContent={
        <>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-100">Account Recovery</p>
            <h2 className="mt-4 text-4xl font-semibold leading-tight">Get back into DigiClassroom without the friction.</h2>
          </div>

          <div className="grid gap-4">
            {[
              {
                icon: ShieldCheck,
                title: "Secure by default",
                text: "Password resets are sent only to the email connected to your DigiClassroom account."
              },
              {
                icon: MailCheck,
                title: "Fast recovery",
                text: "Use the emailed link to choose a new password and return to your dashboard."
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
          Remembered your password?{" "}
          <Link href="/login" className="font-semibold text-blue-700 transition hover:text-blue-800 hover:underline">
            Return to Sign In
          </Link>
        </p>
      }
    >
      {!isEmailSent ? (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">Email address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
              placeholder="you@example.com"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                Sending...
              </>
            ) : (
              "Send Reset Link"
            )}
          </button>
        </form>
      ) : (
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 text-sm text-emerald-800">
          <div className="mb-3 inline-flex rounded-2xl bg-emerald-100 p-3 text-emerald-700">
            <ArrowLeft size={18} className="rotate-180" />
          </div>
          <p className="leading-7">
            We&apos;ve sent a password reset link to <span className="font-semibold">{email}</span>. Please check your inbox and follow the instructions.
          </p>
        </div>
      )}
    </AuthShell>
  );
};

export default ForgotPasswordPage;
