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
  subject?: string;
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

export type StudentAccessRequest = {
  id: string;
  name: string;
  email: string;
  rollNumber: string;
  classJoinCode: string;
  classroomId?: string;
  classroomName?: string;
  institutionId?: string;
  institution: string;
  status: StudentRequestStatus;
  approvalRequestedAt?: unknown;
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
  classJoinCode: string;
};

type TeacherInvitationInput = {
  teacherName: string;
  email: string;
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
  password: string;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string, rememberMe?: boolean, expectedRole?: UserRole) => Promise<User>;
  registerOrganizer: (input: OrganizerRegistrationInput) => Promise<User>;
  requestStudentAccess: (input: StudentJoinRequestInput) => Promise<void>;
  inviteTeacher: (input: TeacherInvitationInput) => Promise<TeacherInvitation>;
  activateTeacherInvitation: (input: TeacherActivationInput) => Promise<User>;
  getTeacherInvitation: (token: string) => Promise<TeacherInvitation>;
  listTeacherInvitations: () => Promise<TeacherInvitation[]>;
  listPendingStudentRequests: () => Promise<StudentAccessRequest[]>;
  decideStudentRequest: (studentId: string, decision: "approve" | "reject") => Promise<void>;
  updateOrganizationSettings: (input: OrganizationSettingsInput) => Promise<void>;
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
const FALLBACK_CLASS_CODES = new Set(["CLASS-2026-A1", "DIGI-DEMO"]);
const LOCAL_ORGANIZERS_KEY = "digiclassroom.organizers";
const LOCAL_SESSION_KEY = "digiclassroom.session";
const LOCAL_TEACHER_INVITATIONS_KEY = "digiclassroom.teacherInvitations";

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

const readLocalSession = () => {
  if (!canUseBrowserStorage()) {
    return null;
  }

  try {
    const rawSession = window.localStorage.getItem(LOCAL_SESSION_KEY) || window.sessionStorage.getItem(LOCAL_SESSION_KEY);
    return rawSession ? (JSON.parse(rawSession) as User) : null;
  } catch {
    return null;
  }
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

const loginWithLocalOrganizer = (email: string, password: string, rememberMe = true) => {
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
    subject: profile?.subject,
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
    case "dc/invitation-invalid":
      return "This invitation link is invalid or has already been used.";
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

  if (nextUser.role === "student" && nextUser.status !== "active") {
    if (nextUser.status === "rejected") {
      throw createAuthError("dc/student-rejected");
    }
    throw createAuthError("dc/student-pending-approval");
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
    return {
      id: classroomDoc.id,
      ...(classroomDoc.data() as {
        name?: string;
        institutionId?: string;
        institutionName?: string;
        joinCode?: string;
      })
    };
  }

  if (FALLBACK_CLASS_CODES.has(normalizedCode)) {
    return {
      id: "demo-classroom",
      name: "Demo Classroom",
      institutionId: "demo-institution",
      institutionName: DEFAULT_INSTITUTION,
      joinCode: normalizedCode
    };
  }

  throw createAuthError("dc/class-code-invalid");
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
        setUser(readLocalSession());
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

  const login = async (email: string, password: string, rememberMe = true, expectedRole?: UserRole) => {
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
    password,
    classJoinCode
  }: StudentJoinRequestInput) => {
    setIsLoading(true);

    try {
      const classroom = await findClassroomByJoinCode(classJoinCode);
      await setPersistence(auth, browserLocalPersistence);
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(credential.user, { displayName: fullName });

      await setDoc(doc(db, "users", credential.user.uid), {
        id: credential.user.uid,
        name: fullName,
        email,
        role: "student",
        status: "pending_approval",
        institution: classroom.institutionName || DEFAULT_INSTITUTION,
        institutionId: classroom.institutionId,
        classroomId: classroom.id,
        classroomName: classroom.name || "Assigned Classroom",
        rollNumber,
        classJoinCode: classJoinCode.trim().toUpperCase(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        approvalRequestedAt: serverTimestamp()
      });

      await signOut(auth);
      setUser(null);
    } catch (error) {
      throw new Error(getAuthErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  const inviteTeacher = async ({ teacherName, email }: TeacherInvitationInput) => {
    if (!user || user.role !== "organizer") {
      throw createAuthError("dc/unauthorized-access");
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!INVITED_TEACHER_DOMAIN.test(normalizedEmail)) {
      throw createAuthError("dc/teacher-gmail-required");
    }

    const token = createToken();
    const invitationRef = doc(collection(db, "teacherInvitations"));
    const invitation: TeacherInvitation = {
      id: invitationRef.id,
      token,
      teacherName: teacherName.trim(),
      email: normalizedEmail,
      department: "",
      subject: "",
      status: "pending",
      institutionId: user.institutionId || user.id,
      institutionName: user.institution || DEFAULT_INSTITUTION,
      invitedBy: user.id
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
    try {
      const invitationQuery = query(collection(db, "teacherInvitations"), where("token", "==", token), where("status", "==", "pending"), limit(1));
      const invitationSnapshot = await getDocs(invitationQuery);

      if (!invitationSnapshot.empty) {
        const invitationDoc = invitationSnapshot.docs[0];
        return { id: invitationDoc.id, ...(invitationDoc.data() as Omit<TeacherInvitation, "id">) };
      }
    } catch {
      const localInvitation = readLocalTeacherInvitations().find((invitation) => invitation.token === token && invitation.status === "pending");

      if (localInvitation) {
        return localInvitation;
      }
    }

    throw createAuthError("dc/invitation-invalid");
  };

  const activateTeacherInvitation = async ({ token, password }: TeacherActivationInput) => {
    setIsLoading(true);

    try {
      const invitation = await getTeacherInvitation(token);
      await setPersistence(auth, browserLocalPersistence);
      const credential = await createUserWithEmailAndPassword(auth, invitation.email, password);
      await updateProfile(credential.user, { displayName: invitation.teacherName });

      const nextUser: User = {
        id: credential.user.uid,
        name: invitation.teacherName,
        email: invitation.email,
        role: "teacher",
        status: "active",
        institution: invitation.institutionName,
        institutionId: invitation.institutionId,
        department: invitation.department,
        subject: invitation.subject
      };

      await setDoc(doc(db, "users", credential.user.uid), {
        ...nextUser,
        invitationId: invitation.id,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      try {
        await updateDoc(doc(db, "teacherInvitations", invitation.id), {
          status: "accepted",
          acceptedBy: credential.user.uid,
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
          institutionId: student.institutionId,
          institution: student.institution || student.institutionName || DEFAULT_INSTITUTION,
          status: "pending_approval" as const,
          approvalRequestedAt: student.approvalRequestedAt
        };
      })
      .filter((student) => !user.institutionId || student.institutionId === user.institutionId || student.institution === user.institution);
  };

  const decideStudentRequest = async (studentId: string, decision: "approve" | "reject") => {
    if (!user || !["organizer", "teacher"].includes(user.role)) {
      throw createAuthError("dc/unauthorized-access");
    }

    await updateDoc(doc(db, "users", studentId), {
      status: decision === "approve" ? "active" : "rejected",
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

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        registerOrganizer,
        requestStudentAccess,
        inviteTeacher,
        activateTeacherInvitation,
        getTeacherInvitation,
        listTeacherInvitations,
        listPendingStudentRequests,
        decideStudentRequest,
        updateOrganizationSettings,
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
