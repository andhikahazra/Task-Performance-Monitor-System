"use client";

import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import Topbar, { BreadcrumbItem } from "./Topbar";
import ToastProvider from "../ui/Toast";

export interface AppShellProps {
  children: React.ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  role?: "admin" | "user";
  user?: {
    name: string;
    role: string;
    initials: string;
    email?: string;
  };
  unreadNotificationsCount?: number;
  onNotificationsClick?: () => void;
  onLogout?: () => void;
  activePath?: string;
  pendingActionsCount?: number;
}

export const AppShell: React.FC<AppShellProps> = ({
  children,
  breadcrumbs,
  role = "admin",
  user,
  unreadNotificationsCount = 4,
  onNotificationsClick,
  onLogout,
  activePath,
  pendingActionsCount,
}) => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [isOpenMobile, setIsOpenMobile] = useState<boolean>(false);

  // Restore sidebar collapsed preference from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("mm-sidebar-collapsed");
      if (saved !== null) {
        setIsCollapsed(saved === "true");
      }
    } catch {
      // Ignore
    }
  }, []);

  const handleToggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("mm-sidebar-collapsed", String(next));
      } catch {
        // Ignore
      }
      return next;
    });
  };

  return (
    <div className="flex min-h-screen bg-[var(--color-surface,#f4f6fa)] text-[var(--color-ink,#172033)] transition-colors">
      {/* Sidebar */}
      <Sidebar
        isCollapsed={isCollapsed}
        onToggleCollapse={handleToggleCollapse}
        isOpenMobile={isOpenMobile}
        onCloseMobile={() => setIsOpenMobile(false)}
        role={role}
        user={user}
        activePath={activePath}
        pendingActionsCount={pendingActionsCount}
      />

      {/* Main Area */}
      <div className="flex min-w-0 flex-1 flex-col overflow-x-hidden">
        {/* Topbar */}
        <Topbar
          onOpenMobileSidebar={() => setIsOpenMobile(true)}
          breadcrumbs={breadcrumbs}
          user={user}
          unreadNotificationsCount={unreadNotificationsCount}
          onNotificationsClick={onNotificationsClick}
          onLogout={onLogout}
        />

        {/* Page Content Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1740px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppShell;
