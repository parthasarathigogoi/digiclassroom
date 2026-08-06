"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Bell,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  CheckSquare,
  ClipboardEdit,
  Inbox,
  Loader2,
  MailCheck,
  Megaphone,
  Search,
  XCircle
} from "lucide-react";
import {
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where
} from "firebase/firestore";
import { toast } from "sonner";
import { canAccessAllocationScope, useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { cn } from "@/lib/utils";

type NotificationCategory =
  | "announcement"
  | "assignment"
  | "exam"
  | "attendance"
  | "result"
  | "class_request"
  | "material"
  | "general";

type Notification = {
  id: string;
  title: string;
  message: string;
  category: NotificationCategory;
  read: boolean;
  createdAt?: unknown;
  actionUrl?: string;
  subject?: string;
  departmentId?: string;
  semesterId?: string;
  classroomId?: string;
  institutionId?: string;
  priority?: "high" | "medium" | "low";
};

const CATEGORY_META: Record<NotificationCategory, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  announcement: { label: "Announcements", icon: Megaphone, color: "text-violet-700", bg: "bg-violet-100" },
  assignment: { label: "Assignments", icon: ClipboardEdit, color: "text-blue-700", bg: "bg-blue-100" },
  exam: { label: "Exams", icon: CalendarDays, color: "text-rose-700", bg: "bg-rose-100" },
  attendance: { label: "Attendance", icon: CheckSquare, color: "text-emerald-700", bg: "bg-emerald-100" },
  result: { label: "Results", icon: MailCheck, color: "text-amber-700", bg: "bg-amber-100" },
  class_request: { label: "Class Request", icon: BookOpen, color: "text-cyan-700", bg: "bg-cyan-100" },
  material: { label: "Study Material", icon: BookOpen, color: "text-indigo-700", bg: "bg-indigo-100" },
  general: { label: "General", icon: Bell, color: "text-slate-700", bg: "bg-slate-100" }
};

const dateFromValue = (value: unknown) => {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === "string" || typeof value === "number") return new Date(value);
  if (typeof value === "object" && "toDate" in value && typeof value.toDate === "function") return value.toDate() as Date;
  return null;
};

const relativeTime = (value: unknown) => {
  const date = dateFromValue(value);
  if (!date) return "Just now";
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days} day${days > 1 ? "s" : ""} ago`;
  return date.toLocaleDateString(undefined, { dateStyle: "medium" });
};

const FILTERS: { id: NotificationCategory | "all"; label: string }[] = [
  { id: "all", label: "All Notifications" },
  { id: "announcement", label: "Announcements" },
  { id: "assignment", label: "Assignments" },
  { id: "exam", label: "Exams" },
  { id: "result", label: "Results" },
  { id: "attendance", label: "Attendance" },
  { id: "material", label: "Study Material" },
  { id: "class_request", label: "Class Requests" },
  { id: "general", label: "General" }
];

const NotificationsPage: React.FC = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<NotificationCategory | "all">("all");
  const [search, setSearch] = useState("");
  const [unreadOnly, setUnreadOnly] = useState(false);

  useEffect(() => {
    const loadNotifications = async () => {
      if (!user) return;
      setIsLoading(true);
      try {
        const snapshot = await getDocs(
          query(collection(db, "notifications"), where("recipientId", "in", [user.id, "all-students"]))
        );
        const list = snapshot.docs
          .map((item) => ({
            id: item.id,
            read: false,
            ...(item.data() as Omit<Notification, "id" | "read">)
          }))
          .filter((n) => canAccessAllocationScope(user, n));

        const readStatusSnapshot = await getDocs(
          query(collection(db, "notificationReadStatus"), where("userId", "==", user.id))
        );
        const readIds = new Set<string>();
        readStatusSnapshot.docs.forEach((d) => {
          const data = d.data();
          if (data?.notificationId) readIds.add(data.notificationId as string);
          if (data?.read) readIds.add(d.id.replace(`${user.id}-`, ""));
        });

        const withRead = list.map((n) => ({ ...n, read: readIds.has(n.id) || !!n.read }));
        withRead.sort((a, b) => {
          const da = dateFromValue(a.createdAt)?.getTime() || 0;
          const db = dateFromValue(b.createdAt)?.getTime() || 0;
          return db - da;
        });
        setNotifications(withRead);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to load notifications.");
      } finally {
        setIsLoading(false);
      }
    };
    void loadNotifications();
  }, [user]);

  const counts = useMemo(() => {
    const total = notifications.length;
    const unread = notifications.filter((n) => !n.read).length;
    return { total, unread };
  }, [notifications]);

  const filtered = useMemo(() => {
    return notifications.filter((n) => {
      if (filter !== "all" && n.category !== filter) return false;
      if (unreadOnly && n.read) return false;
      if (search.trim()) {
        const s = search.trim().toLowerCase();
        const hay = `${n.title} ${n.message} ${n.subject || ""}`.toLowerCase();
        if (!hay.includes(s)) return false;
      }
      return true;
    });
  }, [notifications, filter, search, unreadOnly]);

  const markAsRead = async (notification: Notification) => {
    if (!user || notification.read) return;
    const statusId = `${user.id}-${notification.id}`;
    try {
      await setDoc(doc(db, "notificationReadStatus", statusId), {
        userId: user.id,
        notificationId: notification.id,
        read: true,
        readAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch {
      // still update local state
    }
    setNotifications((cur) => cur.map((n) => (n.id === notification.id ? { ...n, read: true } : n)));
  };

  const markAllAsRead = async () => {
    if (!user) return;
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
    if (!unreadIds.length) return;
    try {
      await Promise.all(
        unreadIds.map((nid) =>
          setDoc(doc(db, "notificationReadStatus", `${user.id}-${nid}`), {
            userId: user.id,
            notificationId: nid,
            read: true,
            readAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          })
        )
      );
    } catch {
      // proceed with local update
    }
    setNotifications((cur) => cur.map((n) => (unreadIds.includes(n.id) ? { ...n, read: true } : n)));
    toast.success("Marked all as read.");
  };

  return (
    <div className="space-y-7">
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-ocean">Inbox</p>
        <h1 className="mt-2 text-3xl font-black text-ink">Notifications</h1>
        <p className="mt-1 text-slate-600">Announcements, assignments, exams, results, and alerts for your allocated class.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <StatCard icon={Inbox} label="Total" value={counts.total.toString()} color="bg-blue-100 text-blue-700" />
        <StatCard icon={Bell} label="Unread" value={counts.unread.toString()} color="bg-amber-100 text-amber-700" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search notifications..."
            className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm outline-none transition focus:border-ocean focus:ring-4 focus:ring-ocean/20"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={unreadOnly}
              onChange={(e) => setUnreadOnly(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-ocean focus:ring-ocean"
            />
            Unread only
          </label>
          <button
            onClick={markAllAsRead}
            disabled={counts.unread === 0}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-ocean hover:text-ocean disabled:opacity-60"
          >
            <CheckCircle2 size={15} /> Mark all read
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const active = filter === f.id;
          return (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-bold transition",
                active ? "bg-ocean text-white shadow" : "border border-slate-200 bg-white text-slate-700 hover:border-ocean hover:text-ocean"
              )}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white p-10 text-sm font-semibold text-slate-500 shadow-sm">
          <Loader2 className="animate-spin" size={18} />
          Loading notifications...
        </div>
      ) : filtered.length ? (
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm divide-y divide-slate-100">
          {filtered.map((n) => (
            <NotificationRow key={n.id} notification={n} onOpen={() => markAsRead(n)} />
          ))}
        </section>
      ) : (
        <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
          <Bell className="mx-auto text-ocean" size={32} />
          <h2 className="mt-4 text-lg font-black text-ink">No notifications</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
            When teachers or organizers publish announcements, assignments, exams, results, or attendance, you will see them here.
          </p>
        </section>
      )}
    </div>
  );
};

const StatCard: React.FC<{ icon: React.ElementType; label: string; value: string; color: string }> = ({
  icon: Icon,
  label,
  value,
  color
}) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className={`grid h-12 w-12 place-items-center rounded-xl ${color}`}>
      <Icon size={22} />
    </div>
    <p className="mt-4 text-3xl font-black text-ink">{value}</p>
    <p className="text-sm font-semibold text-slate-500">{label}</p>
  </div>
);

const NotificationRow: React.FC<{ notification: Notification; onOpen: () => void }> = ({ notification, onOpen }) => {
  const meta = CATEGORY_META[notification.category] || CATEGORY_META.general;
  const Icon = meta.icon;

  return (
    <button
      onClick={onOpen}
      className={cn(
        "flex w-full items-start gap-4 p-5 text-left transition hover:bg-slate-50",
        !notification.read && "bg-blue-50/40"
      )}
    >
      <div className={cn("mt-1 grid h-11 w-11 flex-shrink-0 place-items-center rounded-xl", meta.bg, meta.color)}>
        <Icon size={18} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h3 className={cn("font-black", notification.read ? "text-slate-700" : "text-ink")}>
            {notification.title}
          </h3>
          <div className="flex items-center gap-2">
            {notification.priority === "high" ? (
              <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-[0.16em] text-rose-700">
                High
              </span>
            ) : notification.priority === "low" ? (
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
                Low
              </span>
            ) : null}
            <span className="text-xs font-bold text-slate-400">{relativeTime(notification.createdAt)}</span>
          </div>
        </div>
        <p className="mt-1 text-sm leading-6 text-slate-600">{notification.message}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <span className={cn("rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em]", meta.bg, meta.color)}>
            {meta.label}
          </span>
          {notification.subject ? (
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-slate-600">
              {notification.subject}
            </span>
          ) : null}
          {!notification.read ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-ocean/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-ocean">
              <span className="h-1.5 w-1.5 rounded-full bg-ocean" /> Unread
            </span>
          ) : null}
        </div>
      </div>
      {notification.actionUrl ? (
        <div className="hidden sm:flex self-center">
          <XCircle size={16} className="text-slate-300 rotate-45" />
        </div>
      ) : null}
    </button>
  );
};

export default NotificationsPage;
