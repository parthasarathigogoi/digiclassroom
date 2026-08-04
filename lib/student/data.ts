"use client";

export type Classroom = {
  id: string;
  name: string;
  subject: string;
  teacher: string;
  students: number;
  code: string;
  progress: number;
};

export type Assignment = {
  id: string;
  title: string;
  subject: string;
  dueDate: string;
  points: number;
  status: "pending" | "submitted" | "graded";
  grade?: string;
  submittedText?: string;
};

export type Material = {
  id: string;
  title: string;
  subject: string;
  type: "PDF" | "Video" | "Notes";
  size: string;
};

export type Exam = {
  id: string;
  title: string;
  subject: string;
  duration: string;
  questions: number;
  status: "available" | "completed";
  score?: number;
};

export const availableClassrooms: Classroom[] = [
  { id: "math", name: "Math 101", subject: "Mathematics", teacher: "Anita Sharma", students: 45, code: "MATH101", progress: 72 },
  { id: "phys", name: "Physics 201", subject: "Physics", teacher: "Rahul Verma", students: 38, code: "PHYS201", progress: 64 },
  { id: "chem", name: "Chemistry 301", subject: "Chemistry", teacher: "Meera Das", students: 32, code: "CHEM301", progress: 58 }
];

export const defaultAssignments: Assignment[] = [
  { id: "a1", title: "Algebra worksheet", subject: "Mathematics", dueDate: "2026-08-02", points: 20, status: "pending" },
  { id: "a2", title: "Motion numericals", subject: "Physics", dueDate: "2026-08-04", points: 25, status: "pending" },
  { id: "a3", title: "Atomic structure notes", subject: "Chemistry", dueDate: "2026-07-29", points: 15, status: "graded", grade: "13/15" }
];

export const materials: Material[] = [
  { id: "m1", title: "Linear Equations Guide", subject: "Mathematics", type: "PDF", size: "2.4 MB" },
  { id: "m2", title: "Newton's Laws Recorded Class", subject: "Physics", type: "Video", size: "38 min" },
  { id: "m3", title: "Periodic Table Revision", subject: "Chemistry", type: "Notes", size: "8 pages" }
];

export const defaultExams: Exam[] = [
  { id: "e1", title: "Math Unit Test", subject: "Mathematics", duration: "20 min", questions: 5, status: "available" },
  { id: "e2", title: "Physics Practice Quiz", subject: "Physics", duration: "15 min", questions: 5, status: "available" }
];

export const classCodes = new Map(availableClassrooms.map((item) => [item.code, item]));
