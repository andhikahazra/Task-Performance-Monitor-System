"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Search,
  Plus,
  Clock,
  RotateCw,
  MessageSquare,
  CornerDownRight,
  Send,
  ExternalLink,
  X,
  LayoutList,
  LayoutGrid,
} from "lucide-react";
import { Task, SafeUser, Comment } from "@/types/database";
import { Button } from "@/components/ui/Button";
import { StatusPill } from "@/components/ui/StatusPill";
import { PriorityBadge } from "@/components/ui/PriorityBadge";
import { PanelCard } from "@/components/ui/PanelCard";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { FormField } from "@/components/ui/FormField";
import { useToast } from "@/components/ui/Toast";

export interface TasksViewProps {
  user: SafeUser;
  createModalOpen?: boolean;
  onCloseCreateModal?: () => void;
  selectedTaskId?: number | null;
  onClearSelectedTaskId?: () => void;
}

export const TasksView: React.FC<TasksViewProps> = ({
  user,
  createModalOpen = false,
  onCloseCreateModal,
  selectedTaskId = null,
  onClearSelectedTaskId,
}) => {
  const { success, error, info } = useToast();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters
  const [search, setSearch] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");

  // View mode: 'table' (default) vs 'grid' (cards)
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  // Create Task Modal State
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(createModalOpen);
  const [createLoading, setCreateLoading] = useState<boolean>(false);
  const [createForm, setCreateForm] = useState({
    title: "",
    description: "",
    category: "Operasional",
    deadline: "",
    priority: "Menengah",
    status: "Belum Mulai",
  });

  // Task Detail & Discussion Modal State
  const [detailTask, setDetailTask] = useState<Task | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState<boolean>(false);
  const [newCommentText, setNewCommentText] = useState<string>("");
  const [replyTarget, setReplyTarget] = useState<{
    id: number;
    author: string;
  } | null>(null);
  const [submittingComment, setSubmittingComment] = useState<boolean>(false);

  // Update Status Modal State
  const [statusModalTask, setStatusModalTask] = useState<Task | null>(null);
  const [statusLoading, setStatusLoading] = useState<boolean>(false);
  const [statusForm, setStatusForm] = useState({
    nextStatus: "Dalam Proses",
    deadline: "",
    pendingReason: "",
    evidenceUrl: "",
  });

  // Sync prop createModalOpen
  useEffect(() => {
    setIsCreateOpen(createModalOpen);
  }, [createModalOpen]);

  // Load Tasks
  const loadTasks = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/tasks?include_demo=false");
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setTasks(json.data || []);
        }
      } else {
        error("Gagal memuat daftar pekerjaan dari server.");
      }
    } catch (err) {
      console.error(err);
      error("Terjadi kendala jaringan saat memuat data pekerjaan.");
    } finally {
      setIsLoading(false);
    }
  }, [error]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // Auto-open selected task if passed
  useEffect(() => {
    if (selectedTaskId && tasks.length > 0) {
      const found = tasks.find((t) => t.id === selectedTaskId);
      if (found) {
        openTaskDetail(found);
        if (onClearSelectedTaskId) {
          onClearSelectedTaskId();
        }
      }
    }
  }, [selectedTaskId, tasks, onClearSelectedTaskId]);

  // Handle Create Task
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.title.trim() || !createForm.deadline) {
      error("Judul dan tenggat waktu wajib diisi.");
      return;
    }

    setCreateLoading(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createForm),
      });

      const json = await res.json();
      if (json.success) {
        success("Pekerjaan baru berhasil dibuat!");
        setIsCreateOpen(false);
        if (onCloseCreateModal) onCloseCreateModal();
        setCreateForm({
          title: "",
          description: "",
          category: "Operasional",
          deadline: "",
          priority: "Menengah",
          status: "Belum Mulai",
        });
        loadTasks();
      } else {
        error(json.message || "Gagal membuat pekerjaan.");
      }
    } catch (err) {
      console.error(err);
      error("Terjadi kesalahan jaringan.");
    } finally {
      setCreateLoading(false);
    }
  };

  // Open Task Detail & Discussion
  const openTaskDetail = async (task: Task) => {
    setDetailTask(task);
    setComments([]);
    setReplyTarget(null);
    setNewCommentText("");
    setCommentsLoading(true);

    try {
      const res = await fetch(`/api/tasks/${task.id}/comments`);
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setComments(json.data || []);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCommentsLoading(false);
    }
  };

  // Submit Comment
  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!detailTask || !newCommentText.trim()) return;

    setSubmittingComment(true);
    try {
      const res = await fetch(`/api/tasks/${detailTask.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: newCommentText.trim(),
          parent_id: replyTarget ? replyTarget.id : null,
        }),
      });

      const json = await res.json();
      if (json.success) {
        success("Komentar berhasil dikirim!");
        setNewCommentText("");
        setReplyTarget(null);
        // Refresh comments
        const freshRes = await fetch(`/api/tasks/${detailTask.id}/comments`);
        if (freshRes.ok) {
          const freshJson = await freshRes.json();
          if (freshJson.success) {
            setComments(freshJson.data || []);
            setTasks((prev) =>
              prev.map((t) =>
                t.id === detailTask.id
                  ? { ...t, comment_count: (t.comment_count || 0) + 1 }
                  : t
              )
            );
          }
        }
      } else {
        error(json.message || "Gagal mengirim komentar.");
      }
    } catch (err) {
      console.error(err);
      error("Terjadi kendala jaringan saat mengirim komentar.");
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
  const openStatusUpdate = (task: Task) => {
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
  const handleStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusModalTask) return;

    // Validations
    if (statusForm.nextStatus === "Pending" && !statusForm.pendingReason.trim()) {
      error("Alasan penundaan wajib diisi untuk status Pending.");
      return;
    }

    if (statusForm.nextStatus === "Selesai" && !statusForm.evidenceUrl.trim()) {
      error("Tautan bukti pekerjaan wajib dicantumkan untuk menyelesaikan tugas.");
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

      // If restart or deadline changed
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
        loadTasks();
      } else {
        error(json.message || "Gagal memperbarui status.");
      }
    } catch (err) {
      console.error(err);
      error("Terjadi kesalahan koneksi ke server.");
    } finally {
      setStatusLoading(false);
    }
  };

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      // Status filter
      if (statusFilter !== "all" && t.status !== statusFilter) {
        return false;
      }
      // Priority filter
      if (priorityFilter !== "all" && t.priority !== priorityFilter) {
        return false;
      }
      // Search query
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchTitle = t.title.toLowerCase().includes(q);
        const matchCode = t.code.toLowerCase().includes(q);
        const matchOwner = t.owner_name?.toLowerCase().includes(q);
        const matchDesc = t.description?.toLowerCase().includes(q);
        if (!matchTitle && !matchCode && !matchOwner && !matchDesc) {
          return false;
        }
      }
      return true;
    });
  }, [tasks, statusFilter, priorityFilter, search]);

  // Nested comments tree grouping (top-level vs replies)
  const nestedComments = useMemo(() => {
    const rootComments = comments.filter((c) => !c.parent_id);
    const repliesMap: Record<number, Comment[]> = {};

    comments.forEach((c) => {
      if (c.parent_id) {
        if (!repliesMap[c.parent_id]) repliesMap[c.parent_id] = [];
        repliesMap[c.parent_id].push(c);
      }
    });

    return { rootComments, repliesMap };
  }, [comments]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="text-[11px] font-bold tracking-wider uppercase text-slate-500 dark:text-zinc-400">
            WORKSPACE
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-zinc-100 tracking-tight mt-1">
            {user.role === "user" ? "Pekerjaan Saya" : "Pekerjaan"}
          </h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-0.5">
            Buat, kelola, dan pantau progres pekerjaan tim.
          </p>
        </div>

        <div>
          <Button
            variant="primary"
            onClick={() => setIsCreateOpen(true)}
            leftIcon={<Plus className="h-4 w-4" />}
            className="shadow-md"
          >
            Buat Pekerjaan
          </Button>
        </div>
      </div>

      {/* Main Panel Card */}
      <PanelCard>
        {/* Filter Toolbar & View Toggle */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3 flex-1">
            {/* Search Input */}
            <div className="sm:col-span-2">
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari kode, judul, atau pemilik..."
                leftAddon={<Search className="h-4 w-4" />}
              />
            </div>

            {/* Status Filter */}
            <div>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={[
                  { label: "Semua Status", value: "all" },
                  { label: "Belum Mulai", value: "Belum Mulai" },
                  { label: "Dalam Proses", value: "Dalam Proses" },
                  { label: "Pending", value: "Pending" },
                  { label: "Selesai", value: "Selesai" },
                ]}
              />
            </div>

            {/* Priority Filter */}
            <div>
              <Select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                options={[
                  { label: "Semua Prioritas", value: "all" },
                  { label: "Kritis", value: "Kritis" },
                  { label: "Tinggi", value: "Tinggi" },
                  { label: "Menengah", value: "Menengah" },
                  { label: "Rendah", value: "Rendah" },
                ]}
              />
            </div>
          </div>

          {/* View Mode Toggle (Tabel vs Kartu) */}
          <div className="flex items-center self-start lg:self-auto bg-slate-100 dark:bg-zinc-800 p-1 rounded-xl border border-slate-200/80 dark:border-zinc-700/80 shrink-0">
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === "table"
                  ? "bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-xs"
                  : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200"
              }`}
            >
              <LayoutList className="h-4 w-4" />
              <span>Tabel</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === "grid"
                  ? "bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-xs"
                  : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200"
              }`}
            >
              <LayoutGrid className="h-4 w-4" />
              <span>Kartu</span>
            </button>
          </div>
        </div>

        {/* Content View: Table vs Cards Grid */}
        {viewMode === "table" ? (
          <div className="table-wrap rounded-lg border border-slate-200 dark:border-zinc-800 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 border-b border-slate-200 dark:border-zinc-800">
                  <th className="px-3.5 py-3 text-xs uppercase font-bold">Kode</th>
                  <th className="px-3.5 py-3 text-xs uppercase font-bold">Pekerjaan</th>
                  <th className="px-3.5 py-3 text-xs uppercase font-bold">Pemilik</th>
                  <th className="px-3.5 py-3 text-xs uppercase font-bold">Deadline</th>
                  <th className="px-3.5 py-3 text-xs uppercase font-bold">Prioritas</th>
                  <th className="px-3.5 py-3 text-xs uppercase font-bold">Status</th>
                  <th className="px-3.5 py-3 text-xs uppercase font-bold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-zinc-800">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <div className="flex items-center justify-center gap-2">
                        <RotateCw className="h-4 w-4 animate-spin text-blue-600" />
                        <span>Memuat data pekerjaan...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredTasks.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      Tidak ada pekerjaan yang cocok dengan filter.
                    </td>
                  </tr>
                ) : (
                  filteredTasks.map((task) => (
                    <tr
                      key={task.id}
                      className="hover:bg-blue-50/40 dark:hover:bg-zinc-800/30 transition-colors"
                    >
                      <td className="text-slate-800 dark:text-zinc-200 text-sm py-3 px-3.5 border-b border-slate-100 dark:border-zinc-800/60">
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-mono font-medium bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400 border border-slate-200/80 dark:border-zinc-700/60">
                          {task.code}
                        </span>
                      </td>
                      <td className="text-slate-800 dark:text-zinc-200 text-sm py-3 px-3.5 border-b border-slate-100 dark:border-zinc-800/60">
                        <div className="font-semibold text-slate-900 dark:text-zinc-100">
                          {task.title}
                        </div>
                        <div className="text-[11px] text-slate-400 dark:text-zinc-500">
                          {task.category}
                        </div>
                      </td>
                      <td className="text-slate-800 dark:text-zinc-200 text-sm py-3 px-3.5 border-b border-slate-100 dark:border-zinc-800/60">
                        <div className="flex items-center gap-1.5">
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 dark:bg-zinc-800 text-[10px] font-bold text-slate-600 dark:text-zinc-400">
                            {task.owner_name?.slice(0, 2).toUpperCase() || "ST"}
                          </span>
                          <span>{task.owner_name || "Staf"}</span>
                        </div>
                      </td>
                      <td className="text-slate-800 dark:text-zinc-200 text-sm py-3 px-3.5 border-b border-slate-100 dark:border-zinc-800/60 whitespace-nowrap">
                        {new Date(task.deadline).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="text-slate-800 dark:text-zinc-200 text-sm py-3 px-3.5 border-b border-slate-100 dark:border-zinc-800/60">
                        <PriorityBadge priority={task.priority} />
                      </td>
                      <td className="text-slate-800 dark:text-zinc-200 text-sm py-3 px-3.5 border-b border-slate-100 dark:border-zinc-800/60">
                        <StatusPill status={task.status} />
                      </td>
                      <td className="text-slate-800 dark:text-zinc-200 text-sm py-3 px-3.5 border-b border-slate-100 dark:border-zinc-800/60 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openTaskDetail(task)}
                            className="px-2.5 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-md transition-colors cursor-pointer active:scale-[0.98]"
                          >
                            Lihat Detail
                          </button>
                          <button
                            type="button"
                            onClick={() => openStatusUpdate(task)}
                            className="px-2.5 py-1 text-xs font-medium text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-md transition-colors cursor-pointer active:scale-[0.98]"
                          >
                            Ubah Status
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div>
            {isLoading ? (
              <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
                <RotateCw className="h-6 w-6 animate-spin text-blue-600" />
                <span className="text-sm font-medium">Memuat data pekerjaan...</span>
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="py-16 text-center text-slate-400">
                Tidak ada pekerjaan yang cocok dengan filter.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredTasks.map((task) => {
                  const ownerInitials = task.owner_name?.slice(0, 2).toUpperCase() || "ST";
                  const deadlineDate = new Date(task.deadline);
                  const formattedDeadline = !isNaN(deadlineDate.getTime())
                    ? deadlineDate.toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "-";

                  return (
                    <div
                      key={task.id}
                      className="flex flex-col justify-between rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 p-4.5 shadow-xs hover:border-blue-400/80 dark:hover:border-blue-500/60 hover:shadow-md transition-all duration-150"
                    >
                      <div>
                        {/* Header: Code & Category + Priority & Status */}
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-200/80 dark:border-zinc-700/80">
                              {task.code}
                            </span>
                            <span className="text-[11px] font-medium text-slate-500 dark:text-zinc-400 truncate">
                              {task.category}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <PriorityBadge priority={task.priority} />
                            <StatusPill status={task.status} />
                          </div>
                        </div>

                        {/* Title & Description */}
                        <h3
                          onClick={() => openTaskDetail(task)}
                          className="font-bold text-sm text-slate-900 dark:text-zinc-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors leading-snug cursor-pointer line-clamp-2"
                        >
                          {task.title}
                        </h3>
                        <p className="text-xs text-slate-600 dark:text-zinc-400 mt-1.5 line-clamp-2 leading-relaxed">
                          {task.description || "Tidak ada deskripsi pekerjaan."}
                        </p>

                        {/* Owner & Deadline Meta */}
                        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-zinc-800/80 flex items-center justify-between gap-2 text-xs">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-zinc-800 text-[10px] font-bold text-slate-700 dark:text-zinc-300">
                              {ownerInitials}
                            </span>
                            <div className="min-w-0">
                              <span className="font-medium text-slate-800 dark:text-zinc-200 truncate block">
                                {task.owner_name || "Staf"}
                              </span>
                              {task.owner_department && (
                                <span className="text-[10px] text-slate-400 dark:text-zinc-500 truncate block">
                                  {task.owner_department}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-zinc-400 shrink-0">
                            <Clock className="h-3.5 w-3.5 text-slate-400" />
                            <span>{formattedDeadline}</span>
                          </div>
                        </div>
                      </div>

                      {/* Footer Actions: Comments Count & Buttons */}
                      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-zinc-800/80 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => openTaskDetail(task)}
                          className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                        >
                          <MessageSquare className="h-3.5 w-3.5" />
                          <span>Komentar ({task.comment_count || 0})</span>
                        </button>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => openTaskDetail(task)}
                            className="px-2.5 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-md transition-colors cursor-pointer active:scale-[0.98]"
                          >
                            Lihat Detail
                          </button>
                          <button
                            type="button"
                            onClick={() => openStatusUpdate(task)}
                            className="px-2.5 py-1 text-xs font-medium text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-md transition-colors cursor-pointer active:scale-[0.98]"
                          >
                            Ubah Status
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Footer info */}
        <div className="mt-4 flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400">
          <div>
            Menampilkan <span className="font-semibold">{filteredTasks.length}</span>{" "}
            dari <span className="font-semibold">{tasks.length}</span> pekerjaan
          </div>
        </div>
      </PanelCard>

      {/* 1. Modal Buat Pekerjaan */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => {
          setIsCreateOpen(false);
          if (onCloseCreateModal) onCloseCreateModal();
        }}
        title="Buat Pekerjaan Baru"
        subtitle="Masukkan rincian pekerjaan dan tentukan tenggat waktu."
        size="lg"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <FormField label="Judul Pekerjaan" required>
            <Input
              required
              placeholder="Contoh: Rekapitulasi Laporan Keuangan Bulanan"
              value={createForm.title}
              onChange={(e) =>
                setCreateForm({ ...createForm, title: e.target.value })
              }
            />
          </FormField>

          <FormField label="Deskripsi">
            <Textarea
              placeholder="Jelaskan instruksi atau ruang lingkup pekerjaan ini..."
              rows={3}
              value={createForm.description}
              onChange={(e) =>
                setCreateForm({ ...createForm, description: e.target.value })
              }
            />
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Tenggat Waktu (Deadline)" required>
              <Input
                type="datetime-local"
                required
                value={createForm.deadline}
                onChange={(e) =>
                  setCreateForm({ ...createForm, deadline: e.target.value })
                }
              />
            </FormField>

            <FormField label="Kategori" required>
              <Select
                value={createForm.category}
                onChange={(e) =>
                  setCreateForm({ ...createForm, category: e.target.value })
                }
                options={[
                  "Operasional",
                  "Administrasi",
                  "Proyek",
                  "Keuangan",
                  "Teknologi",
                  "Lainnya",
                ]}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Prioritas" required>
              <Select
                value={createForm.priority}
                onChange={(e) =>
                  setCreateForm({ ...createForm, priority: e.target.value })
                }
                options={["Menengah", "Tinggi", "Rendah", "Kritis"]}
              />
            </FormField>

            <FormField label="Status Awal" required>
              <Select
                value={createForm.status}
                onChange={(e) =>
                  setCreateForm({ ...createForm, status: e.target.value })
                }
                options={["Belum Mulai", "Dalam Proses"]}
              />
            </FormField>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-zinc-800">
            <Button
              variant="outline"
              type="button"
              onClick={() => {
                setIsCreateOpen(false);
                if (onCloseCreateModal) onCloseCreateModal();
              }}
            >
              Batal
            </Button>
            <Button variant="primary" type="submit" isLoading={createLoading}>
              Simpan Pekerjaan
            </Button>
          </div>
        </form>
      </Modal>

      {/* 2. Modal Detail & Diskusi Komentar (Nested Replies) */}
      <Modal
        isOpen={Boolean(detailTask)}
        onClose={() => setDetailTask(null)}
        title={
          <div className="flex items-center gap-2">
            <span>Detail Pekerjaan</span>
            {detailTask && (
              <span className="font-mono text-xs font-normal text-slate-400">
                {detailTask.code}
              </span>
            )}
          </div>
        }
        subtitle="Diskusi dan catatan bukti pekerjaan"
        size="xl"
      >
        {detailTask && (
          <div className="space-y-6">
            {/* Task Info Header Card */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-zinc-800 dark:bg-zinc-900/40 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100">
                  {detailTask.title}
                </h3>
                <div className="flex items-center gap-2">
                  <PriorityBadge priority={detailTask.priority} />
                  <StatusPill status={detailTask.status} />
                </div>
              </div>

              {detailTask.description && (
                <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed">
                  {detailTask.description}
                </p>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-200 dark:border-zinc-800 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">
                    Pemilik
                  </span>
                  <div className="font-medium text-slate-800 dark:text-zinc-200">
                    {detailTask.owner_name || "Staf"}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">
                    Kategori
                  </span>
                  <div className="font-medium text-slate-800 dark:text-zinc-200">
                    {detailTask.category}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">
                    Deadline
                  </span>
                  <div className="font-medium text-slate-800 dark:text-zinc-200">
                    {new Date(detailTask.deadline).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">
                    Bukti Selesai
                  </span>
                  <div>
                    {detailTask.evidence_url ? (
                      <a
                        href={detailTask.evidence_url}
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

            {/* Discussion Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-800 pb-2">
                <h4 className="text-sm font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-blue-600" />
                  Diskusi & Komentar
                  <span className="text-xs font-normal text-slate-400">
                    ({comments.length})
                  </span>
                </h4>
                <span className="text-[11px] text-slate-400">
                  Balas komentar untuk menjaga alur konteks
                </span>
              </div>

              {/* Comments Thread List */}
              <div className="max-h-[300px] overflow-y-auto space-y-3 pr-1">
                {commentsLoading ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    Memuat komentar...
                  </div>
                ) : comments.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    Belum ada komentar. Mulai diskusi di bawah.
                  </div>
                ) : (
                  nestedComments.rootComments.map((root) => {
                    const replies = nestedComments.repliesMap[root.id] || [];
                    return (
                      <div key={root.id} className="space-y-2">
                        {/* Root Comment */}
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
                              {new Date(root.created_at).toLocaleDateString("id-ID", {
                                day: "numeric",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
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

                        {/* Nested Replies */}
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
              <form onSubmit={handleCommentSubmit} className="space-y-2 pt-2">
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

                <div className="relative">
                  <Textarea
                    required
                    rows={2}
                    placeholder="Tulis komentar atau tanggapan..."
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                  />
                </div>

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

      {/* 3. Modal Ubah Status */}
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
          <form onSubmit={handleStatusSubmit} className="space-y-4">
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

            {/* Conditional 1: Status Selesai requires evidence link */}
            {statusForm.nextStatus === "Selesai" && (
              <div className="space-y-3 rounded-lg border border-emerald-200 bg-emerald-50/50 p-3.5 dark:border-emerald-900/40 dark:bg-emerald-950/20">
                <FormField
                  label="Tautan Bukti Pekerjaan (URL)"
                  required
                  hint="Cantumkan link Google Drive, Figma, GitHub, atau dokumen hasil pekerjaan."
                >
                  <Input
                    type="url"
                    required
                    placeholder="https://..."
                    value={statusForm.evidenceUrl}
                    onChange={(e) =>
                      setStatusForm({ ...statusForm, evidenceUrl: e.target.value })
                    }
                  />
                </FormField>
                <p className="text-[11px] text-emerald-800 dark:text-emerald-300">
                  ✓ Pekerjaan tidak dapat diselesaikan tanpa melampirkan tautan bukti.
                </p>
              </div>
            )}

            {/* Conditional 2: Status Pending requires reason */}
            {statusForm.nextStatus === "Pending" && (
              <div className="space-y-3 rounded-lg border border-amber-200 bg-amber-50/50 p-3.5 dark:border-amber-900/40 dark:bg-amber-950/20">
                <FormField
                  label="Alasan Penundaan (Pending)"
                  required
                  hint="Jelaskan kendala, hambatan teknis, atau pihak eksternal yang ditunggu."
                >
                  <Textarea
                    required
                    rows={3}
                    placeholder="Contoh: Menunggu approval dari pihak klien untuk aset desain..."
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

            {/* Conditional 3: Status restart from Selesai or updating Deadline */}
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
              <Button variant="primary" type="submit" isLoading={statusLoading}>
                Simpan Perubahan
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default TasksView;
