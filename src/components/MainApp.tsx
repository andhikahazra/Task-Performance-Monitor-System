"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  AuthLayout,
  AppShell,
} from "@/components/layout";
import {
  DashboardView,
  TasksView,
  CalendarView,
  ActionsView,
  EvaluationView,
  ReportsView,
  UsersView,
  SettingsView,
  ChangePasswordView,
  RegistrationView,
  NotificationsView,
} from "@/components/views";
import { SafeUser, Task, Comment } from "@/types/database";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { FormField } from "@/components/ui/FormField";
import { Modal } from "@/components/ui/Modal";
import { StatusPill } from "@/components/ui/StatusPill";
import { PriorityBadge } from "@/components/ui/PriorityBadge";
import { ToastProvider, useToast } from "@/components/ui/Toast";
import {
  Lock,
  Mail,
  RotateCw,
  Building,
  Briefcase,
  Eye,
  EyeOff,
  ExternalLink,
  MessageSquare,
  CornerDownRight,
  Send,
  X,
  Plus,
} from "lucide-react";

type ActiveViewType =
  | "dashboard"
  | "tasks"
  | "calendar"
  | "actions"
  | "evaluation"
  | "reports"
  | "registration"
  | "password"
  | "users"
  | "settings"
  | "notifications";

export interface MainAppProps {
  initialView?: ActiveViewType;
  initialUser?: SafeUser | null;
}

function MainAppContent({ initialView, initialUser }: MainAppProps) {
  const { success, error, info } = useToast();

  // Auth state: initialized directly from SSR initialUser or localStorage cache
  const [currentUser, setCurrentUser] = useState<SafeUser | null>(() => {
    if (initialUser !== undefined) return initialUser;
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem("mm_user");
        return cached ? JSON.parse(cached) : null;
      } catch {
        return null;
      }
    }
    return null;
  });
  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(false);

  // Login state
  const [loginEmail, setLoginEmail] = useState<string>("");
  const [loginPassword, setLoginPassword] = useState<string>("");
  const [showLoginPassword, setShowLoginPassword] = useState<boolean>(false);
  const [authLoading, setAuthLoading] = useState<boolean>(false);

  // Authenticated state
  const [activeView, setActiveView] = useState<ActiveViewType>(
    initialView || "dashboard"
  );
  const [unreadNotificationsCount, setUnreadNotificationsCount] =
    useState<number>(0);
  const [pendingActionsCount, setPendingActionsCount] = useState<number>(0);

  // Read location pathname on initial mount if not provided via props
  useEffect(() => {
    if (typeof window !== "undefined") {
      const path = window.location.pathname.replace(/^\//, "");
      const validViews: ActiveViewType[] = [
        "dashboard",
        "tasks",
        "calendar",
        "actions",
        "evaluation",
        "reports",
        "registration",
        "password",
        "users",
        "settings",
        "notifications",
      ];
      if (validViews.includes(path as ActiveViewType)) {
        setActiveView(path as ActiveViewType);
      }
    }
  }, []);

  // Global modals state (can be triggered from dashboard/calendar/etc.)
  const [createTaskModalOpen, setCreateTaskModalOpen] =
    useState<boolean>(false);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [dashboardRefreshKey, setDashboardRefreshKey] = useState<number>(0);

  // Detail & Discussion Modal State
  const [detailModalTask, setDetailModalTask] = useState<Task | null>(null);
  const [detailComments, setDetailComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState<boolean>(false);
  const [newCommentText, setNewCommentText] = useState<string>("");
  const [replyTarget, setReplyTarget] = useState<{
    id: number;
    author: string;
  } | null>(null);
  const [submittingComment, setSubmittingComment] = useState<boolean>(false);

  // Status Update Modal State
  const [statusModalTask, setStatusModalTask] = useState<Task | null>(null);
  const [statusLoading, setStatusLoading] = useState<boolean>(false);
  const [statusForm, setStatusForm] = useState({
    nextStatus: "Dalam Proses",
    deadline: "",
    pendingReason: "",
    evidenceUrl: "",
  });

  // Check auth session
  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data?.user) {
          setCurrentUser(json.data.user);
          try {
            localStorage.setItem("mm_user", JSON.stringify(json.data.user));
          } catch {}
        } else {
          setCurrentUser(null);
          try {
            localStorage.removeItem("mm_user");
          } catch {}
        }
      } else {
        setCurrentUser(null);
        try {
          localStorage.removeItem("mm_user");
        } catch {}
      }
    } catch (err) {
      console.error("Auth check failed:", err);
      setCurrentUser(null);
    } finally {
      setIsCheckingAuth(false);
    }
  }, []);

  useEffect(() => {
    // Only verify on client if server did not provide initialUser
    if (initialUser === undefined) {
      checkAuth();
    }
  }, [checkAuth, initialUser]);

  // Keep localStorage in sync with currentUser
  useEffect(() => {
    if (currentUser) {
      try {
        localStorage.setItem("mm_user", JSON.stringify(currentUser));
      } catch {}
    } else {
      try {
        localStorage.removeItem("mm_user");
      } catch {}
    }
  }, [currentUser]);

  // Load unread notifications count
  const loadNotificationsCount = useCallback(async () => {
    if (!currentUser) return;
    try {
      const res = await fetch("/api/notifications?filter=unread");
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setUnreadNotificationsCount(json.data.unreadCount || 0);
        }
      }
    } catch {
      // Ignore
    }
  }, [currentUser]);

  useEffect(() => {
    loadNotificationsCount();
  }, [loadNotificationsCount]);

  // Load pending actions count for admin
  const loadPendingActionsCount = useCallback(async () => {
    if (!currentUser || currentUser.role !== "admin") {
      setPendingActionsCount(0);
      return;
    }
    try {
      const res = await fetch("/api/actions?status=pending");
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setPendingActionsCount(json.data.length);
        }
      }
    } catch {
      // Ignore
    }
  }, [currentUser]);

  useEffect(() => {
    loadPendingActionsCount();
  }, [loadPendingActionsCount, activeView]);

  // Handle SPA Link clicks on Sidebar
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest("a");
      if (!target) return;

      const href = target.getAttribute("href");
      if (!href) return;

      const cleanPath = href.replace(/^\//, "");
      const validViews: ActiveViewType[] = [
        "dashboard",
        "tasks",
        "calendar",
        "actions",
        "evaluation",
        "reports",
        "registration",
        "password",
        "users",
        "settings",
        "notifications",
      ];

      if (validViews.includes(cleanPath as ActiveViewType)) {
        e.preventDefault();
        setActiveView(cleanPath as ActiveViewType);
        window.history.pushState(null, "", "/" + cleanPath);
      }
    };

    document.addEventListener("click", handleDocumentClick);
    return () => {
      document.removeEventListener("click", handleDocumentClick);
    };
  }, []);

  // Handle Popstate (Back/Forward navigation)
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.replace(/^\//, "") as ActiveViewType;
      if (
        [
          "dashboard",
          "tasks",
          "calendar",
          "actions",
          "evaluation",
          "reports",
          "registration",
          "password",
          "users",
          "settings",
          "notifications",
        ].includes(path)
      ) {
        setActiveView(path);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Login Submit
  const handleLoginSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!loginEmail || !loginPassword) {
      error("Email dan password wajib diisi.");
      return;
    }

    setAuthLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: loginEmail,
          password: loginPassword,
        }),
      });

      const json = await res.json();
      if (json.success && json.data?.user) {
        success(`Selamat datang kembali, ${json.data.user.full_name}!`);
        setCurrentUser(json.data.user);
        try {
          localStorage.setItem("mm_user", JSON.stringify(json.data.user));
        } catch {}
        setActiveView("dashboard");
      } else {
        error(json.message || "Gagal masuk. Periksa kembali email dan password.");
      }
    } catch (err) {
      console.error(err);
      error("Terjadi kendala jaringan saat menghubungi server.");
    } finally {
      setAuthLoading(false);
    }
  };

  // Logout Submit
  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Ignore
    }
    setCurrentUser(null);
    try {
      localStorage.removeItem("mm_user");
    } catch {}
    setActiveView("dashboard");
    info("Anda telah keluar dari sistem.");
  };

  // Open Task Detail & Discussion Modal
  const openTaskDetailModal = async (task: Task) => {
    setDetailModalTask(task);
    setDetailComments([]);
    setReplyTarget(null);
    setNewCommentText("");
    setCommentsLoading(true);

    try {
      const res = await fetch(`/api/tasks/${task.id}/comments`);
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setDetailComments(json.data || []);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCommentsLoading(false);
    }
  };

  // Submit Detail Modal Comment
  const handleDetailCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!detailModalTask || !newCommentText.trim()) return;

    setSubmittingComment(true);
    try {
      const res = await fetch(`/api/tasks/${detailModalTask.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: newCommentText.trim(),
          parent_id: replyTarget ? replyTarget.id : null,
        }),
      });

      const json = await res.json();
      if (json.success) {
        success("Komentar terkirim!");
        setNewCommentText("");
        setReplyTarget(null);
        // Refresh comments
        const freshRes = await fetch(
          `/api/tasks/${detailModalTask.id}/comments`
        );
        if (freshRes.ok) {
          const freshJson = await freshRes.json();
          if (freshJson.success) setDetailComments(freshJson.data || []);
        }
      } else {
        error(json.message || "Gagal mengirim komentar.");
      }
    } catch (err) {
      console.error(err);
      error("Terjadi kesalahan jaringan.");
    } finally {
      setSubmittingComment(false);
    }
  };

  // Helper for formatting local date time without UTC offset corruption
  const formatLocalDateTime = (d: Date) => {
    if (isNaN(d.getTime())) return "";
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  // Open Status Update Modal
  const openStatusUpdateModal = (task: Task) => {
    setStatusModalTask(task);
    const d = new Date(task.deadline);
    const formattedDeadline = formatLocalDateTime(d);

    setStatusForm({
      nextStatus: task.status === "Selesai" ? "Dalam Proses" : task.status,
      deadline: formattedDeadline,
      pendingReason: task.pending_reason || "",
      evidenceUrl: task.evidence_url || "",
    });
  };

  // Submit Status Update
  const handleStatusModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusModalTask) return;

    if (statusForm.nextStatus === "Pending" && !statusForm.pendingReason.trim()) {
      error("Alasan penundaan wajib diisi untuk status Pending.");
      return;
    }

    if (statusForm.nextStatus === "Selesai" && !statusForm.evidenceUrl.trim()) {
      error("Tautan bukti pekerjaan wajib dicantumkan.");
      return;
    }

    setStatusLoading(true);
    try {
      const payload: Record<string, any> = {
        status: statusForm.nextStatus,
      };

      if (statusForm.nextStatus === "Pending") {
        payload.pending_reason = statusForm.pendingReason.trim();
      }

      if (statusForm.nextStatus === "Selesai") {
        payload.evidence_url = statusForm.evidenceUrl.trim();
      }

      if (statusForm.deadline) {
        payload.deadline = statusForm.deadline;
      }

      const res = await fetch(`/api/tasks/${statusModalTask.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success) {
        success(json.message || "Status pekerjaan berhasil diperbarui!");
        setStatusModalTask(null);
        setDashboardRefreshKey((k) => k + 1);
      } else {
        error(json.message || "Gagal memperbarui status.");
      }
    } catch (err) {
      console.error(err);
      error("Terjadi kendala jaringan.");
    } finally {
      setStatusLoading(false);
    }
  };

  // Group nested comments
  const nestedComments = useMemo(() => {
    const rootComments = detailComments.filter((c) => !c.parent_id);
    const repliesMap: Record<number, Comment[]> = {};
    detailComments.forEach((c) => {
      if (c.parent_id) {
        if (!repliesMap[c.parent_id]) repliesMap[c.parent_id] = [];
        repliesMap[c.parent_id].push(c);
      }
    });
    return { rootComments, repliesMap };
  }, [detailComments]);

  // Dynamic Breadcrumbs
  const breadcrumbs = useMemo(() => {
    switch (activeView) {
      case "dashboard":
        return [{ label: "Workspace" }, { label: "Dashboard" }];
      case "tasks":
        return [
          { label: "Workspace" },
          {
            label:
              currentUser?.role === "user" ? "Pekerjaan Saya" : "Pekerjaan",
          },
        ];
      case "calendar":
        return [{ label: "Perencanaan" }, { label: "Kalender" }];
      case "actions":
        return [{ label: "Administrasi" }, { label: "Perlu Tindakan" }];
      case "evaluation":
        return [{ label: "Kinerja" }, { label: "Evaluasi & Ranking" }];
      case "reports":
        return [{ label: "Analisis" }, { label: "Laporan" }];
      case "registration":
        return [{ label: "Akses Pengguna" }, { label: "Pendaftaran" }];
      case "password":
        return [{ label: "Keamanan Akun" }, { label: "Ganti Password" }];
      case "users":
        return [{ label: "Administrasi" }, { label: "Pengguna" }];
      case "settings":
        return [{ label: "Konfigurasi" }, { label: "Pengaturan" }];
      case "notifications":
        return [{ label: "Pusat Informasi" }, { label: "Notifikasi" }];
      default:
        return [{ label: "Workspace" }, { label: "Dashboard" }];
    }
  }, [activeView, currentUser?.role]);

  // 1. Unauthenticated View (AuthLayout with Login)
  if (!currentUser) {
    return (
      <AuthLayout
        title="Selamat Datang Kembali"
        subtitle="Masuk untuk memantau pekerjaan dan progres tim Anda."
        footerNote={
          <div>
            Management Monitor &copy; 2026 &middot; Desain Standar Mitra UI &middot;
            Solusi tata kelola terintegrasi.
          </div>
        }
      >
        <div className="space-y-5">
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <FormField label="Email" required>
              <Input
                type="email"
                required
                placeholder="admin@demo.com"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                leftAddon={<Mail className="h-4 w-4" />}
              />
            </FormField>

            <FormField label="Password" required>
              <Input
                type={showLoginPassword ? "text" : "password"}
                required
                placeholder="••••••••"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                leftAddon={<Lock className="h-4 w-4" />}
                rightAddon={
                  <button
                    type="button"
                    onClick={() =>
                      setShowLoginPassword(!showLoginPassword)
                    }
                    className="cursor-pointer text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300"
                  >
                    {showLoginPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                }
              />
            </FormField>

            <Button
              type="submit"
              variant="primary"
              className="w-full py-2.5 font-semibold text-sm shadow-xs"
              isLoading={authLoading}
            >
              Masuk ke Sistem
            </Button>
          </form>
        </div>
      </AuthLayout>
    );
  }

  // 2. Authenticated View (AppShell with Active View Component)
  return (
    <AppShell
      role={currentUser.role}
      user={{
        name: currentUser.full_name,
        role:
          currentUser.role === "admin"
            ? "Administrator Sistem"
            : currentUser.job_title || "Staf",
        initials: currentUser.avatar_initials,
        email: currentUser.email,
      }}
      breadcrumbs={breadcrumbs}
      unreadNotificationsCount={unreadNotificationsCount}
      pendingActionsCount={pendingActionsCount}
      onNotificationsClick={() => setActiveView("notifications")}
      onLogout={handleLogout}
      activePath={`/${activeView}`}
      onNavigate={(path) => {
        const clean = path.replace(/^\//, "") as ActiveViewType;
        setActiveView(clean);
        window.history.pushState(null, "", path);
      }}
    >
      {/* View Component Switcher */}
      {activeView === "dashboard" && (
        <DashboardView
          key={dashboardRefreshKey}
          user={currentUser}
          onOpenCreateTask={() => {
            setActiveView("tasks");
            window.history.pushState(null, "", "/tasks");
            setCreateTaskModalOpen(true);
          }}
          onOpenTaskDetail={(task) => openTaskDetailModal(task)}
          onOpenStatusUpdate={(task) => openStatusUpdateModal(task)}
          onNavigate={(view) => setActiveView(view as ActiveViewType)}
        />
      )}

      {activeView === "tasks" && (
        <TasksView
          user={currentUser}
          createModalOpen={createTaskModalOpen}
          onCloseCreateModal={() => setCreateTaskModalOpen(false)}
          selectedTaskId={selectedTaskId}
          onClearSelectedTaskId={() => setSelectedTaskId(null)}
        />
      )}

      {activeView === "calendar" && (
        <CalendarView
          user={currentUser}
          onOpenTaskDetail={(task) => openTaskDetailModal(task)}
        />
      )}

      {activeView === "actions" && (
        <ActionsView
          user={currentUser}
          onActionResolved={loadPendingActionsCount}
          onOpenTaskDetail={(taskId) => {
            setSelectedTaskId(taskId);
            setActiveView("tasks");
          }}
        />
      )}

      {activeView === "evaluation" && <EvaluationView user={currentUser} />}

      {activeView === "reports" && (
        <ReportsView
          user={currentUser}
          onOpenTaskDetail={(task) => openTaskDetailModal(task)}
        />
      )}

      {activeView === "users" && <UsersView currentUser={currentUser} />}

      {activeView === "settings" && <SettingsView user={currentUser} />}

      {activeView === "password" && (
        <ChangePasswordView user={currentUser} />
      )}

      {activeView === "registration" && (
        <RegistrationView user={currentUser} />
      )}

      {activeView === "notifications" && (
        <NotificationsView
          user={currentUser}
          onOpenTaskDetail={(taskId) => {
            setSelectedTaskId(taskId);
            setActiveView("tasks");
          }}
          onRefreshNotifications={loadNotificationsCount}
        />
      )}

      {/* Global Detail & Discussion Modal */}
      <Modal
        isOpen={Boolean(detailModalTask)}
        onClose={() => setDetailModalTask(null)}
        title={
          <div className="flex items-center gap-2">
            <span>Detail Pekerjaan</span>
            {detailModalTask && (
              <span className="font-mono text-xs font-normal text-slate-400">
                {detailModalTask.code}
              </span>
            )}
          </div>
        }
        subtitle="Diskusi dan catatan bukti pekerjaan"
        size="xl"
      >
        {detailModalTask && (
          <div className="space-y-6">
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-zinc-800 dark:bg-zinc-900/40 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100">
                  {detailModalTask.title}
                </h3>
                <div className="flex items-center gap-2">
                  <PriorityBadge priority={detailModalTask.priority} />
                  <StatusPill status={detailModalTask.status} />
                </div>
              </div>

              {detailModalTask.description && (
                <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed">
                  {detailModalTask.description}
                </p>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-200 dark:border-zinc-800 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">
                    Pemilik
                  </span>
                  <div className="font-medium text-slate-800 dark:text-zinc-200">
                    {detailModalTask.owner_name || "Staf"}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">
                    Kategori
                  </span>
                  <div className="font-medium text-slate-800 dark:text-zinc-200">
                    {detailModalTask.category}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">
                    Deadline
                  </span>
                  <div className="font-medium text-slate-800 dark:text-zinc-200">
                    {new Date(detailModalTask.deadline).toLocaleDateString(
                      "id-ID",
                      {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      }
                    )}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">
                    Bukti Selesai
                  </span>
                  <div>
                    {detailModalTask.evidence_url ? (
                      <a
                        href={detailModalTask.evidence_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:underline flex items-center gap-1"
                      >
                        Tautan Bukti <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Comments thread */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-800 pb-2">
                <h4 className="text-sm font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-blue-600" />
                  Diskusi & Komentar
                  <span className="text-xs font-normal text-slate-400">
                    ({detailComments.length})
                  </span>
                </h4>
              </div>

              <div className="max-h-[280px] overflow-y-auto space-y-3 pr-1">
                {commentsLoading ? (
                  <div className="py-6 text-center text-xs text-slate-400">
                    Memuat komentar...
                  </div>
                ) : detailComments.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-400">
                    Belum ada komentar pada pekerjaan ini.
                  </div>
                ) : (
                  nestedComments.rootComments.map((root) => {
                    const replies = nestedComments.repliesMap[root.id] || [];
                    return (
                      <div key={root.id} className="space-y-2">
                        <div className="rounded-lg border border-slate-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900/60">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-700">
                                {root.author_avatar ||
                                  root.author_name?.slice(0, 2).toUpperCase() ||
                                  "U"}
                              </span>
                              <span className="text-xs font-bold text-slate-900 dark:text-zinc-100">
                                {root.author_name}
                              </span>
                              {root.author_role === "admin" && (
                                <span className="rounded bg-blue-100 px-1 py-0.2 text-[9px] font-bold text-blue-700">
                                  Admin
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400">
                              {new Date(root.created_at).toLocaleDateString(
                                "id-ID",
                                {
                                  day: "numeric",
                                  month: "short",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )}
                            </span>
                          </div>

                          <p className="mt-2 text-xs text-slate-700 dark:text-zinc-300 leading-relaxed">
                            {root.text}
                          </p>

                          <div className="mt-2 flex justify-end">
                            <button
                              type="button"
                              onClick={() =>
                                setReplyTarget({
                                  id: root.id,
                                  author: root.author_name || "Pengguna",
                                })
                              }
                              className="text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer active:scale-[0.98]"
                            >
                              <CornerDownRight className="h-3 w-3" /> Balas
                            </button>
                          </div>
                        </div>

                        {replies.length > 0 && (
                          <div className="ml-6 space-y-2 border-l-2 border-blue-200 dark:border-blue-900/50 pl-3">
                            {replies.map((reply) => (
                              <div
                                key={reply.id}
                                className="rounded-lg border border-slate-100 bg-slate-50/60 p-2.5 dark:border-zinc-800/80 dark:bg-zinc-900/30"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-1.5">
                                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-[9px] font-bold text-slate-700">
                                      {reply.author_avatar ||
                                        reply.author_name
                                          ?.slice(0, 2)
                                          .toUpperCase() ||
                                        "U"}
                                    </span>
                                    <span className="text-xs font-semibold text-slate-800 dark:text-zinc-200">
                                      {reply.author_name}
                                    </span>
                                  </div>
                                  <span className="text-[9px] text-slate-400">
                                    {new Date(reply.created_at).toLocaleDateString(
                                      "id-ID",
                                      {
                                        day: "numeric",
                                        month: "short",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      }
                                    )}
                                  </span>
                                </div>
                                <p className="mt-1.5 text-xs text-slate-600 dark:text-zinc-300 leading-relaxed">
                                  {reply.text}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Add Comment Form */}
              <form onSubmit={handleDetailCommentSubmit} className="space-y-2 pt-2">
                {replyTarget && (
                  <div className="flex items-center justify-between rounded-md bg-blue-50 px-2.5 py-1 text-xs text-blue-800 dark:bg-blue-950/40 dark:text-blue-300">
                    <span className="flex items-center gap-1">
                      <CornerDownRight className="h-3 w-3" /> Membalas{" "}
                      <strong>@{replyTarget.author}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => setReplyTarget(null)}
                      className="text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}

                <Textarea
                  required
                  rows={2}
                  placeholder="Tulis komentar atau tanggapan..."
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                />

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    isLoading={submittingComment}
                    leftIcon={<Send className="h-3.5 w-3.5" />}
                  >
                    Kirim Komentar
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </Modal>

      {/* Global Status Update Modal */}
      <Modal
        isOpen={Boolean(statusModalTask)}
        onClose={() => setStatusModalTask(null)}
        title="Perbarui Status Pekerjaan"
        subtitle={
          statusModalTask
            ? `${statusModalTask.code} · ${statusModalTask.title}`
            : "Pilih status dan lengkapi persyaratan."
        }
        size="md"
      >
        {statusModalTask && (
          <form onSubmit={handleStatusModalSubmit} className="space-y-4">
            <FormField label="Status Pekerjaan" required>
              <Select
                value={statusForm.nextStatus}
                onChange={(e) =>
                  setStatusForm({ ...statusForm, nextStatus: e.target.value })
                }
                options={[
                  "Belum Mulai",
                  "Dalam Proses",
                  "Pending",
                  "Selesai",
                ]}
              />
            </FormField>

            {statusForm.nextStatus === "Selesai" && (
              <div className="space-y-3 rounded-lg border border-emerald-200 bg-emerald-50/50 p-3.5 dark:border-emerald-900/40 dark:bg-emerald-950/20">
                <FormField
                  label="Tautan Bukti Pekerjaan (URL)"
                  required
                  hint="Cantumkan link Google Drive, Figma, GitHub, atau dokumen hasil."
                >
                  <Input
                    type="url"
                    required
                    placeholder="https://..."
                    value={statusForm.evidenceUrl}
                    onChange={(e) =>
                      setStatusForm({
                        ...statusForm,
                        evidenceUrl: e.target.value,
                      })
                    }
                  />
                </FormField>
                <p className="text-[11px] text-emerald-800 dark:text-emerald-300">
                  ✓ Pekerjaan tidak dapat diselesaikan tanpa melampirkan tautan bukti.
                </p>
              </div>
            )}

            {statusForm.nextStatus === "Pending" && (
              <div className="space-y-3 rounded-lg border border-amber-200 bg-amber-50/50 p-3.5 dark:border-amber-900/40 dark:bg-amber-950/20">
                <FormField
                  label="Alasan Penundaan (Pending)"
                  required
                  hint="Jelaskan kendala atau hambatan teknis yang dihadapi."
                >
                  <Textarea
                    required
                    rows={3}
                    placeholder="Contoh: Menunggu review dari tim eksternal..."
                    value={statusForm.pendingReason}
                    onChange={(e) =>
                      setStatusForm({
                        ...statusForm,
                        pendingReason: e.target.value,
                      })
                    }
                  />
                </FormField>
                <p className="text-[11px] text-amber-800 dark:text-amber-300">
                  ℹ Permintaan Pending memerlukan persetujuan dari Super Admin.
                </p>
              </div>
            )}

            <FormField label="Tenggat Waktu Baru (Opsional)">
              <Input
                type="datetime-local"
                value={statusForm.deadline}
                onChange={(e) =>
                  setStatusForm({ ...statusForm, deadline: e.target.value })
                }
              />
            </FormField>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-zinc-800">
              <Button
                variant="outline"
                type="button"
                onClick={() => setStatusModalTask(null)}
              >
                Batal
              </Button>
              <Button
                variant="primary"
                type="submit"
                isLoading={statusLoading}
              >
                Simpan Perubahan
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </AppShell>
  );
}

export type { ActiveViewType };

export function MainApp({
  initialView,
  initialUser,
}: MainAppProps) {
  return (
    <ToastProvider>
      <MainAppContent initialView={initialView} initialUser={initialUser} />
    </ToastProvider>
  );
}

export default MainApp;
