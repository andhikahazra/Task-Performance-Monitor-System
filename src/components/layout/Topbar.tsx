"use client";

import React, { useState, useEffect } from "react";
import {
  Menu,
  Bell,
  LogOut,
  Palette,
  ChevronRight,
} from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface TopbarProps {
  onOpenMobileSidebar: () => void;
  breadcrumbs?: BreadcrumbItem[];
  user?: {
    name: string;
    role: string;
    initials: string;
    email?: string;
  };
  unreadNotificationsCount?: number;
  onNotificationsClick?: () => void;
  onLogout?: () => void;
  currentTheme?: string;
  onThemeChange?: (theme: string) => void;
}

const themeOptions = [
  { id: "light", label: "Light", color: "#2563eb" },
  { id: "ocean", label: "Ocean", color: "#1e40af" },
  { id: "emerald", label: "Emerald", color: "#0f766e" },
  { id: "violet", label: "Violet", color: "#6d28d9" },
  { id: "sunset", label: "Sunset", color: "#c2410c" },
  { id: "midnight", label: "Midnight", color: "#1e293b" },
];

export const Topbar: React.FC<TopbarProps> = ({
  onOpenMobileSidebar,
  breadcrumbs = [{ label: "Workspace" }, { label: "Dashboard" }],
  user = {
    name: "Super Admin",
    role: "Administrator Sistem",
    initials: "SA",
    email: "admin@demo.com",
  },
  unreadNotificationsCount = 4,
  onNotificationsClick,
  onLogout,
  currentTheme: propTheme,
  onThemeChange,
}) => {
  const [activeTheme, setActiveTheme] = useState<string>("light");

  useEffect(() => {
    if (propTheme) {
      setActiveTheme(propTheme);
      return;
    }
    try {
      const saved = localStorage.getItem("mm-theme") || "light";
      setActiveTheme(saved);
      document.documentElement.dataset.theme = saved;
      if (saved === "midnight") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    } catch {
      // Ignore localStorage errors
    }
  }, [propTheme]);

  const handleThemeSelect = (newTheme: string) => {
    setActiveTheme(newTheme);
    try {
      localStorage.setItem("mm-theme", newTheme);
      document.documentElement.dataset.theme = newTheme;
      if (newTheme === "midnight") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    } catch {
      // Ignore
    }
    if (onThemeChange) {
      onThemeChange(newTheme);
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/90 px-4 sm:px-6 backdrop-blur-md transition-colors dark:border-zinc-800 dark:bg-zinc-950/90">
      {/* Left: Mobile hamburger & Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 lg:hidden dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 active:scale-[0.98]"
          aria-label="Buka navigasi menu"
        >
          <Menu className="h-4 w-4" />
        </button>

        {/* Breadcrumb Navigation */}
        <nav
          aria-label="Breadcrumb"
          className="flex items-center text-xs font-medium text-slate-500 dark:text-zinc-400"
        >
          {breadcrumbs.map((crumb, idx) => {
            const isLast = idx === breadcrumbs.length - 1;
            return (
              <React.Fragment key={crumb.label + idx}>
                {idx > 0 && (
                  <ChevronRight className="mx-1.5 h-3.5 w-3.5 text-slate-300 dark:text-zinc-600 shrink-0" />
                )}
                {isLast ? (
                  <span className="font-semibold text-slate-900 dark:text-zinc-100">
                    {crumb.label}
                  </span>
                ) : (
                  <span className="hover:text-slate-800 dark:hover:text-zinc-300">
                    {crumb.label}
                  </span>
                )}
              </React.Fragment>
            );
          })}
        </nav>
      </div>

      {/* Right: Actions, theme switch, notifications, user avatar & logout */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Signed-in badge / indicator */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-medium dark:bg-zinc-800 dark:text-zinc-300">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>{user.email || "Akun demo"}</span>
        </div>

        {/* Theme Selector Dropdown */}
        <div className="relative flex items-center">
          <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
            <Palette className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={activeTheme}
              onChange={(e) => handleThemeSelect(e.target.value)}
              className="bg-transparent pr-1 text-xs font-medium outline-none cursor-pointer"
              aria-label="Pilih tema aplikasi"
            >
              {themeOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Notification Bell */}
        <button
          type="button"
          onClick={onNotificationsClick}
          className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 active:scale-[0.98]"
          aria-label="Buka notifikasi"
          title="Buka notifikasi"
        >
          <Bell className="h-4 w-4" />
          {unreadNotificationsCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white shadow-xs">
              {unreadNotificationsCount > 99 ? "99+" : unreadNotificationsCount}
            </span>
          )}
        </button>

        {/* User Avatar Circle */}
        <div
          className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-900 text-xs shadow-xs"
          title={`${user.name} (${user.role})`}
        >
          {user.initials}
        </div>

        {/* Logout Button */}
        {onLogout && (
          <button
            type="button"
            onClick={onLogout}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition-colors dark:border-zinc-800 dark:bg-zinc-900 dark:text-rose-400 dark:hover:bg-rose-950/40 active:scale-[0.98]"
            title="Keluar dari akun"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Keluar</span>
          </button>
        )}
      </div>
    </header>
  );
};

export default Topbar;
