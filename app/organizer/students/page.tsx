"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Copy, GraduationCap, Loader2, MailPlus, RefreshCw, Send, UserCheck } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import {
  type AcademicClass,
  type AcademicDepartment,
  type AcademicSemester,
  type AcademicSubject,
  type StudentInvitation,
  useAuth
} from "@/contexts/AuthContext";

const OrganizerStudentsPage: React.FC = () => {
  const {
    inviteStudent,
    isLoading,
    listStudentInvitations,
    user,
    listDepartments,
    listSemesters,
    listAcademicClasses,
    listSubjects
  } = useAuth();
  const [activationLink, setActivationLink] = useState("");
  const [invitations, setInvitations] = useState<StudentInvitation[]>([]);
  const [departments, setDepartments] = useState<AcademicDepartment[]>([]);
  const [semesters, setSemesters] = useState<AcademicSemester[]>([]);
  const [classes, setClasses] = useState<AcademicClass[]>([]);
  const [subjects, setSubjects] = useState<AcademicSubject[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(true);
  const [formData, setFormData] = useState({
    studentName: "",
    rollNumber: "",
    email: "",
    departmentId: "",
    semesterId: "",
    classId: "",
    subjectIds: [] as string[]
  });
  const listStudentInvitationsRef = useRef(listStudentInvitations);
  const allocationLoadersRef = useRef({ listDepartments, listSemesters, listAcademicClasses, listSubjects });

  useEffect(() => {
    listStudentInvitationsRef.current = listStudentInvitations;
  }, [listStudentInvitations]);

  useEffect(() => {
    allocationLoadersRef.current = { listDepartments, listSemesters, listAcademicClasses, listSubjects };
  }, [listAcademicClasses, listDepartments, listSemesters, listSubjects]);

  const invitationEmail = useMemo(() => {
    if (!activationLink || !formData.email) {
      return "";
    }

    const organizationName = user?.institution || "DigiClassroom";
    const subject = `You have been invited to join ${organizationName} on DigiClassroom`;
    const body = [
      `Hello ${formData.studentName || "Student"},`,
      "",
      `You have been invited to join ${organizationName} on DigiClassroom.`,
      "",
      `Accept Invitation: ${activationLink}`,
      "",
      "After accepting the invitation and creating your password, your student account will be automatically created and linked to your allocated Department, Semester, Class, and Subjects."
    ].join("\n");

    return `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(formData.email)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }, [activationLink, formData.email, formData.studentName, user?.institution]);

  const refreshInvitations = useCallback(async () => {
    setIsRefreshing(true);

    try {
      const [nextInvitations, nextDepartments] = await Promise.all([
        listStudentInvitationsRef.current(),
        allocationLoadersRef.current.listDepartments()
      ]);

      const deptIds = nextDepartments.map((item) => item.id);
      const semestersByDept = await Promise.all(deptIds.map((deptId) => allocationLoadersRef.current.listSemesters(deptId)));
      const nextSemesters = semestersByDept
        .flat()
        .filter((item, index, arr) => arr.findIndex((o) => o.id === item.id) === index);

      const scopePairs = deptIds.flatMap((deptId) =>
        Array.from(new Set([null, ...nextSemesters.filter((s) => s.departmentId === deptId).map((s) => s.id)])).map((semId) => ({
          departmentId: deptId,
          semesterId: semId || undefined
        }))
      );

      const [nextClasses, nextSubjects] = await Promise.all([
        Promise.all(scopePairs.map((pair) => allocationLoadersRef.current.listAcademicClasses(pair))).then((results) =>
          results.flat().filter((item, index, arr) => arr.findIndex((o) => o.id === item.id) === index)
        ),
        Promise.all(scopePairs.map((pair) => allocationLoadersRef.current.listSubjects(pair))).then((results) =>
          results.flat().filter((item, index, arr) => arr.findIndex((o) => o.id === item.id) === index)
        )
      ]);

      setInvitations(nextInvitations);
      setDepartments(nextDepartments);
      setSemesters(nextSemesters);
      setClasses(nextClasses);
      setSubjects(nextSubjects);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to load student invitations.");
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
      const invitation = await inviteStudent(formData);
      const link = `${window.location.origin}/student/invitation/${invitation.token}`;
      setActivationLink(link);
      setInvitations((current) => [invitation, ...current.filter((item) => item.id !== invitation.id)]);
      setFormData({ studentName: "", rollNumber: "", email: "", departmentId: "", semesterId: "", classId: "", subjectIds: [] });
      toast.success("Student invitation ready to send.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to send invitation.");
    }
  };

  const toggleSubject = (subjectId: string) => {
    setFormData((current) => ({
      ...current,
      subjectIds: current.subjectIds.includes(subjectId)
        ? current.subjectIds.filter((id) => id !== subjectId)
        : [...current.subjectIds, subjectId]
    }));
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(activationLink);
    toast.success("Invitation link copied.");
  };

  const filteredSemesters = semesters.filter((s) => s.departmentId === formData.departmentId);
  const filteredClasses = classes.filter(
    (c) => c.departmentId === formData.departmentId && c.semesterId === formData.semesterId
  );
  const filteredSubjects = subjects.filter(
    (s) => s.departmentId === formData.departmentId && s.semesterId === formData.semesterId
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-ocean">Student Management</p>
          <h1 className="mt-2 text-3xl font-black text-ink dark:text-white">Invite Students</h1>
          <p className="mt-1 max-w-2xl text-slate-600 dark:text-slate-400">
            Invite students through Gmail and pre-assign their Department, Semester, Class / Section, and Subjects. Accepted invitations automatically create their account.
          </p>
        </div>
        <Link
          href="/organizer/students/pending"
          className="w-fit rounded-xl bg-ocean px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-700"
        >
          Review Pending Requests
        </Link>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_0.65fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Student Full Name</label>
                <input
                  type="text"
                  value={formData.studentName}
                  onChange={(event) => setFormData({ ...formData, studentName: event.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100 dark:border-slate-800 dark:bg-slate-950"
                  placeholder="Student full name"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Roll Number</label>
                <input
                  type="text"
                  value={formData.rollNumber}
                  onChange={(event) => setFormData({ ...formData, rollNumber: event.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100 dark:border-slate-800 dark:bg-slate-950"
                  placeholder="Roll / Enrollment number"
                  required
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Gmail Address</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(event) => setFormData({ ...formData, email: event.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100 dark:border-slate-800 dark:bg-slate-950"
                  placeholder="student@gmail.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
              <div className="flex items-center gap-2">
                <UserCheck className="text-ocean" size={18} />
                <p className="text-sm font-black uppercase tracking-[0.16em] text-ocean">Class Allocation</p>
              </div>
              <div className="grid gap-4 lg:grid-cols-3">
                <div className="space-y-2">
                  <label className="block text-xs font-black uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Department</label>
                  <select
                    required
                    value={formData.departmentId}
                    onChange={(event) =>
                      setFormData({
                        ...formData,
                        departmentId: event.target.value,
                        semesterId: "",
                        classId: "",
                        subjectIds: []
                      })
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-ocean dark:border-slate-800 dark:bg-slate-900"
                  >
                    <option value="">Select Department</option>
                    {departments.map((department) => (
                      <option key={department.id} value={department.id}>
                        {department.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-black uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Semester</label>
                  <select
                    required
                    value={formData.semesterId}
                    onChange={(event) =>
                      setFormData({
                        ...formData,
                        semesterId: event.target.value,
                        classId: "",
                        subjectIds: []
                      })
                    }
                    disabled={!formData.departmentId}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-ocean disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900"
                  >
                    <option value="">Select Semester</option>
                    {filteredSemesters.map((semester) => (
                      <option key={semester.id} value={semester.id}>
                        {semester.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-black uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Class / Section</label>
                  <select
                    required
                    value={formData.classId}
                    onChange={(event) => setFormData({ ...formData, classId: event.target.value })}
                    disabled={!formData.departmentId || !formData.semesterId}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-ocean disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900"
                  >
                    <option value="">Select Class</option>
                    {filteredClasses.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name} · {item.section}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-black uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Subjects (select at least one)</label>
                {filteredSubjects.length ? (
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredSubjects.map((subject) => {
                      const checked = formData.subjectIds.includes(subject.id);
                      return (
                        <label
                          key={subject.id}
                          className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition ${
                            checked
                              ? "border-ocean bg-ocean/10 text-ocean"
                              : "border-slate-200 bg-white hover:border-ocean/50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleSubject(subject.id)}
                            className="h-4 w-4 accent-ocean"
                          />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold">{subject.name}</p>
                            <p className="truncate text-[11px] text-slate-500">{subject.code}</p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                ) : (
                  <p className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
                    Select a Department and Semester to view available subjects.
                  </p>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || formData.subjectIds.length === 0}
              className="inline-flex items-center gap-2 rounded-xl bg-ocean px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:bg-blue-300"
            >
              {isLoading ? <Loader2 className="animate-spin" size={18} /> : <MailPlus size={18} />}
              Send Student Invitation
            </button>
          </form>
        </section>

        {activationLink ? (
          <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-100">
            <p className="font-black">Student invitation ready</p>
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
            <h2 className="text-xl font-black text-ink dark:text-white">Student Invitation Status</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Pending students can join from the invitation email. Accepted students are already active in their allocated class.</p>
          </div>
          <button type="button" onClick={refreshInvitations} disabled={isRefreshing} className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-800">
            <RefreshCw className={isRefreshing ? "animate-spin" : ""} size={16} />
            Refresh
          </button>
        </div>

        <div className="mt-5 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="bg-slate-50 text-xs font-black uppercase tracking-[0.16em] text-slate-500 dark:bg-slate-950 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3">Roll</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Class Allocation</th>
                <th className="px-4 py-3">Subjects</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {invitations.length ? (
                invitations.map((invitation) => (
                  <tr key={invitation.id} className="bg-white dark:bg-slate-900">
                    <td className="px-4 py-4 font-bold text-ink dark:text-white">{invitation.studentName}</td>
                    <td className="px-4 py-4 text-slate-600 dark:text-slate-300">{invitation.rollNumber || "—"}</td>
                    <td className="px-4 py-4 text-slate-600 dark:text-slate-300">
                      <a href={`mailto:${invitation.email}`} className="text-ocean hover:underline">{invitation.email}</a>
                    </td>
                    <td className="px-4 py-4 text-slate-600 dark:text-slate-300">
                      <div className="space-y-0.5">
                        <p className="font-semibold">{invitation.department}</p>
                        <p className="text-xs">{invitation.semester} · {invitation.classroomName} {invitation.classSection ? `· Sec ${invitation.classSection}` : ""}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-slate-600 dark:text-slate-300">
                      <div className="flex flex-wrap gap-1">
                        {invitation.subjects.map((subject) => (
                          <span key={subject} className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-ocean dark:bg-blue-950/50">
                            {subject}
                          </span>
                        ))}
                      </div>
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
                  <td colSpan={6} className="px-4 py-8 text-center text-sm font-medium text-slate-500">
                    {isRefreshing ? "Loading student invitations..." : "No student invitations yet."}
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

export default OrganizerStudentsPage;
