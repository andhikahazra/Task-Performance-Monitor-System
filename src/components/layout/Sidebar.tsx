"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CheckSquare,
  Calendar,
  Clock,
  TrendingUp,
  FileText,
  UserPlus,
  KeyRound,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  Search,
  X,
} from "lucide-react";

export interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: number | string;
  adminOnly?: boolean;
}

export interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  role?: "admin" | "user";
  user?: {
    name: string;
    role: string;
    initials: string;
    email?: string;
  };
  onQuickSearchClick?: () => void;
  activePath?: string;
  pendingActionsCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  onToggleCollapse,
  isOpenMobile,
  onCloseMobile,
  role = "admin",
  user = {
    name: "Super Admin",
    role: "Administrator Sistem",
    initials: "SA",
    email: "admin@demo.com",
  },
  onQuickSearchClick,
  activePath,
  pendingActionsCount,
}) => {
  const pathname = usePathname();
  const currentPath = activePath || pathname || "/dashboard";

  const workspaceNavItems: NavItem[] = [
    {
      id: "dashboard",
      label: "Dashboard",
      href: "/dashboard",
      icon: <LayoutDashboard className="h-4 w-4 shrink-0" />,
    },
    {
      id: "tasks",
      label: role === "user" ? "Pekerjaan Saya" : "Pekerjaan",
      href: "/tasks",
      icon: <CheckSquare className="h-4 w-4 shrink-0" />,
    },
    {
      id: "calendar",
      label: "Kalender",
      href: "/calendar",
      icon: <Calendar className="h-4 w-4 shrink-0" />,
    },
    {
      id: "actions",
      label: role === "user" ? "Status Permohonan" : "Perlu Tindakan",
      href: "/actions",
      icon: <Clock className="h-4 w-4 shrink-0" />,
      badge:
        pendingActionsCount && pendingActionsCount > 0
          ? pendingActionsCount
          : undefined,
    },
    {
      id: "evaluation",
      label: "Evaluasi & Ranking",
      href: "/evaluation",
      icon: <TrendingUp className="h-4 w-4 shrink-0" />,
    },
    {
      id: "reports",
      label: "Laporan",
      href: "/reports",
      icon: <FileText className="h-4 w-4 shrink-0" />,
    },
    {
      id: "password",
      label: "Ganti Password",
      href: "/password",
      icon: <KeyRound className="h-4 w-4 shrink-0" />,
    },
  ];

  const adminNavItems: NavItem[] = [
    {
      id: "users",
      label: "Pengguna",
      href: "/users",
      icon: <Users className="h-4 w-4 shrink-0" />,
      adminOnly: true,
    },
    {
      id: "settings",
      label: "Pengaturan",
      href: "/settings",
      icon: <Settings className="h-4 w-4 shrink-0" />,
      adminOnly: true,
    },
  ];

  const filterItems = (items: NavItem[]) =>
    items.filter((item) => !item.adminOnly || role === "admin");

  const visibleWorkspaceItems = filterItems(workspaceNavItems);
  const visibleAdminItems = filterItems(adminNavItems);

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Aside */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex flex-col bg-[var(--navy,#17243a)] text-[#dce5f4] transition-all duration-300 ease-in-out lg:static ${
          isOpenMobile ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        } ${isCollapsed ? "w-16" : "w-[260px]"}`}
      >
        {/* Brand Header */}
        <div
          className={`relative flex h-16 items-center border-b border-white/10 transition-all ${
            isCollapsed ? "justify-center px-2" : "justify-between px-3.5"
          }`}
        >
          <div
            className={`flex items-center gap-2.5 min-w-0 ${
              isCollapsed ? "cursor-pointer" : ""
            }`}
            onClick={isCollapsed ? onToggleCollapse : undefined}
            title={isCollapsed ? "Management Monitor - Klik untuk membuka bilah samping" : undefined}
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 font-extrabold text-white shadow-md shadow-blue-500/30 text-sm hover:opacity-95 transition-transform active:scale-95">
              M
            </div>
            {!isCollapsed && (
              <div className="flex flex-col min-w-0">
                <span className="font-bold text-sm tracking-tight text-white whitespace-nowrap">
                  Management Monitor
                </span>
                <span className="text-[10px] text-[#9fb0c9] tracking-wider whitespace-nowrap">
                  Work. Track. Improve.
                </span>
              </div>
            )}
          </div>

          {/* Desktop Collapse Toggle (When Expanded: Inside Header) */}
          {!isCollapsed && (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="hidden lg:flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
              aria-label="Ciutkan bilah samping"
              title="Ciutkan bilah samping"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}

          {/* Desktop Expand Toggle (When Collapsed: Floating neatly on the Right Border) */}
          {isCollapsed && (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 z-50 h-6 w-6 items-center justify-center rounded-full border border-white/20 bg-[var(--navy,#17243a)] text-slate-300 shadow-md hover:bg-blue-600 hover:text-white hover:border-blue-500 hover:scale-110 active:scale-95 transition-all cursor-pointer"
              aria-label="Buka bilah samping"
              title="Buka bilah samping"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          )}

          {/* Mobile Close Button */}
          <button
            type="button"
            onClick={onCloseMobile}
            className="flex lg:hidden h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-white/10 hover:text-white"
            aria-label="Tutup navigasi"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Quick Search Shortcut */}
        {!isCollapsed ? (
          <div className="px-3 pt-3">
            <button
              type="button"
              onClick={onQuickSearchClick}
              className="group flex w-full items-center justify-between rounded-xl bg-white/5 px-3 py-2 text-xs text-[#9fb0c9] hover:bg-white/10 hover:text-white transition-all border border-white/5 active:scale-[0.98] cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Search className="h-3.5 w-3.5 text-[#8192ad] group-hover:text-blue-400 transition-colors" />
                <span>Cari menu atau tugas...</span>
              </div>
              <kbd className="rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] font-mono text-[#dce5f4] border border-white/5">
                Ctrl K
              </kbd>
            </button>
          </div>
        ) : (
          <div className="px-2.5 pt-3">
            <button
              type="button"
              onClick={onQuickSearchClick}
              className="flex h-10 w-10 mx-auto items-center justify-center rounded-xl bg-white/5 text-[#9fb0c9] hover:bg-white/10 hover:text-white transition-all border border-white/5 cursor-pointer"
              title="Cari menu atau tugas (Ctrl+K)"
            >
              <Search className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto px-2.5 py-3 space-y-4">
          {/* Workspace Group */}
          <div>
            {!isCollapsed ? (
              <p className="px-2.5 mb-1.5 text-[10px] font-bold uppercase tracking-widest text-[#8192ad]">
                Workspace
              </p>
            ) : (
              <div className="h-px bg-white/10 my-2" />
            )}
            <nav className="space-y-1">
              {visibleWorkspaceItems.map((item) => {
                const isActive =
                  currentPath === item.href ||
                  (item.href !== "/dashboard" &&
                    currentPath.startsWith(item.href));

                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={() => {
                      if (isOpenMobile) onCloseMobile();
                    }}
                    title={isCollapsed ? item.label : undefined}
                    className={`group flex items-center gap-3 rounded-lg px-2.5 py-2 text-xs font-medium transition-all ${
                      isActive
                        ? "bg-blue-600 text-white shadow-sm font-semibold"
                        : "text-[#c0cce0] hover:bg-white/8 hover:text-white"
                    } ${isCollapsed ? "justify-center p-0 h-10 w-10 mx-auto" : ""}`}
                  >
                    <span
                      className={`transition-colors ${
                        isActive
                          ? "text-white"
                          : "text-[#8192ad] group-hover:text-white"
                      }`}
                    >
                      {item.icon}
                    </span>
                    {!isCollapsed && (
                      <span className="truncate flex-1">{item.label}</span>
                    )}
                    {!isCollapsed && item.badge !== undefined && (
                      <span className="rounded-full bg-rose-500/90 px-1.5 py-0.5 text-[10px] font-bold text-white shrink-0">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Administration Group */}
          {visibleAdminItems.length > 0 && (
            <div>
              {!isCollapsed ? (
                <p className="px-2.5 mb-1.5 text-[10px] font-bold uppercase tracking-widest text-[#8192ad]">
                  Administration
                </p>
              ) : (
                <div className="h-px bg-white/10 my-2" />
              )}
              <nav className="space-y-1">
                {visibleAdminItems.map((item) => {
                  const isActive =
                    currentPath === item.href ||
                    currentPath.startsWith(item.href);

                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      onClick={() => {
                        if (isOpenMobile) onCloseMobile();
                      }}
                      title={isCollapsed ? item.label : undefined}
                      className={`group flex items-center gap-3 rounded-lg px-2.5 py-2 text-xs font-medium transition-all ${
                        isActive
                          ? "bg-blue-600 text-white shadow-sm font-semibold"
                          : "text-[#c0cce0] hover:bg-white/8 hover:text-white"
                      } ${isCollapsed ? "justify-center p-0 h-10 w-10 mx-auto" : ""}`}
                    >
                      <span
                        className={`transition-colors ${
                          isActive
                            ? "text-white"
                            : "text-[#8192ad] group-hover:text-white"
                        }`}
                      >
                        {item.icon}
                      </span>
                      {!isCollapsed && (
                        <span className="truncate flex-1">{item.label}</span>
                      )}
                      {!isCollapsed && item.badge !== undefined && (
                        <span className="rounded-full bg-rose-500/90 px-1.5 py-0.5 text-[10px] font-bold text-white shrink-0">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>
          )}
        </div>

        {/* User Profile Card Footer */}
        <div className="border-t border-white/10 p-3">
          <div
            className={`flex items-center gap-2.5 rounded-lg p-1.5 transition-colors ${
              isCollapsed ? "justify-center p-0" : ""
            }`}
          >
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-900 text-xs shadow-xs"
              title={user.name}
            >
              {user.initials}
            </div>
            {!isCollapsed && (
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-xs font-semibold text-white truncate">
                  {user.name}
                </span>
                <span className="text-[10px] text-[#9fb0c9] truncate">
                  {user.role}
                </span>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
