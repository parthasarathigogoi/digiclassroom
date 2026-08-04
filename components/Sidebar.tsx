"use client";
import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Users,
  BookOpen,
  FileText,
  Video,
  ClipboardList,
  Award,
  BarChart3,
  Sparkles,
  Bell,
  Settings,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Laptop,
  Calendar,
  CalendarDays,
  Target,
  Library,
  FileCheck,
  MessageSquare,
  User,
  GraduationCap,
  Megaphone,
  LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Users, label: "My Classes", href: "/dashboard/classrooms" },
  { icon: BookOpen, label: "Study Materials", href: "/dashboard/study-materials" },
  { icon: FileText, label: "Assignments", href: "/dashboard/assignments" },
  { icon: Laptop, label: "Online Exams", href: "/dashboard/online-exams" },
  { icon: Award, label: "Results", href: "/dashboard/results" },
  { icon: BarChart3, label: "Analytics", href: "/dashboard/analytics" },
  { icon: Video, label: "Live Classes", href: "/dashboard/live-classes" },
  { icon: Calendar, label: "Timetable", href: "/dashboard/timetable" },
  { icon: ClipboardList, label: "Attendance", href: "/dashboard/attendance" },
  { icon: Target, label: "Practice Center", href: "/dashboard/practice-center" },
  { icon: Sparkles, label: "AI Assistant", href: "/dashboard/ai" },
  { icon: Library, label: "Library", href: "/dashboard/library" },
  { icon: FileCheck, label: "Certificates", href: "/dashboard/certificates" },
  { icon: MessageSquare, label: "Messages", href: "/dashboard/messages" },
  { icon: Bell, label: "Notifications", href: "/dashboard/notifications" },
  { icon: User, label: "Profile", href: "/dashboard/profile" },
  { icon: Settings, label: "Settings", href: "/dashboard/settings" }
];

const organizerNavItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/organizer/dashboard" },
  { icon: Building2, label: "Departments", href: "/organizer/departments" },
  { icon: Users, label: "Teachers", href: "/organizer/teachers" },
  { icon: GraduationCap, label: "Students", href: "/organizer/students" },
  { icon: Building2, label: "Classes", href: "/organizer/classes" },
  { icon: BookOpen, label: "Subjects", href: "/organizer/subjects" },
  { icon: Library, label: "Study Materials", href: "/organizer/study-materials" },
  { icon: FileText, label: "Assignments", href: "/organizer/assignments" },
  { icon: ClipboardList, label: "Examinations", href: "/organizer/examinations" },
  { icon: Calendar, label: "Attendance", href: "/organizer/attendance" },
  { icon: BarChart3, label: "Analytics", href: "/organizer/analytics" },
  { icon: Megaphone, label: "Announcements", href: "/organizer/announcements" },
  { icon: MessageSquare, label: "Messages", href: "/organizer/messages" },
  { icon: Award, label: "Certificates", href: "/organizer/certificates" },
  { icon: Settings, label: "Organization Settings", href: "/organizer/settings" },
  { icon: User, label: "Profile", href: "/organizer/profile" }
];

const teacherNavItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/teacher/dashboard" },
  { icon: CalendarDays, label: "Today's Classes", href: "/dashboard/live-classes" },
  { icon: Users, label: "My Classes", href: "/dashboard/classrooms" },
  { icon: BookOpen, label: "Study Materials", href: "/dashboard/study-materials" },
  { icon: FileText, label: "Assignments", href: "/dashboard/assignments" },
  { icon: ClipboardList, label: "Question Bank", href: "/dashboard/question-bank" },
  { icon: Laptop, label: "Examinations", href: "/dashboard/online-exams" },
  { icon: BarChart3, label: "Student Analysis", href: "/dashboard/analytics" },
  { icon: FileCheck, label: "Attendance", href: "/dashboard/attendance" },
  { icon: MessageSquare, label: "Messages", href: "/dashboard/messages" },
  { icon: Bell, label: "Notifications", href: "/dashboard/notifications" },
  { icon: User, label: "Profile", href: "/dashboard/profile" },
  { icon: Settings, label: "Settings", href: "/dashboard/settings" }
];

const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const visibleNavItems = user?.role === "organizer" ? organizerNavItems : user?.role === "teacher" ? teacherNavItems : navItems;

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-white shadow-lg md:hidden"
      >
        {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <div
        className={cn(
          "fixed left-0 top-0 z-40 h-full overflow-hidden border-r border-slate-200 bg-white transition-all duration-300 md:translate-x-0 dark:border-slate-800 dark:bg-slate-950",
          isMobileOpen ? "translate-x-0" : "-translate-x-full",
          isCollapsed ? "w-20" : "w-64"
        )}
      >
        <div className="flex h-20 items-center justify-between border-b border-slate-100 px-4 dark:border-slate-800">
          <div className={cn("flex items-center gap-3", isCollapsed && "justify-center")}>
            <img
              src="/mylogo.jpeg"
              alt="DigiClassroom Logo"
              className={cn("object-contain", isCollapsed ? "h-10 w-10" : "h-14 w-auto")}
            />
            {!isCollapsed && (
              <span className="text-xl font-bold text-ink dark:text-white">DigiClassroom</span>
            )}
          </div>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden rounded-full p-2 hover:bg-slate-100 md:block dark:hover:bg-slate-900"
          >
            {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
        </div>

        <nav className="mt-4 h-[calc(100vh-10rem)] space-y-1 overflow-y-auto px-3 pb-4">
          {visibleNavItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-3 transition-all duration-200",
                  isActive
                    ? "bg-ocean text-white shadow-lg shadow-blue-500/30"
                    : "text-slate-600 hover:bg-slate-100 hover:text-ink dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white",
                  isCollapsed && "justify-center"
                )}
              >
                <item.icon size={20} />
                {!isCollapsed && <span className="font-medium">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 w-full border-t border-slate-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
          <div className={cn("flex items-center gap-3", isCollapsed && "justify-center")}>
            {!isCollapsed && (
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-ink dark:text-white">{user?.name}</span>
                <span className="text-xs text-slate-500 capitalize">{user?.role}</span>
              </div>
            )}
            {isCollapsed && (
              <div className="grid h-10 w-10 place-items-center rounded-full bg-ocean/10 font-bold text-ocean">
                {user?.name.charAt(0)}
              </div>
            )}
            {!isCollapsed && (
              <button
                onClick={logout}
                className="ml-auto rounded-full p-2 text-slate-500 hover:bg-slate-100 hover:text-red-500 dark:hover:bg-slate-900"
                aria-label="Logout"
              >
                <LogOut size={18} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
    </>
  );
};

export default Sidebar;
