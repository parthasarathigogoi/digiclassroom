"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, ShieldCheck } from "lucide-react";

type AuthShellProps = {
  title: string;
  description: string;
  children: React.ReactNode;
  sideContent: React.ReactNode;
  footer?: React.ReactNode;
  backLink?: {
    href: string;
    label: string;
  };
};

const AuthShell: React.FC<AuthShellProps> = ({
  title,
  description,
  children,
  sideContent,
  footer,
  backLink
}) => {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top_left,#d8eeff_0%,#edf6ff_30%,#f8fbff_55%,#ffffff_100%)] px-4 py-10">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(59,130,246,0.08),transparent_42%,rgba(14,165,233,0.08))]" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="relative z-10 w-full max-w-6xl overflow-hidden rounded-[2rem] border border-white/60 bg-white/75 shadow-[0_30px_90px_rgba(37,99,235,0.16)] backdrop-blur-xl"
      >
        <div className="grid lg:grid-cols-[1.05fr_0.95fr]">
          <section className="bg-white/90 p-6 sm:p-8 lg:p-10">
            {backLink && (
              <Link
                href={backLink.href}
                className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-blue-700"
              >
                <ArrowLeft size={16} />
                {backLink.label}
              </Link>
            )}

            <Link href="/" className="mb-8 inline-flex items-center gap-3">
              <img src="/mylogo.jpeg" alt="DigiClassroom logo" className="h-12 w-auto rounded-2xl" />
              <div>
                <p className="text-lg font-semibold text-slate-900">DigiClassroom</p>
                <p className="text-sm text-slate-500">Smart access for every classroom role</p>
              </div>
            </Link>

            <div className="max-w-xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-blue-700">
                <ShieldCheck size={14} />
                Secure Access
              </div>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">{title}</h1>
              <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">{description}</p>
            </div>

            <div className="mt-8">{children}</div>

            {footer ? <div className="mt-8 border-t border-slate-100 pt-6">{footer}</div> : null}
          </section>

          <aside className="hidden bg-[linear-gradient(180deg,#0f4ae6_0%,#0e67f2_45%,#0ea5e9_100%)] p-10 text-white lg:flex lg:flex-col lg:justify-between">
            <div className="h-24 w-24 rounded-[2rem] border border-white/20 bg-white/10 backdrop-blur-sm" />
            <div className="space-y-6">{sideContent}</div>
          </aside>
        </div>
      </motion.div>
    </div>
  );
};

export default AuthShell;
