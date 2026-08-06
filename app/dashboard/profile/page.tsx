"use client";

import React, { useState } from "react";
import {
  AtSign,
  BookOpen,
  Building2,
  CalendarCheck,
  CheckCircle2,
  ClipboardList,
  Clock,
  Edit3,
  GraduationCap,
  KeyRound,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Save,
  Shield,
  Users,
  XCircle
} from "lucide-react";
import { useAuth, type UserStatus } from "@/contexts/AuthContext";
import { toast } from "sonner";

const statusMeta: Record<UserStatus, { label: string; tone: string; dot: string; icon: React.ComponentType<{ size?: number }> }> = {
  active: {
    label: "Active",
    tone: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500",
    icon: CheckCircle2
  },
  invited: {
    label: "Invited",
    tone: "bg-sky-50 text-sky-700 border-sky-200",
    dot: "bg-sky-500",
    icon: Shield
  },
  pending_approval: {
    label: "Pending Approval",
    tone: "bg-amber-50 text-amber-800 border-amber-200",
    dot: "bg-amber-500",
    icon: Clock
  },
  rejected: {
    label: "Rejected",
    tone: "bg-rose-50 text-rose-700 border-rose-200",
    dot: "bg-rose-500",
    icon: XCircle
  }
};

const roleLabel: Record<string, string> = {
  student: "Student",
  teacher: "Teacher",
  organizer: "Organizer / Admin"
};

const InfoRow: React.FC<{
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string | undefined | null;
  placeholder?: string;
  accent?: string;
}> = ({ icon: Icon, label, value, placeholder = "Not provided", accent = "text-slate-500" }) => (
  <div className="flex items-start gap-3">
    <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-50 ${accent}`}>
      <Icon size={16} />
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold text-ink">{value || placeholder}</p>
    </div>
  </div>
);

const ProfilePage: React.FC = () => {
  const { user, updateUserProfile, isLoading, forgotPassword } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || "");
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || "");
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [showRecovery, setShowRecovery] = useState(false);
  const [recoverySending, setRecoverySending] = useState(false);

  const status = user?.status || "pending_approval";
  const meta = statusMeta[status];
  const StatusIcon = meta.icon;
  const isStudent = user?.role === "student";
  const isTeacher = user?.role === "teacher";

  const initials = (user?.name || "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      await updateUserProfile({
        name: name.trim(),
        phoneNumber: phoneNumber.trim()
      });
      toast.success("Profile updated.");
      setIsEditing(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to update profile.";
      toast.error(message);
    }
  };

  const handleCancel = () => {
    setName(user?.name || "");
    setPhoneNumber(user?.phoneNumber || "");
    setIsEditing(false);
  };

  const handleSendRecovery = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      setRecoverySending(true);
      await forgotPassword(recoveryEmail.trim() || user?.email || "");
      toast.success("Password reset email sent.");
      setShowRecovery(false);
      setRecoveryEmail("");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to send reset email.";
      toast.error(message);
    } finally {
      setRecoverySending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-ocean">Account</p>
          <h1 className="mt-2 text-3xl font-black text-ink">Profile</h1>
          <p className="mt-1 text-slate-600">Manage your personal details and academic information.</p>
        </div>
        {!isEditing ? (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-ink shadow-sm transition hover:border-ocean hover:text-ocean"
          >
            <Edit3 size={16} />
            Edit Profile
          </button>
        ) : null}
      </div>

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="relative h-40 bg-gradient-to-br from-ocean via-blue-500 to-aqua sm:h-48">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.35),transparent_55%),radial-gradient(circle_at_80%_0%,rgba(255,255,255,0.25),transparent_50%)]" />
        </div>

        <div className="px-5 pb-6 sm:px-8">
          <div className="-mt-14 flex flex-col gap-5 sm:-mt-16 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
              <div className="relative">
                <div className="flex h-28 w-28 items-center justify-center rounded-3xl border-4 border-white bg-gradient-to-br from-ocean to-aqua text-3xl font-black text-white shadow-lg">
                  {initials}
                </div>
                <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-white shadow">
                  <span className={`h-3.5 w-3.5 rounded-full ${meta.dot}`} />
                </span>
              </div>

              <div className="pb-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-2xl font-black text-ink">{user?.name || "Unnamed User"}</h2>
                  <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${meta.tone}`}>
                    <StatusIcon size={13} />
                    {meta.label}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-600">
                    <GraduationCap size={13} />
                    {roleLabel[user?.role || "student"]}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
                  <span className="inline-flex items-center gap-1.5">
                    <Mail size={14} />
                    {user?.email}
                  </span>
                  {user?.rollNumber ? (
                    <span className="inline-flex items-center gap-1.5">
                      <ClipboardList size={14} />
                      Roll No. {user.rollNumber}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <form onSubmit={handleSave} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-ink">Personal Information</h3>
                <p className="mt-1 text-sm text-slate-600">Your core account details.</p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Full Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-ink outline-none transition focus:border-ocean focus:ring-4 focus:ring-blue-100"
                  />
                ) : (
                  <div className="mt-2 min-h-11 rounded-xl border border-slate-100 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-ink">
                    {user?.name || "Not provided"}
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Email Address</label>
                <div className="mt-2 inline-flex min-h-11 w-full items-center rounded-xl border border-slate-100 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-700">
                  <AtSign size={15} className="mr-2 text-slate-400" />
                  {user?.email}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Phone Number</label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-ink outline-none transition focus:border-ocean focus:ring-4 focus:ring-blue-100"
                  />
                ) : (
                  <div className="mt-2 min-h-11 rounded-xl border border-slate-100 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-ink">
                    {user?.phoneNumber || "Not provided"}
                  </div>
                )}
              </div>
            </div>

            {isEditing ? (
              <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-5">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-ocean px-5 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700 disabled:bg-blue-300"
                >
                  {isLoading ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-600 transition hover:border-slate-300 hover:text-ink"
                >
                  Cancel
                </button>
              </div>
            ) : null}
          </form>

          {(isStudent || isTeacher) ? (
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="inline-flex rounded-2xl bg-blue-50 p-3 text-ocean">
                  <GraduationCap size={20} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-black text-ink">Academic Allocation</h3>
                  <p className="mt-1 text-sm text-slate-600">Your department, semester, and class access scope.</p>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
                <InfoRow
                  icon={Building2}
                  label="Institution"
                  value={user?.institution}
                  accent="text-ocean"
                />
                <InfoRow
                  icon={MapPin}
                  label="Department"
                  value={user?.department}
                  accent="text-mint"
                />
                <InfoRow
                  icon={CalendarCheck}
                  label="Semester"
                  value={user?.semester}
                  accent="text-amber-500"
                />
                <InfoRow
                  icon={Users}
                  label={isTeacher ? "Allocated Class" : "Classroom"}
                  value={user?.classroomName}
                  accent="text-fuchsia-500"
                />
                {user?.classSection ? (
                  <InfoRow
                    icon={ClipboardList}
                    label="Section"
                    value={`Section ${user.classSection}`}
                    accent="text-emerald-600"
                  />
                ) : null}
                {user?.classJoinCode ? (
                  <InfoRow
                    icon={KeyRound}
                    label="Class Join Code"
                    value={user.classJoinCode}
                    accent="text-indigo-500"
                  />
                ) : null}
                {user?.subject ? (
                  <InfoRow
                    icon={BookOpen}
                    label="Subject"
                    value={user.subject}
                    accent="text-ocean"
                    placeholder="Not allocated"
                  />
                ) : null}
                {isStudent && user?.rollNumber ? (
                  <InfoRow
                    icon={ClipboardList}
                    label="Roll Number"
                    value={user.rollNumber}
                    accent="text-rose-500"
                  />
                ) : null}
              </div>

              {isStudent && user?.status === "pending_approval" ? (
                <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                  <div className="flex items-start gap-3">
                    <div className="rounded-xl bg-amber-100 p-2 text-amber-700">
                      <Clock size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-black text-amber-900">Class approval pending</p>
                      <p className="mt-1 text-sm leading-6 text-amber-800">
                        Your teacher or organizer will review your class request. Once approved, you can access subjects, study materials, assignments, and exams for your allocated class.
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}
            </section>
          ) : null}
        </div>

        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="inline-flex rounded-2xl bg-indigo-50 p-3 text-indigo-600">
                <Shield size={20} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-black text-ink">Security</h3>
                <p className="mt-1 text-sm text-slate-600">Keep your account safe.</p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-white p-2 text-ocean shadow-sm">
                    <KeyRound size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-ink">Password</p>
                    <p className="mt-0.5 truncate text-xs text-slate-500">Reset via email link</p>
                  </div>
                </div>
                {showRecovery ? (
                  <form onSubmit={handleSendRecovery} className="mt-4 space-y-3">
                    <input
                      type="email"
                      value={recoveryEmail}
                      onChange={(e) => setRecoveryEmail(e.target.value)}
                      placeholder={user?.email || "your@email.com"}
                      className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-ink outline-none transition focus:border-ocean focus:ring-4 focus:ring-blue-100"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="submit"
                        disabled={recoverySending}
                        className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-ocean px-4 py-2 text-sm font-bold text-white transition hover:bg-blue-700 disabled:bg-blue-300"
                      >
                        {recoverySending ? <Loader2 className="animate-spin" size={15} /> : null}
                        Send Link
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowRecovery(false);
                          setRecoveryEmail("");
                        }}
                        className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 transition hover:text-ink"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowRecovery(true)}
                    className="mt-4 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-ink transition hover:border-ocean hover:text-ocean"
                  >
                    <Mail size={15} />
                    Reset Password
                  </button>
                )}
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-white p-2 text-emerald-600 shadow-sm">
                    <Phone size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-ink">Contact</p>
                    <p className="mt-0.5 truncate text-xs text-slate-500">
                      {user?.phoneNumber ? "Number on file" : "Add a phone number"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-gradient-to-br from-ink to-slate-800 p-6 text-white shadow-sm">
            <h3 className="text-lg font-black">Need Help?</h3>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Reach out to your class teacher or institution organizer if you need changes to your department, semester, class, or roll number.
            </p>
            <div className="mt-5 rounded-2xl bg-white/5 p-4 text-sm text-slate-200 backdrop-blur">
              <p className="font-bold text-white">Account ID</p>
              <p className="mt-1 break-all font-mono text-xs text-slate-400">{user?.id}</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
