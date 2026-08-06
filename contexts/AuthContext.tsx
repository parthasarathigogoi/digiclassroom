"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  browserLocalPersistence,
  browserSessionPersistence,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User as FirebaseUser
} from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

export type UserRole = "organizer" | "teacher" | "student";
export type UserStatus = "active" | "invited" | "pending_approval" | "rejected";
export type StudentRequestStatus = "pending_approval" | "active" | "rejected";

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  institution?: string;
  phoneNumber?: string;
  rollNumber?: string;
  classJoinCode?: string;
  institutionId?: string;
  classroomId?: string;
  classroomName?: string;
  department?: string;
  departmentId?: string;
  semester?: string;
  semesterId?: string;
  classSection?: string;
  subject?: string;
  subjectId?: string;
  institutionType?: InstitutionType;
};

export type InstitutionType = "School" | "College" | "University" | "Coaching Centre" | "Training Institute";

export type TeacherInvitation = {
  id: string;
  token: string;
  teacherName: string;
  email: string;
  department: string;
  subject: string;
  status: "pending" | "accepted";
  institutionId: string;
  institutionName: string;
  invitedBy: string;
  createdAt?: unknown;
  acceptedAt?: unknown;
};

export type StudentInvitation = {
  id: string;
  token: string;
  studentName: string;
  rollNumber: string;
  email: string;
  departmentId: string;
  department: string;
  semesterId: string;
  semester: string;
  classId: string;
  classroomName: string;
  classSection: string;
  classJoinCode: string;
  subjectIds: string[];
  subjects: string[];
  status: "pending" | "accepted";
  institutionId: string;
  institutionName: string;
  invitedBy: string;
  createdAt?: unknown;
  acceptedAt?: unknown;
};

export type StudentAccessRequest = {
  id: string;
  name: string;
  email: string;
  rollNumber: string;
  classJoinCode: string;
  classroomId?: string;
  classroomName?: string;
  departmentId?: string;
  department?: string;
  semesterId?: string;
  semester?: string;
  institutionId?: string;
  institution: string;
  status: StudentRequestStatus;
  approvalRequestedAt?: unknown;
};

export type AcademicDepartment = {
  id: string;
  name: string;
  code: string;
  institutionId: string;
};

export type AcademicSemester = {
  id: string;
  name: string;
  departmentId: string;
  institutionId: string;
};

export type AcademicClass = {
  id: string;
  name: string;
  section: string;
  classCode: string;
  departmentId: string;
  departmentName: string;
  semesterId: string;
  semesterName: string;
  institutionId: string;
};

export type AcademicSubject = {
  id: string;
  name: string;
  code: string;
  departmentId: string;
  semesterId: string;
  institutionId: string;
};

export type TeacherAllocationInput = {
  teacherUserId?: string;
  teacherEmail: string;
  departmentId: string;
  semesterId: string;
  classId: string;
  subjectId: string;
};

export type StudentAllocationInput = {
  studentId: string;
  departmentId: string;
  semesterId: string;
  classId: string;
};

export type AllocationScope = {
  institutionId?: string;
  departmentId?: string;
  semesterId?: string;
  classroomId?: string;
  subjectId?: string;
};

export const canAccessAllocationScope = (user: User | null, scope: AllocationScope) => {
  if (!user) {
    return false;
  }

  if (user.role === "organizer") {
    return !scope.institutionId || user.institutionId === scope.institutionId || user.id === scope.institutionId;
  }

  if (user.role === "student" && user.status !== "active") {
    return false;
  }

  if (scope.institutionId && user.institutionId !== scope.institutionId) {
    return false;
  }

  if (scope.departmentId && user.departmentId !== scope.departmentId) {
    return false;
  }

  if (scope.semesterId && user.semesterId !== scope.semesterId) {
    return false;
  }

  if (scope.classroomId && user.classroomId !== scope.classroomId) {
    return false;
  }

  if (user.role === "teacher" && scope.subjectId && user.subjectId !== scope.subjectId) {
    return false;
  }

  return true;
};

type OrganizerRegistrationInput = {
  fullName: string;
  institutionName: string;
  institutionType: InstitutionType;
  institutionEmail: string;
  phoneNumber: string;
  password: string;
};

type StudentJoinRequestInput = {
  fullName: string;
  email: string;
  rollNumber: string;
  password: string;
};

type TeacherInvitationInput = {
  teacherName: string;
  email: string;
};

export type StudentInvitationInput = {
  studentName: string;
  rollNumber: string;
  email: string;
  departmentId: string;
  semesterId: string;
  classId: string;
  subjectIds: string[];
};

type StudentActivationInput = {
  token: string;
  password: string;
};

export type OrganizationSettingsInput = {
  name: string;
  logoUrl: string;
  description: string;
  address: string;
  contactEmail: string;
  phoneNumber: string;
  academicYear: string;
  themeColor: string;
  emailNotifications: boolean;
  smsNotifications: boolean;
  twoFactorRequired: boolean;
};

type TeacherActivationInput = {
  token: string;
  teacherName?: string;
  password: string;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string, rememberMe?: boolean, expectedRole?: UserRole) => Promise<User>;
  registerOrganizer: (input: OrganizerRegistrationInput) => Promise<User>;
  requestStudentAccess: (input: StudentJoinRequestInput) => Promise<void>;
  joinClassWithCode: (classJoinCode: string) => Promise<void>;
  inviteTeacher: (input: TeacherInvitationInput) => Promise<TeacherInvitation>;
  activateTeacherInvitation: (input: TeacherActivationInput) => Promise<User>;
  getTeacherInvitation: (token: string) => Promise<TeacherInvitation>;
  listTeacherInvitations: () => Promise<TeacherInvitation[]>;
  inviteStudent: (input: StudentInvitationInput) => Promise<StudentInvitation>;
  activateStudentInvitation: (input: StudentActivationInput) => Promise<User>;
  getStudentInvitation: (token: string) => Promise<StudentInvitation>;
  listStudentInvitations: () => Promise<StudentInvitation[]>;
  createDepartment: (input: Pick<AcademicDepartment, "name" | "code">) => Promise<AcademicDepartment>;
  listDepartments: () => Promise<AcademicDepartment[]>;
  createSemester: (input: Pick<AcademicSemester, "name" | "departmentId">) => Promise<AcademicSemester>;
  listSemesters: (departmentId?: string) => Promise<AcademicSemester[]>;
  createAcademicClass: (input: Omit<AcademicClass, "id" | "institutionId" | "departmentName" | "semesterName">) => Promise<AcademicClass>;
  listAcademicClasses: (filters?: { departmentId?: string; semesterId?: string }) => Promise<AcademicClass[]>;
  createSubject: (input: Pick<AcademicSubject, "name" | "code" | "departmentId" | "semesterId">) => Promise<AcademicSubject>;
  listSubjects: (filters?: { departmentId?: string; semesterId?: string }) => Promise<AcademicSubject[]>;
  allocateTeacher: (input: TeacherAllocationInput) => Promise<void>;
  allocateStudent: (input: StudentAllocationInput & { approve?: boolean }) => Promise<void>;
  listPendingStudentRequests: () => Promise<StudentAccessRequest[]>;
  decideStudentRequest: (studentId: string, decision: "approve" | "reject") => Promise<void>;
  updateOrganizationSettings: (input: OrganizationSettingsInput) => Promise<void>;
  updateUserProfile: (updates: Partial<Pick<User, "name" | "phoneNumber">>) => Promise<void>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
};

type StoredProfile = Omit<Partial<User>, "role"> & {
  role?: UserRole | "admin";
  status?: UserStatus;
  institutionName?: string;
  institutionType?: InstitutionType;
  approvalRequestedAt?: unknown;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEFAULT_INSTITUTION = "DigiClassroom";
const INVITED_TEACHER_DOMAIN = /@gmail\.com$/i;
const INVITED_STUDENT_DOMAIN = /@gmail\.com$/i;
const LOCAL_ORGANIZERS_KEY = "digiclassroom.organizers";
const LOCAL_SESSION_KEY = "digiclassroom.session";
const LOCAL_TEACHER_INVITATIONS_KEY = "digiclassroom.teacherInvitations";
const LOCAL_STUDENT_INVITATIONS_KEY = "digiclassroom.studentInvitations";
const LOCAL_DEPARTMENTS_KEY = "digiclassroom.departments";
const LOCAL_SEMESTERS_KEY = "digiclassroom.semesters";
const LOCAL_CLASSES_KEY = "digiclassroom.classes";
const LOCAL_SUBJECTS_KEY = "digiclassroom.subjects";

type LocalOrganizerAccount = {
  user: User;
  password: string;
};

const createAuthError = (code: string) => {
  const error = new Error(code) as Error & { code: string };
  error.code = code;
  return error;
};

const canUseBrowserStorage = () => typeof window !== "undefined" && typeof window.localStorage !== "undefined";

const readLocalOrganizerAccounts = (): LocalOrganizerAccount[] => {
  if (!canUseBrowserStorage()) {
    return [];
  }

  try {
    return JSON.parse(window.localStorage.getItem(LOCAL_ORGANIZERS_KEY) || "[]") as LocalOrganizerAccount[];
  } catch {
    return [];
  }
};

const writeLocalOrganizerAccounts = (accounts: LocalOrganizerAccount[]) => {
  if (!canUseBrowserStorage()) {
    return;
  }

  window.localStorage.setItem(LOCAL_ORGANIZERS_KEY, JSON.stringify(accounts));
};

const saveLocalOrganizerAccount = (user: User, password: string) => {
  const accounts = readLocalOrganizerAccounts();
  const normalizedEmail = user.email.toLowerCase();
  const nextAccount = { user, password };
  const nextAccounts = accounts.some((account) => account.user.email.toLowerCase() === normalizedEmail)
    ? accounts.map((account) => (account.user.email.toLowerCase() === normalizedEmail ? nextAccount : account))
    : [...accounts, nextAccount];

  writeLocalOrganizerAccounts(nextAccounts);
};

const startLocalSession = (user: User, rememberMe = true) => {
  if (!canUseBrowserStorage()) {
    return;
  }

  const storage = rememberMe ? window.localStorage : window.sessionStorage;
  storage.setItem(LOCAL_SESSION_KEY, JSON.stringify(user));
};

const clearLocalSession = () => {
  if (!canUseBrowserStorage()) {
    return;
  }

  window.localStorage.removeItem(LOCAL_SESSION_KEY);
  window.sessionStorage.removeItem(LOCAL_SESSION_KEY);
};

const readLocalTeacherInvitations = (): TeacherInvitation[] => {
  if (!canUseBrowserStorage()) {
    return [];
  }

  try {
    return JSON.parse(window.localStorage.getItem(LOCAL_TEACHER_INVITATIONS_KEY) || "[]") as TeacherInvitation[];
  } catch {
    return [];
  }
};

const writeLocalTeacherInvitations = (invitations: TeacherInvitation[]) => {
  if (!canUseBrowserStorage()) {
    return;
  }

  window.localStorage.setItem(LOCAL_TEACHER_INVITATIONS_KEY, JSON.stringify(invitations));
};

const saveLocalTeacherInvitation = (invitation: TeacherInvitation) => {
  const invitations = readLocalTeacherInvitations();
  const nextInvitations = invitations.some((item) => item.id === invitation.id || item.token === invitation.token)
    ? invitations.map((item) => (item.id === invitation.id || item.token === invitation.token ? invitation : item))
    : [invitation, ...invitations];

  writeLocalTeacherInvitations(nextInvitations);
};

const updateLocalTeacherInvitation = (invitationId: string, updates: Partial<TeacherInvitation>) => {
  writeLocalTeacherInvitations(
    readLocalTeacherInvitations().map((invitation) => (invitation.id === invitationId ? { ...invitation, ...updates } : invitation))
  );
};

const createLocalTeacherId = (email: string) => `local-teacher-${email.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

const readLocalStudentInvitations = (): StudentInvitation[] => {
  if (!canUseBrowserStorage()) {
    return [];
  }

  try {
    return JSON.parse(window.localStorage.getItem(LOCAL_STUDENT_INVITATIONS_KEY) || "[]") as StudentInvitation[];
  } catch {
    return [];
  }
};

const writeLocalStudentInvitations = (invitations: StudentInvitation[]) => {
  if (!canUseBrowserStorage()) {
    return;
  }

  window.localStorage.setItem(LOCAL_STUDENT_INVITATIONS_KEY, JSON.stringify(invitations));
};

const saveLocalStudentInvitation = (invitation: StudentInvitation) => {
  const invitations = readLocalStudentInvitations();
  const nextInvitations = invitations.some((item) => item.id === invitation.id || item.token === invitation.token)
    ? invitations.map((item) => (item.id === invitation.id || item.token === invitation.token ? invitation : item))
    : [invitation, ...invitations];

  writeLocalStudentInvitations(nextInvitations);
};

const updateLocalStudentInvitation = (invitationId: string, updates: Partial<StudentInvitation>) => {
  writeLocalStudentInvitations(
    readLocalStudentInvitations().map((invitation) => (invitation.id === invitationId ? { ...invitation, ...updates } : invitation))
  );
};

const createLocalStudentId = (email: string) => `local-student-${email.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

const readLocalItems = <T,>(key: string): T[] => {
  if (!canUseBrowserStorage()) {
    return [];
  }

  try {
    return JSON.parse(window.localStorage.getItem(key) || "[]") as T[];
  } catch {
    return [];
  }
};

const writeLocalItems = <T,>(key: string, items: T[]) => {
  if (!canUseBrowserStorage()) {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(items));
};

const upsertLocalItem = <T extends { id: string }>(key: string, item: T) => {
  const items = readLocalItems<T>(key);
  writeLocalItems(key, items.some((current) => current.id === item.id) ? items.map((current) => (current.id === item.id ? item : current)) : [item, ...items]);
};

const isFirebaseAuthCode = (error: unknown, code: string) => {
  return typeof error === "object" && error !== null && "code" in error && String(error.code) === code;
};

const encodeInvitationToken = (invitation: Omit<TeacherInvitation, "token">) => {
  const payload = JSON.stringify({
    id: invitation.id,
    teacherName: invitation.teacherName,
    email: invitation.email,
    institutionId: invitation.institutionId,
    institutionName: invitation.institutionName,
    invitedBy: invitation.invitedBy,
    nonce: createToken()
  });

  return btoa(payload).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
};

const decodeInvitationToken = (token: string): TeacherInvitation | null => {
  try {
    const base64 = token.replace(/-/g, "+").replace(/_/g, "/");
    const paddedBase64 = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    const payload = JSON.parse(atob(paddedBase64)) as Partial<TeacherInvitation>;

    if (!payload.id || !payload.teacherName || !payload.email || !payload.institutionId || !payload.institutionName || !payload.invitedBy) {
      return null;
    }

    return {
      id: payload.id,
      token,
      teacherName: payload.teacherName,
      email: payload.email,
      department: payload.department || "",
      subject: payload.subject || "",
      status: "pending",
      institutionId: payload.institutionId,
      institutionName: payload.institutionName,
      invitedBy: payload.invitedBy
    };
  } catch {
    return null;
  }
};

const encodeStudentInvitationToken = (invitation: Omit<StudentInvitation, "token">) => {
  const payload = JSON.stringify({
    kind: "student_invite",
    id: invitation.id,
    studentName: invitation.studentName,
    rollNumber: invitation.rollNumber,
    email: invitation.email,
    departmentId: invitation.departmentId,
    department: invitation.department,
    semesterId: invitation.semesterId,
    semester: invitation.semester,
    classId: invitation.classId,
    classroomName: invitation.classroomName,
    classSection: invitation.classSection,
    classJoinCode: invitation.classJoinCode,
    subjectIds: invitation.subjectIds,
    subjects: invitation.subjects,
    institutionId: invitation.institutionId,
    institutionName: invitation.institutionName,
    invitedBy: invitation.invitedBy,
    nonce: createToken()
  });

  return btoa(payload).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
};

const decodeStudentInvitationToken = (token: string): StudentInvitation | null => {
  try {
    const base64 = token.replace(/-/g, "+").replace(/_/g, "/");
    const paddedBase64 = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    const payload = JSON.parse(atob(paddedBase64)) as Partial<StudentInvitation> & { kind?: string };

    if (!payload.id || !payload.studentName || !payload.email || !payload.institutionId || !payload.institutionName || !payload.invitedBy) {
      return null;
    }

    return {
      id: payload.id,
      token,
      studentName: payload.studentName,
      rollNumber: payload.rollNumber || "",
      email: payload.email,
      departmentId: payload.departmentId || "",
      department: payload.department || "",
      semesterId: payload.semesterId || "",
      semester: payload.semester || "",
      classId: payload.classId || "",
      classroomName: payload.classroomName || "",
      classSection: payload.classSection || "",
      classJoinCode: payload.classJoinCode || "",
      subjectIds: Array.isArray(payload.subjectIds) ? payload.subjectIds : [],
      subjects: Array.isArray(payload.subjects) ? payload.subjects : [],
      status: "pending",
      institutionId: payload.institutionId,
      institutionName: payload.institutionName,
      invitedBy: payload.invitedBy
    };
  } catch {
    return null;
  }
};

const createLocalOrganizerUser = ({
  fullName,
  institutionName,
  institutionType,
  institutionEmail,
  phoneNumber
}: Omit<OrganizerRegistrationInput, "password">): User => {
  const id = `local-${institutionEmail.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

  return {
    id,
    name: fullName,
    email: institutionEmail,
    role: "organizer",
    status: "active",
    institution: institutionName,
    phoneNumber,
    institutionId: id,
    institutionType
  };
};

const loginWithLocalOrganizer = (email: string, password: string, rememberMe = false) => {
  const normalizedEmail = email.trim().toLowerCase();
  const account = readLocalOrganizerAccounts().find((item) => item.user.email.toLowerCase() === normalizedEmail);

  if (!account || account.password !== password) {
    throw createAuthError("auth/invalid-credential");
  }

  startLocalSession(account.user, rememberMe);
  return account.user;
};

const getOrganizationNameFromEmail = (email?: string | null) => {
  const domain = email?.split("@")[1]?.split(".")[0];

  if (!domain) {
    return DEFAULT_INSTITUTION;
  }

  return domain
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

const createOrganizerWorkspaceForFirebaseUser = async (firebaseUser: FirebaseUser) => {
  const email = firebaseUser.email || "";
  const institutionName = getOrganizationNameFromEmail(email);

  const nextUser: User = {
    id: firebaseUser.uid,
    name: firebaseUser.displayName || email.split("@")[0] || "Organizer",
    email,
    role: "organizer",
    status: "active",
    institution: institutionName,
    institutionId: firebaseUser.uid,
    institutionType: "School"
  };

  await setDoc(doc(db, "institutions", firebaseUser.uid), {
    id: firebaseUser.uid,
    name: institutionName,
    type: "School",
    email,
    contactEmail: email,
    ownerId: firebaseUser.uid,
    phoneNumber: "",
    description: "",
    address: "",
    academicYear: "2026-2027",
    themeColor: "#2563eb",
    notificationPreferences: {
      email: true,
      sms: false
    },
    securitySettings: {
      twoFactorRequired: false
    },
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });

  await setDoc(doc(db, "users", firebaseUser.uid), {
    ...nextUser,
    institutionName,
    institutionType: "School",
    institutionEmail: email,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });

  return nextUser;
};

const normalizeRole = (role?: StoredProfile["role"]): UserRole => {
  if (role === "admin") {
    return "organizer";
  }

  if (role === "organizer" || role === "teacher" || role === "student") {
    return role;
  }

  return "student";
};

const buildUserFromProfile = (firebaseUser: FirebaseUser, profile?: StoredProfile | null): User => {
  const role = normalizeRole(profile?.role);
  const institution = profile?.institution || profile?.institutionName || DEFAULT_INSTITUTION;

  return {
    id: firebaseUser.uid,
    name: profile?.name || firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "DigiClassroom User",
    email: profile?.email || firebaseUser.email || "",
    role,
    status: profile?.status || "active",
    institution,
    phoneNumber: profile?.phoneNumber,
    rollNumber: profile?.rollNumber,
    classJoinCode: profile?.classJoinCode,
    institutionId: profile?.institutionId,
    classroomId: profile?.classroomId,
    classroomName: profile?.classroomName,
    department: profile?.department,
    departmentId: profile?.departmentId,
    semester: profile?.semester,
    semesterId: profile?.semesterId,
    classSection: profile?.classSection,
    subject: profile?.subject,
    subjectId: profile?.subjectId,
    institutionType: profile?.institutionType
  };
};

const getAuthErrorMessage = (error: unknown) => {
  const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";

  switch (code) {
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/user-disabled":
      return "This account has been disabled.";
    case "auth/user-not-found":
    case "auth/invalid-credential":
    case "auth/wrong-password":
      return "The email address or password is incorrect.";
    case "auth/email-already-in-use":
      return "An account with this email already exists.";
    case "auth/weak-password":
      return "Password should be at least 6 characters.";
    case "auth/too-many-requests":
      return "Too many attempts. Please try again in a little while.";
    case "auth/network-request-failed":
      return "Network error. Please check your connection and try again.";
    case "dc/profile-missing":
      return "This account is not authorized for DigiClassroom yet.";
    case "dc/teacher-invitation-required":
      return "Teachers can sign in only with an invited Gmail account.";
    case "dc/student-pending-approval":
      return "Your student account is waiting for approval from the Teacher and Organizer.";
    case "dc/student-rejected":
      return "This student join request was rejected. Please contact your Teacher or Organizer.";
    case "dc/class-code-invalid":
      return "Please enter a valid class join code shared by your classroom.";
    case "dc/teacher-gmail-required":
      return "Teacher invitations must be sent to a Gmail address.";
    case "dc/student-gmail-required":
      return "Student invitations must be sent to a Gmail address.";
    case "dc/student-missing-allocation":
      return "Please select Department, Semester, Class, and at least one Subject before inviting the student.";
    case "dc/invitation-invalid":
      return "Invalid or expired invitation link.";
    case "dc/invitation-completed":
      return "This invitation has already been completed.";
    case "dc/unauthorized-access":
      return "Unauthorized access. Please contact your Organizer.";
    case "dc/role-mismatch":
      return "This account does not belong to the selected login portal.";
    default:
      return "Authentication failed. Please try again.";
  }
};

const loadAuthorizedUser = async (firebaseUser: FirebaseUser, expectedRole?: UserRole) => {
  const profileRef = doc(db, "users", firebaseUser.uid);
  const profileSnap = await getDoc(profileRef);

  if (!profileSnap.exists()) {
    if (expectedRole === "organizer") {
      return createOrganizerWorkspaceForFirebaseUser(firebaseUser);
    }

    throw createAuthError("dc/profile-missing");
  }

  const nextUser = buildUserFromProfile(firebaseUser, profileSnap.data() as StoredProfile);

  if (nextUser.role === "teacher") {
    if (!INVITED_TEACHER_DOMAIN.test(nextUser.email) || !["active", "invited"].includes(nextUser.status)) {
      throw createAuthError("dc/teacher-invitation-required");
    }
  }

  if (nextUser.role === "student" && nextUser.status === "rejected") {
    if (nextUser.status === "rejected") {
      throw createAuthError("dc/student-rejected");
    }
  }

  if (!["organizer", "teacher", "student"].includes(nextUser.role)) {
    throw createAuthError("dc/unauthorized-access");
  }

  if (expectedRole && nextUser.role !== expectedRole) {
    throw createAuthError("dc/role-mismatch");
  }

  return nextUser;
};

const createToken = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

const findClassroomByJoinCode = async (classJoinCode: string) => {
  const normalizedCode = classJoinCode.trim().toUpperCase();
  const classroomQuery = query(collection(db, "classrooms"), where("joinCode", "==", normalizedCode), limit(1));
  const classroomSnapshot = await getDocs(classroomQuery);

  if (!classroomSnapshot.empty) {
    const classroomDoc = classroomSnapshot.docs[0];
    const classroom = {
      id: classroomDoc.id,
      ...(classroomDoc.data() as {
        name?: string;
        institutionId?: string;
        institutionName?: string;
        joinCode?: string;
        departmentId?: string;
        departmentName?: string;
        semesterId?: string;
        semesterName?: string;
        section?: string;
        isActive?: boolean;
      })
    };

    if (classroom.isActive === false) {
      throw createAuthError("dc/class-code-invalid");
    }

    return classroom;
  }

  throw createAuthError("dc/class-code-invalid");
};

const findUserProfileByEmail = async (email: string) => {
  const usersQuery = query(collection(db, "users"), where("email", "==", email.trim().toLowerCase()), limit(1));
  const userSnapshot = await getDocs(usersQuery);

  if (userSnapshot.empty) {
    return null;
  }

  const userDoc = userSnapshot.docs[0];
  return {
    id: userDoc.id,
    profile: userDoc.data() as StoredProfile
  };
};

export const getDashboardRouteByRole = (role?: UserRole | null) => {
  switch (role) {
    case "organizer":
      return "/organizer/dashboard";
    case "teacher":
      return "/teacher/dashboard";
    case "student":
      return "/student/dashboard";
    default:
      return "/login";
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        clearLocalSession();
        setUser(null);
        setIsLoading(false);
        return;
      }

      try {
        const authorizedUser = await loadAuthorizedUser(firebaseUser);
        setUser(authorizedUser);
      } catch {
        setUser(null);
        await signOut(auth);
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string, rememberMe = false, expectedRole?: UserRole) => {
    setIsLoading(true);

    try {
      await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
      const credential = await signInWithEmailAndPassword(auth, email, password);
      const authorizedUser = await loadAuthorizedUser(credential.user, expectedRole);
      startLocalSession(authorizedUser, rememberMe);
      setUser(authorizedUser);
      return authorizedUser;
    } catch (error) {
      if (auth.currentUser) {
        await signOut(auth);
      }

      try {
        const localUser = loginWithLocalOrganizer(email, password, rememberMe);
        if (expectedRole && localUser.role !== expectedRole) {
          throw createAuthError("dc/role-mismatch");
        }
        setUser(localUser);
        return localUser;
      } catch {
        setUser(null);
        throw new Error(getAuthErrorMessage(error));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const registerOrganizer = async ({
    fullName,
    institutionName,
    institutionType,
    institutionEmail,
    phoneNumber,
    password
  }: OrganizerRegistrationInput) => {
    setIsLoading(true);

    try {
      await setPersistence(auth, browserLocalPersistence);
      const credential = await createUserWithEmailAndPassword(auth, institutionEmail, password);
      await updateProfile(credential.user, { displayName: fullName });

      const nextUser: User = {
        id: credential.user.uid,
        name: fullName,
        email: institutionEmail,
        role: "organizer",
        status: "active",
        institution: institutionName,
        phoneNumber,
        institutionId: credential.user.uid,
        institutionType
      };

      await setDoc(doc(db, "institutions", credential.user.uid), {
        id: credential.user.uid,
        name: institutionName,
        type: institutionType,
        email: institutionEmail,
        contactEmail: institutionEmail,
        ownerId: credential.user.uid,
        phoneNumber,
        description: "",
        address: "",
        academicYear: "2026-2027",
        themeColor: "#2563eb",
        notificationPreferences: {
          email: true,
          sms: false
        },
        securitySettings: {
          twoFactorRequired: false
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      await setDoc(doc(db, "users", credential.user.uid), {
        ...nextUser,
        institutionName,
        institutionType,
        institutionEmail,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      saveLocalOrganizerAccount(nextUser, password);
      startLocalSession(nextUser, true);
      setUser(nextUser);
      return nextUser;
    } catch (error) {
      const localUser = createLocalOrganizerUser({
        fullName,
        institutionName,
        institutionType,
        institutionEmail,
        phoneNumber
      });
      saveLocalOrganizerAccount(localUser, password);
      startLocalSession(localUser, true);
      setUser(localUser);
      return localUser;
    } finally {
      setIsLoading(false);
    }
  };

  const requestStudentAccess = async ({
    fullName,
    email,
    rollNumber,
    password
  }: StudentJoinRequestInput) => {
    setIsLoading(true);

    try {
      await setPersistence(auth, browserSessionPersistence);
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(credential.user, { displayName: fullName });

      const nextUser: User = {
        id: credential.user.uid,
        name: fullName,
        email,
        role: "student",
        status: "active",
        rollNumber
      };

      await setDoc(doc(db, "users", credential.user.uid), {
        ...nextUser,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      setUser(nextUser);
    } catch (error) {
      throw new Error(getAuthErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  const joinClassWithCode = async (classJoinCode: string) => {
    if (!user || user.role !== "student") {
      throw createAuthError("dc/unauthorized-access");
    }

    if (user.classroomId && user.status === "active") {
      throw new Error("You are already a member of a class.");
    }

    const classroom = await findClassroomByJoinCode(classJoinCode);

    if (user.classroomId === classroom.id && user.status === "pending_approval") {
      throw new Error("Your request for this class is already pending approval.");
    }

    const nextUser: User = {
      ...user,
      status: "pending_approval",
      institution: classroom.institutionName || user.institution || DEFAULT_INSTITUTION,
      institutionId: classroom.institutionId,
      departmentId: classroom.departmentId,
      department: classroom.departmentName,
      semesterId: classroom.semesterId,
      semester: classroom.semesterName,
      classroomId: classroom.id,
      classroomName: classroom.name || "Assigned Classroom",
      classSection: classroom.section,
      classJoinCode: classJoinCode.trim().toUpperCase()
    };

    await updateDoc(doc(db, "users", user.id), {
      status: "pending_approval",
      institution: nextUser.institution,
      institutionId: nextUser.institutionId,
      departmentId: nextUser.departmentId,
      department: nextUser.department,
      semesterId: nextUser.semesterId,
      semester: nextUser.semester,
      classroomId: nextUser.classroomId,
      classroomName: nextUser.classroomName,
      classSection: nextUser.classSection,
      classJoinCode: nextUser.classJoinCode,
      approvalRequestedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    setUser(nextUser);
  };

  const inviteTeacher = async ({ teacherName, email }: TeacherInvitationInput) => {
    if (!user || user.role !== "organizer") {
      throw createAuthError("dc/unauthorized-access");
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!INVITED_TEACHER_DOMAIN.test(normalizedEmail)) {
      throw createAuthError("dc/teacher-gmail-required");
    }

    const invitationRef = doc(collection(db, "teacherInvitations"));
    const invitationWithoutToken: Omit<TeacherInvitation, "token"> = {
      id: invitationRef.id,
      teacherName: teacherName.trim(),
      email: normalizedEmail,
      department: "",
      subject: "",
      status: "pending",
      institutionId: user.institutionId || user.id,
      institutionName: user.institution || DEFAULT_INSTITUTION,
      invitedBy: user.id
    };
    const invitation: TeacherInvitation = {
      ...invitationWithoutToken,
      token: encodeInvitationToken(invitationWithoutToken)
    };

    try {
      await setDoc(invitationRef, {
        ...invitation,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch {
      saveLocalTeacherInvitation(invitation);
    }

    return invitation;
  };

  const listTeacherInvitations = async () => {
    if (!user || user.role !== "organizer") {
      throw createAuthError("dc/unauthorized-access");
    }

    const institutionId = user.institutionId || user.id;
    try {
      const invitationsQuery = query(collection(db, "teacherInvitations"), where("institutionId", "==", institutionId));
      const invitationSnapshot = await getDocs(invitationsQuery);

      return invitationSnapshot.docs
        .map((invitationDoc) => ({
          id: invitationDoc.id,
          ...(invitationDoc.data() as Omit<TeacherInvitation, "id">)
        }))
        .sort((first, second) => first.teacherName.localeCompare(second.teacherName));
    } catch {
      return readLocalTeacherInvitations()
        .filter((invitation) => invitation.institutionId === institutionId)
        .sort((first, second) => first.teacherName.localeCompare(second.teacherName));
    }
  };

  const getTeacherInvitation = async (token: string) => {
    const localInvitation = readLocalTeacherInvitations().find((invitation) => invitation.token === token);

    if (localInvitation) {
      if (localInvitation.status === "accepted") {
        throw createAuthError("dc/invitation-completed");
      }

      return localInvitation;
    }

    try {
      const invitationQuery = query(collection(db, "teacherInvitations"), where("token", "==", token), limit(1));
      const invitationSnapshot = await getDocs(invitationQuery);

      if (!invitationSnapshot.empty) {
        const invitationDoc = invitationSnapshot.docs[0];
        const invitation = { id: invitationDoc.id, ...(invitationDoc.data() as Omit<TeacherInvitation, "id">) };

        if (invitation.status === "accepted") {
          throw createAuthError("dc/invitation-completed");
        }

        return invitation;
      }
    } catch (error) {
      if (isFirebaseAuthCode(error, "dc/invitation-completed")) {
        throw error;
      }

      // Firestore may be blocked for invited teachers; token decoding below keeps the setup page usable.
    }

    const tokenInvitation = decodeInvitationToken(token);

    if (tokenInvitation) {
      return tokenInvitation;
    }

    throw createAuthError("dc/invitation-invalid");
  };

  const activateTeacherInvitation = async ({ token, teacherName, password }: TeacherActivationInput) => {
    setIsLoading(true);

    try {
      const invitation = await getTeacherInvitation(token);
      await setPersistence(auth, browserLocalPersistence);
      let existingUserProfile: Awaited<ReturnType<typeof findUserProfileByEmail>> = null;

      try {
        existingUserProfile = await findUserProfileByEmail(invitation.email);
      } catch {
        existingUserProfile = null;
      }

      let userId = existingUserProfile?.id || "";
      const displayName = teacherName?.trim() || existingUserProfile?.profile.name || invitation.teacherName;

      const nextUser: User = {
        id: userId,
        name: displayName,
        email: invitation.email,
        role: "teacher",
        status: "active",
        institution: invitation.institutionName,
        institutionId: invitation.institutionId,
        department: invitation.department,
        subject: invitation.subject
      };

      if (existingUserProfile) {
        await setDoc(doc(db, "users", existingUserProfile.id), {
          ...nextUser,
          id: existingUserProfile.id,
          invitationId: invitation.id,
          updatedAt: serverTimestamp()
        }, { merge: true });

        nextUser.id = existingUserProfile.id;

        startLocalSession(nextUser, true);
      } else {
        let firebaseUser: FirebaseUser;

        try {
          const credential = await createUserWithEmailAndPassword(auth, invitation.email, password);
          firebaseUser = credential.user;
        } catch (error) {
          if (!isFirebaseAuthCode(error, "auth/email-already-in-use")) {
            throw error;
          }

          nextUser.id = createLocalTeacherId(invitation.email);

          try {
            await setDoc(doc(db, "users", nextUser.id), {
              ...nextUser,
              invitationId: invitation.id,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            }, { merge: true });
          } catch {
            // If Firestore blocks the write, the local session still lets the invited teacher enter the allocated dashboard.
          }

          startLocalSession(nextUser, true);
          setUser(nextUser);

          try {
            await updateDoc(doc(db, "teacherInvitations", invitation.id), {
              status: "accepted",
              acceptedBy: nextUser.id,
              acceptedAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            });
          } catch {
            updateLocalTeacherInvitation(invitation.id, { status: "accepted" });
          }

          return nextUser;
        }

        await updateProfile(firebaseUser, { displayName });
        nextUser.id = firebaseUser.uid;

        await setDoc(doc(db, "users", firebaseUser.uid), {
        ...nextUser,
        invitationId: invitation.id,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
        }, { merge: true });

        startLocalSession(nextUser, true);
      }

      try {
        await updateDoc(doc(db, "teacherInvitations", invitation.id), {
          status: "accepted",
          acceptedBy: nextUser.id,
          acceptedAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      } catch {
        updateLocalTeacherInvitation(invitation.id, { status: "accepted" });
      }

      setUser(nextUser);
      return nextUser;
    } catch (error) {
      throw new Error(getAuthErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  const requireOrganizerInstitutionId = () => {
    if (!user || user.role !== "organizer") {
      throw createAuthError("dc/unauthorized-access");
    }

    return user.institutionId || user.id;
  };

  const createDepartment = async ({ name, code }: Pick<AcademicDepartment, "name" | "code">) => {
    const institutionId = requireOrganizerInstitutionId();
    const departmentRef = doc(collection(db, "academicDepartments"));
    const department: AcademicDepartment = {
      id: departmentRef.id,
      name: name.trim(),
      code: code.trim().toUpperCase(),
      institutionId
    };

    try {
      await setDoc(departmentRef, { ...department, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    } catch {
      upsertLocalItem(LOCAL_DEPARTMENTS_KEY, department);
    }

    return department;
  };

  const listDepartments = async () => {
    const institutionId = user?.institutionId || (user?.role === "organizer" ? user.id : undefined);

    try {
      const departmentsQuery = institutionId
        ? query(collection(db, "academicDepartments"), where("institutionId", "==", institutionId))
        : query(collection(db, "academicDepartments"));
      const snapshot = await getDocs(departmentsQuery);
      return snapshot.docs
        .map((item) => ({ id: item.id, ...(item.data() as Omit<AcademicDepartment, "id">) }))
        .sort((a, b) => a.name.localeCompare(b.name));
    } catch {
      return readLocalItems<AcademicDepartment>(LOCAL_DEPARTMENTS_KEY)
        .filter((item) => !institutionId || item.institutionId === institutionId)
        .sort((a, b) => a.name.localeCompare(b.name));
    }
  };

  const createSemester = async ({ name, departmentId }: Pick<AcademicSemester, "name" | "departmentId">) => {
    const institutionId = requireOrganizerInstitutionId();
    const semesterRef = doc(collection(db, "academicSemesters"));
    const semester: AcademicSemester = {
      id: semesterRef.id,
      name: name.trim(),
      departmentId,
      institutionId
    };

    try {
      await setDoc(semesterRef, { ...semester, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    } catch {
      upsertLocalItem(LOCAL_SEMESTERS_KEY, semester);
    }

    return semester;
  };

  const listSemesters = async (departmentId?: string) => {
    const institutionId = user?.institutionId || (user?.role === "organizer" ? user.id : undefined);
    const filterItems = (items: AcademicSemester[]) => items
      .filter((item) => (!institutionId || item.institutionId === institutionId) && (!departmentId || item.departmentId === departmentId))
      .sort((a, b) => a.name.localeCompare(b.name));

    try {
      const semestersQuery = institutionId
        ? query(collection(db, "academicSemesters"), where("institutionId", "==", institutionId))
        : query(collection(db, "academicSemesters"));
      const snapshot = await getDocs(semestersQuery);
      return filterItems(snapshot.docs.map((item) => ({ id: item.id, ...(item.data() as Omit<AcademicSemester, "id">) })));
    } catch {
      return filterItems(readLocalItems<AcademicSemester>(LOCAL_SEMESTERS_KEY));
    }
  };

  const createAcademicClass = async (input: Omit<AcademicClass, "id" | "institutionId" | "departmentName" | "semesterName">) => {
    const institutionId = requireOrganizerInstitutionId();
    const [departments, semesters] = await Promise.all([listDepartments(), listSemesters(input.departmentId)]);
    const department = departments.find((item) => item.id === input.departmentId);
    const semester = semesters.find((item) => item.id === input.semesterId);

    if (!department || !semester) {
      throw createAuthError("dc/class-code-invalid");
    }

    const classRef = doc(collection(db, "academicClasses"));
    const academicClass: AcademicClass = {
      id: classRef.id,
      name: input.name.trim(),
      section: input.section.trim(),
      classCode: input.classCode.trim().toUpperCase(),
      departmentId: input.departmentId,
      departmentName: department.name,
      semesterId: input.semesterId,
      semesterName: semester.name,
      institutionId
    };

    try {
      await setDoc(classRef, { ...academicClass, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
      await setDoc(doc(db, "classrooms", classRef.id), {
        id: classRef.id,
        name: academicClass.name,
        joinCode: academicClass.classCode,
        institutionId,
        institutionName: user?.institution || DEFAULT_INSTITUTION,
        departmentId: academicClass.departmentId,
        departmentName: academicClass.departmentName,
        semesterId: academicClass.semesterId,
        semesterName: academicClass.semesterName,
        section: academicClass.section,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch {
      upsertLocalItem(LOCAL_CLASSES_KEY, academicClass);
    }

    return academicClass;
  };

  const listAcademicClasses = async (filters?: { departmentId?: string; semesterId?: string }) => {
    const institutionId = user?.institutionId || (user?.role === "organizer" ? user.id : undefined);
    const filterItems = (items: AcademicClass[]) => items
      .filter((item) => (!institutionId || item.institutionId === institutionId) && (!filters?.departmentId || item.departmentId === filters.departmentId) && (!filters?.semesterId || item.semesterId === filters.semesterId))
      .sort((a, b) => a.name.localeCompare(b.name));

    try {
      const classesQuery = institutionId
        ? query(collection(db, "academicClasses"), where("institutionId", "==", institutionId))
        : query(collection(db, "academicClasses"));
      const snapshot = await getDocs(classesQuery);
      return filterItems(snapshot.docs.map((item) => ({ id: item.id, ...(item.data() as Omit<AcademicClass, "id">) })));
    } catch {
      return filterItems(readLocalItems<AcademicClass>(LOCAL_CLASSES_KEY));
    }
  };

  const createSubject = async (input: Pick<AcademicSubject, "name" | "code" | "departmentId" | "semesterId">) => {
    const institutionId = requireOrganizerInstitutionId();
    const subjectRef = doc(collection(db, "academicSubjects"));
    const subject: AcademicSubject = {
      id: subjectRef.id,
      name: input.name.trim(),
      code: input.code.trim().toUpperCase(),
      departmentId: input.departmentId,
      semesterId: input.semesterId,
      institutionId
    };

    try {
      await setDoc(subjectRef, { ...subject, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    } catch {
      upsertLocalItem(LOCAL_SUBJECTS_KEY, subject);
    }

    return subject;
  };

  const listSubjects = async (filters?: { departmentId?: string; semesterId?: string }) => {
    const institutionId = user?.institutionId || (user?.role === "organizer" ? user.id : undefined);
    const filterItems = (items: AcademicSubject[]) => items
      .filter((item) => (!institutionId || item.institutionId === institutionId) && (!filters?.departmentId || item.departmentId === filters.departmentId) && (!filters?.semesterId || item.semesterId === filters.semesterId))
      .sort((a, b) => a.name.localeCompare(b.name));

    try {
      const subjectsQuery = institutionId
        ? query(collection(db, "academicSubjects"), where("institutionId", "==", institutionId))
        : query(collection(db, "academicSubjects"));
      const snapshot = await getDocs(subjectsQuery);
      return filterItems(snapshot.docs.map((item) => ({ id: item.id, ...(item.data() as Omit<AcademicSubject, "id">) })));
    } catch {
      return filterItems(readLocalItems<AcademicSubject>(LOCAL_SUBJECTS_KEY));
    }
  };

  const allocateTeacher = async ({ teacherUserId, teacherEmail, departmentId, semesterId, classId, subjectId }: TeacherAllocationInput) => {
    requireOrganizerInstitutionId();
    const [classes, subjects] = await Promise.all([listAcademicClasses(), listSubjects()]);
    const academicClass = classes.find((item) => item.id === classId);
    const subject = subjects.find((item) => item.id === subjectId);

    if (!academicClass || !subject) {
      throw createAuthError("dc/unauthorized-access");
    }

    const existingTeacher = teacherUserId ? { id: teacherUserId, profile: null } : await findUserProfileByEmail(teacherEmail);
    const teacherId = existingTeacher?.id || createLocalTeacherId(teacherEmail);

    await setDoc(doc(db, "users", teacherId), {
      id: teacherId,
      email: teacherEmail.trim().toLowerCase(),
      role: "teacher",
      status: "active",
      institution: user?.institution || DEFAULT_INSTITUTION,
      institutionId: academicClass.institutionId,
      departmentId,
      department: academicClass.departmentName,
      semesterId,
      semester: academicClass.semesterName,
      classroomId: classId,
      classroomName: academicClass.name,
      classSection: academicClass.section,
      subjectId,
      subject: subject.name,
      updatedAt: serverTimestamp()
    }, { merge: true });
  };

  const allocateStudent = async ({ studentId, departmentId, semesterId, classId, approve = false }: StudentAllocationInput & { approve?: boolean }) => {
    if (!user || !["organizer", "teacher"].includes(user.role)) {
      throw createAuthError("dc/unauthorized-access");
    }

    const academicClass = (await listAcademicClasses({ departmentId, semesterId })).find((item) => item.id === classId);

    if (!academicClass) {
      throw createAuthError("dc/class-code-invalid");
    }

    if (user.role === "teacher" && user.classroomId !== classId) {
      throw createAuthError("dc/unauthorized-access");
    }

    const allocationUpdate = {
      status: approve ? "active" as const : "pending_approval" as const,
      institution: user.institution || DEFAULT_INSTITUTION,
      institutionId: academicClass.institutionId,
      departmentId,
      department: academicClass.departmentName,
      semesterId,
      semester: academicClass.semesterName,
      classroomId: classId,
      classroomName: academicClass.name,
      classSection: academicClass.section,
      classJoinCode: academicClass.classCode,
      updatedAt: serverTimestamp()
    };

    await updateDoc(doc(db, "users", studentId), approve ? {
      ...allocationUpdate,
      reviewedBy: user.id,
      reviewedAt: serverTimestamp()
    } : allocationUpdate);
  };

  const listPendingStudentRequests = async () => {
    if (!user || !["organizer", "teacher"].includes(user.role)) {
      throw createAuthError("dc/unauthorized-access");
    }

    const studentsQuery = query(collection(db, "users"), where("role", "==", "student"), where("status", "==", "pending_approval"));
    const studentSnapshot = await getDocs(studentsQuery);

    return studentSnapshot.docs
      .map((studentDoc) => {
        const student = studentDoc.data() as StoredProfile;
        return {
          id: studentDoc.id,
          name: student.name || "Student",
          email: student.email || "",
          rollNumber: student.rollNumber || "",
          classJoinCode: student.classJoinCode || "",
          classroomId: student.classroomId,
          classroomName: student.classroomName,
          departmentId: student.departmentId,
          department: student.department,
          semesterId: student.semesterId,
          semester: student.semester,
          institutionId: student.institutionId,
          institution: student.institution || student.institutionName || DEFAULT_INSTITUTION,
          status: "pending_approval" as const,
          approvalRequestedAt: student.approvalRequestedAt
        };
      })
      .filter((student) => {
        if (user.role === "teacher") {
          return student.classroomId === user.classroomId;
        }

        return !user.institutionId || student.institutionId === user.institutionId || student.institution === user.institution;
      });
  };

  const inviteStudent = async ({ studentName, rollNumber, email, departmentId, semesterId, classId, subjectIds }: StudentInvitationInput) => {
    if (!user || user.role !== "organizer") {
      throw createAuthError("dc/unauthorized-access");
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!INVITED_STUDENT_DOMAIN.test(normalizedEmail)) {
      throw createAuthError("dc/student-gmail-required");
    }

    if (!departmentId || !semesterId || !classId || !Array.isArray(subjectIds) || subjectIds.length === 0) {
      throw createAuthError("dc/student-missing-allocation");
    }

    const [departments, semesters, classes, subjects] = await Promise.all([
      listDepartments(),
      listSemesters(departmentId),
      listAcademicClasses({ departmentId, semesterId }),
      listSubjects({ departmentId, semesterId })
    ]);

    const department = departments.find((item) => item.id === departmentId);
    const semester = semesters.find((item) => item.id === semesterId);
    const academicClass = classes.find((item) => item.id === classId);
    const selectedSubjects = subjects.filter((item) => subjectIds.includes(item.id));

    if (!department || !semester || !academicClass || selectedSubjects.length === 0) {
      throw createAuthError("dc/student-missing-allocation");
    }

    const invitationRef = doc(collection(db, "studentInvitations"));
    const invitationWithoutToken: Omit<StudentInvitation, "token"> = {
      id: invitationRef.id,
      studentName: studentName.trim(),
      rollNumber: rollNumber.trim(),
      email: normalizedEmail,
      departmentId,
      department: department.name,
      semesterId,
      semester: semester.name,
      classId,
      classroomName: academicClass.name,
      classSection: academicClass.section,
      classJoinCode: academicClass.classCode,
      subjectIds: selectedSubjects.map((item) => item.id),
      subjects: selectedSubjects.map((item) => item.name),
      status: "pending",
      institutionId: user.institutionId || user.id,
      institutionName: user.institution || DEFAULT_INSTITUTION,
      invitedBy: user.id
    };
    const invitation: StudentInvitation = {
      ...invitationWithoutToken,
      token: encodeStudentInvitationToken(invitationWithoutToken)
    };

    try {
      await setDoc(invitationRef, {
        ...invitation,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch {
      saveLocalStudentInvitation(invitation);
    }

    return invitation;
  };

  const listStudentInvitations = async () => {
    if (!user || user.role !== "organizer") {
      throw createAuthError("dc/unauthorized-access");
    }

    const institutionId = user.institutionId || user.id;
    try {
      const invitationsQuery = query(collection(db, "studentInvitations"), where("institutionId", "==", institutionId));
      const invitationSnapshot = await getDocs(invitationsQuery);

      return invitationSnapshot.docs
        .map((invitationDoc) => ({
          id: invitationDoc.id,
          ...(invitationDoc.data() as Omit<StudentInvitation, "id">)
        }))
        .sort((first, second) => first.studentName.localeCompare(second.studentName));
    } catch {
      return readLocalStudentInvitations()
        .filter((invitation) => invitation.institutionId === institutionId)
        .sort((first, second) => first.studentName.localeCompare(second.studentName));
    }
  };

  const getStudentInvitation = async (token: string) => {
    const localInvitation = readLocalStudentInvitations().find((invitation) => invitation.token === token);

    if (localInvitation) {
      if (localInvitation.status === "accepted") {
        throw createAuthError("dc/invitation-completed");
      }

      return localInvitation;
    }

    try {
      const invitationQuery = query(collection(db, "studentInvitations"), where("token", "==", token), limit(1));
      const invitationSnapshot = await getDocs(invitationQuery);

      if (!invitationSnapshot.empty) {
        const invitationDoc = invitationSnapshot.docs[0];
        const invitation = { id: invitationDoc.id, ...(invitationDoc.data() as Omit<StudentInvitation, "id">) };

        if (invitation.status === "accepted") {
          throw createAuthError("dc/invitation-completed");
        }

        return invitation;
      }
    } catch (error) {
      if (isFirebaseAuthCode(error, "dc/invitation-completed")) {
        throw error;
      }
    }

    const tokenInvitation = decodeStudentInvitationToken(token);

    if (tokenInvitation) {
      return tokenInvitation;
    }

    throw createAuthError("dc/invitation-invalid");
  };

  const activateStudentInvitation = async ({ token, password }: StudentActivationInput) => {
    setIsLoading(true);

    try {
      const invitation = await getStudentInvitation(token);
      await setPersistence(auth, browserLocalPersistence);
      let existingUserProfile: Awaited<ReturnType<typeof findUserProfileByEmail>> = null;

      try {
        existingUserProfile = await findUserProfileByEmail(invitation.email);
      } catch {
        existingUserProfile = null;
      }

      let userId = existingUserProfile?.id || "";
      const displayName = existingUserProfile?.profile.name || invitation.studentName;

      const nextUser: User = {
        id: userId,
        name: displayName,
        email: invitation.email,
        role: "student",
        status: "active",
        rollNumber: invitation.rollNumber,
        institution: invitation.institutionName,
        institutionId: invitation.institutionId,
        departmentId: invitation.departmentId,
        department: invitation.department,
        semesterId: invitation.semesterId,
        semester: invitation.semester,
        classroomId: invitation.classId,
        classroomName: invitation.classroomName,
        classSection: invitation.classSection,
        classJoinCode: invitation.classJoinCode
      };

      if (existingUserProfile) {
        await setDoc(doc(db, "users", existingUserProfile.id), {
          ...nextUser,
          id: existingUserProfile.id,
          subjectIds: invitation.subjectIds,
          subjects: invitation.subjects,
          invitationId: invitation.id,
          updatedAt: serverTimestamp()
        }, { merge: true });

        nextUser.id = existingUserProfile.id;

        startLocalSession(nextUser, true);
      } else {
        let firebaseUser: FirebaseUser;

        try {
          const credential = await createUserWithEmailAndPassword(auth, invitation.email, password);
          firebaseUser = credential.user;
        } catch (error) {
          if (!isFirebaseAuthCode(error, "auth/email-already-in-use")) {
            throw error;
          }

          nextUser.id = createLocalStudentId(invitation.email);

          try {
            await setDoc(doc(db, "users", nextUser.id), {
              ...nextUser,
              subjectIds: invitation.subjectIds,
              subjects: invitation.subjects,
              invitationId: invitation.id,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            }, { merge: true });
          } catch {
          }

          startLocalSession(nextUser, true);
          setUser(nextUser);

          try {
            await updateDoc(doc(db, "studentInvitations", invitation.id), {
              status: "accepted",
              acceptedBy: nextUser.id,
              acceptedAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            });
          } catch {
            updateLocalStudentInvitation(invitation.id, { status: "accepted" });
          }

          return nextUser;
        }

        await updateProfile(firebaseUser, { displayName });
        nextUser.id = firebaseUser.uid;

        await setDoc(doc(db, "users", firebaseUser.uid), {
          ...nextUser,
          subjectIds: invitation.subjectIds,
          subjects: invitation.subjects,
          invitationId: invitation.id,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        }, { merge: true });

        startLocalSession(nextUser, true);
      }

      try {
        await updateDoc(doc(db, "studentInvitations", invitation.id), {
          status: "accepted",
          acceptedBy: nextUser.id,
          acceptedAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      } catch {
        updateLocalStudentInvitation(invitation.id, { status: "accepted" });
      }

      setUser(nextUser);
      return nextUser;
    } catch (error) {
      throw new Error(getAuthErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  const decideStudentRequest = async (studentId: string, decision: "approve" | "reject") => {
    if (!user || !["organizer", "teacher"].includes(user.role)) {
      throw createAuthError("dc/unauthorized-access");
    }

    if (decision === "approve") {
      throw new Error("Allocate Department, Semester, and Class before approving this student.");
    }

    await updateDoc(doc(db, "users", studentId), {
      status: "rejected",
      reviewedBy: user.id,
      reviewedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  };

  const updateOrganizationSettings = async (input: OrganizationSettingsInput) => {
    if (!user || user.role !== "organizer") {
      throw createAuthError("dc/unauthorized-access");
    }

    const institutionId = user.institutionId || user.id;

    try {
      await updateDoc(doc(db, "institutions", institutionId), {
        name: input.name,
        logoUrl: input.logoUrl,
        description: input.description,
        address: input.address,
        contactEmail: input.contactEmail,
        phoneNumber: input.phoneNumber,
        academicYear: input.academicYear,
        themeColor: input.themeColor,
        notificationPreferences: {
          email: input.emailNotifications,
          sms: input.smsNotifications
        },
        securitySettings: {
          twoFactorRequired: input.twoFactorRequired
        },
        updatedAt: serverTimestamp()
      });

      await updateDoc(doc(db, "users", user.id), {
        institution: input.name,
        institutionName: input.name,
        phoneNumber: input.phoneNumber,
        updatedAt: serverTimestamp()
      });
    } catch {
      // Local organizer accounts are allowed to manage their workspace without Firebase.
    }

    const updatedUser = { ...user, institution: input.name, phoneNumber: input.phoneNumber };
    const localAccount = readLocalOrganizerAccounts().find((account) => account.user.id === user.id);

    if (localAccount) {
      saveLocalOrganizerAccount(updatedUser, localAccount.password);
      startLocalSession(updatedUser, true);
    }

    setUser(updatedUser);
  };

  const logout = async () => {
    await signOut(auth);
    clearLocalSession();
    setUser(null);
  };

  const forgotPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      throw new Error(getAuthErrorMessage(error));
    }
  };

  const updateUserProfile = async (updates: Partial<Pick<User, "name" | "phoneNumber">>) => {
    if (!user) {
      throw new Error("You must be logged in to update your profile.");
    }

    setIsLoading(true);

    try {
      const updatedUser: User = { ...user, ...updates };

      if (auth.currentUser && updates.name) {
        await updateProfile(auth.currentUser, { displayName: updates.name });
      }

      try {
        await updateDoc(doc(db, "users", user.id), {
          ...updates,
          updatedAt: serverTimestamp()
        });
      } catch {
      }

      const localAccount = readLocalOrganizerAccounts().find((account) => account.user.id === user.id);
      if (localAccount) {
        saveLocalOrganizerAccount(updatedUser, localAccount.password);
      }
      startLocalSession(updatedUser, true);
      upsertLocalItem<User>(LOCAL_SESSION_KEY + "_users", updatedUser);
      setUser(updatedUser);
    } catch (error) {
      throw new Error(getAuthErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        registerOrganizer,
        requestStudentAccess,
        joinClassWithCode,
        inviteTeacher,
        activateTeacherInvitation,
        getTeacherInvitation,
        listTeacherInvitations,
        inviteStudent,
        activateStudentInvitation,
        getStudentInvitation,
        listStudentInvitations,
        createDepartment,
        listDepartments,
        createSemester,
        listSemesters,
        createAcademicClass,
        listAcademicClasses,
        createSubject,
        listSubjects,
        allocateTeacher,
        allocateStudent,
        listPendingStudentRequests,
        decideStudentRequest,
        updateOrganizationSettings,
        updateUserProfile,
        logout,
        forgotPassword
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
};
