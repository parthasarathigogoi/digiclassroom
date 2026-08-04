"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Copy, Loader2, MailPlus, RefreshCw, Send } from "lucide-react";
import { toast } from "sonner";
import { type TeacherInvitation, useAuth } from "@/contexts/AuthContext";

const OrganizerTeachersPage: React.FC = () => {
  const { inviteTeacher, isLoading, listTeacherInvitations, user } = useAuth();
  const [activationLink, setActivationLink] = useState("");
  const [invitations, setInvitations] = useState<TeacherInvitation[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(true);
  const [formData, setFormData] = useState({
    teacherName: "",
    email: ""
  });
  const listTeacherInvitationsRef = useRef(listTeacherInvitations);

  useEffect(() => {
    listTeacherInvitationsRef.current = listTeacherInvitations;
  }, [listTeacherInvitations]);

  const invitationEmail = useMemo(() => {
    if (!activationLink || !formData.email) {
      return "";
    }

    const organizationName = user?.institution || "DigiClassroom";
    const subject = `You have been invited to join ${organizationName} on DigiClassroom`;
    const body = [
      `Hello ${formData.teacherName || "Teacher"},`,
      "",
      `You have been invited to join ${organizationName} on DigiClassroom.`,
      "",
      `Accept Invitation: ${activationLink}`,
      "",
      "After accepting the invitation and creating a password, your teacher account will be linked automatically."
    ].join("\n");

    return `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(formData.email)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }, [activationLink, formData.email, formData.teacherName, user?.institution]);

  const refreshInvitations = useCallback(async () => {
    setIsRefreshing(true);

    try {
      setInvitations(await listTeacherInvitationsRef.current());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to load teacher invitations.");
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void refreshInvitations();
  }, [refreshInvitations]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      const invitation = await inviteTeacher(formData);
      const link = `${window.location.origin}/teacher/invitation/${invitation.token}`;
      setActivationLink(link);
      setInvitations((current) => [invitation, ...current.filter((item) => item.id !== invitation.id)]);
      toast.success("Teacher invitation ready to send.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to send invitation.");
    }
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(activationLink);
    toast.success("Invitation link copied.");
  };

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-ocean">Teacher Management</p>
        <h1 className="mt-2 text-3xl font-black text-ink dark:text-white">Invite Teachers</h1>
        <p className="mt-1 text-slate-600 dark:text-slate-400">Teachers join your organization through Gmail invitations and create their own password.</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_0.65fr]">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Teacher Full Name</label>
              <input
                type="text"
                value={formData.teacherName}
                onChange={(event) => setFormData({ ...formData, teacherName: event.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100 dark:border-slate-800 dark:bg-slate-950"
                placeholder="Teacher full name"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Gmail Address</label>
              <input
                type="email"
                value={formData.email}
                onChange={(event) => setFormData({ ...formData, email: event.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100 dark:border-slate-800 dark:bg-slate-950"
                placeholder="teacher@gmail.com"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-xl bg-ocean px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:bg-blue-300"
          >
            {isLoading ? <Loader2 className="animate-spin" size={18} /> : <MailPlus size={18} />}
            Send Invitation
          </button>
        </form>
      </section>

      {activationLink ? (
        <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-100">
          <p className="font-black">Invitation ready</p>
          <p className="mt-2 text-sm leading-6">Share this accept-invitation link directly, or open Gmail with the message prepared.</p>
          <label className="mt-4 block text-xs font-black uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-200">Accept Invitation Link</label>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row">
            <input readOnly value={activationLink} className="min-w-0 flex-1 rounded-xl border border-emerald-200 bg-white px-4 py-3 text-sm text-slate-700" />
            <a href={invitationEmail} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-xl bg-ocean px-4 py-3 text-sm font-bold text-white">
              <Send size={16} />
              Send Email
            </a>
            <button type="button" onClick={copyLink} className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-bold text-white">
              <Copy size={16} />
              Copy
            </button>
          </div>
        </section>
      ) : null}
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-black text-ink dark:text-white">Teacher Invitation Status</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Pending teachers can join from the invitation email. Joined teachers are already active.</p>
          </div>
          <button type="button" onClick={refreshInvitations} disabled={isRefreshing} className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-800">
            <RefreshCw className={isRefreshing ? "animate-spin" : ""} size={16} />
            Refresh
          </button>
        </div>

        <div className="mt-5 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-slate-50 text-xs font-black uppercase tracking-[0.16em] text-slate-500 dark:bg-slate-950 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3">Teacher</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {invitations.length ? (
                invitations.map((invitation) => (
                  <tr key={invitation.id} className="bg-white dark:bg-slate-900">
                    <td className="px-4 py-4 font-bold text-ink dark:text-white">{invitation.teacherName}</td>
                    <td className="px-4 py-4 text-slate-600 dark:text-slate-300">
                      <a href={`mailto:${invitation.email}`} className="text-ocean hover:underline">{invitation.email}</a>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${invitation.status === "accepted" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                        {invitation.status === "accepted" ? "Joined" : "Pending"}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr className="bg-white dark:bg-slate-900">
                  <td colSpan={3} className="px-4 py-8 text-center text-sm font-medium text-slate-500">
                    {isRefreshing ? "Loading teacher invitations..." : "No teacher invitations yet."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default OrganizerTeachersPage;
