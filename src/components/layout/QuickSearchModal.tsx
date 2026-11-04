"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  Search,
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
  Bell,
  ArrowRight,
  PlusCircle,
  X,
  CornerDownLeft,
  Sparkles,
  Command,
  SlidersHorizontal,
} from "lucide-react";

export interface QuickSearchItem {
  id: string;
  title: string;
  subtitle?: string;
  category: "menu" | "action" | "task";
  href: string;
  icon: React.ReactNode;
  badge?: string;
  badgeVariant?: "default" | "success" | "warning" | "danger" | "info";
  adminOnly?: boolean;
}

export interface QuickSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  role?: "admin" | "user";
  onNavigate?: (path: string) => void;
}

type CategoryFilter = "all" | "menu" | "action" | "task";

export const QuickSearchModal: React.FC<QuickSearchModalProps> = ({
  isOpen,
  onClose,
  role = "admin",
  onNavigate,
}) => {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>("all");
  const [taskResults, setTaskResults] = useState<QuickSearchItem[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Static navigation items
  const baseMenuItems: QuickSearchItem[] = useMemo(
    () => [
      {
        id: "nav-dashboard",
        title: "Dashboard Utama",
        subtitle: "Ringkasan metrik kinerja, KPI, dan visualisasi aktivitas",
        category: "menu",
        href: "/dashboard",
        icon: <LayoutDashboard className="h-4 w-4" />,
      },
      {
        id: "nav-tasks",
        title: role === "user" ? "Pekerjaan Saya" : "Daftar Pekerjaan",
        subtitle: "Manajemen tugas, prioritas kerja, deadline, dan progres",
        category: "menu",
        href: "/tasks",
        icon: <CheckSquare className="h-4 w-4" />,
      },
      {
        id: "nav-calendar",
        title: "Kalender Aktivitas",
        subtitle: "Timeline deadline, jadwal kerja bulanan, dan agenda tim",
        category: "menu",
        href: "/calendar",
        icon: <Calendar className="h-4 w-4" />,
      },
      {
        id: "nav-actions",
        title: role === "user" ? "Status Permohonan" : "Perlu Tindakan",
        subtitle:
          role === "user"
            ? "Pantau status permohonan persetujuan tugas Anda"
            : "Verifikasi tugas selesai dan persetujuan pendaftaran user",
        category: "menu",
        href: "/actions",
        icon: <Clock className="h-4 w-4" />,
      },
      {
        id: "nav-evaluation",
        title: "Evaluasi & Ranking",
        subtitle: "Peringkat nilai KPI pegawai, capaian target, dan evaluasi",
        category: "menu",
        href: "/evaluation",
        icon: <TrendingUp className="h-4 w-4" />,
      },
      {
        id: "nav-reports",
        title: "Laporan & Rekap",
        subtitle: "Ekspor rekap kinerja, laporan berkala, dan unduh data",
        category: "menu",
        href: "/reports",
        icon: <FileText className="h-4 w-4" />,
      },
      {
        id: "nav-password",
        title: "Ganti Password",
        subtitle: "Pengaturan keamanan dan pembaruan kata sandi akun",
        category: "menu",
        href: "/password",
        icon: <KeyRound className="h-4 w-4" />,
      },
      {
        id: "nav-users",
        title: "Manajemen Pengguna",
        subtitle: "Daftar pengguna aktif, pengaturan peran, dan hak akses",
        category: "menu",
        href: "/users",
        icon: <Users className="h-4 w-4" />,
        adminOnly: true,
      },
      {
        id: "nav-settings",
        title: "Pengaturan Sistem",
        subtitle: "Kustomisasi skema tema warna, preferensi, dan konfigurasi",
        category: "menu",
        href: "/settings",
        icon: <Settings className="h-4 w-4" />,
        adminOnly: true,
      },
      {
        id: "nav-notifications",
        title: "Pusat Notifikasi",
        subtitle: "Riwayat peringatan tugas, konfirmasi, dan informasi penting",
        category: "menu",
        href: "/notifications",
        icon: <Bell className="h-4 w-4" />,
      },
    ],
    [role]
  );

  // Quick Action items
  const quickActions: QuickSearchItem[] = useMemo(
    () => [
      {
        id: "act-new-task",
        title: "Buat Pekerjaan Baru",
        subtitle: "Buka form pembuatan tugas dan target capaian kerja baru",
        category: "action",
        href: "/tasks",
        icon: <PlusCircle className="h-4 w-4" />,
        badge: "Tugas Baru",
        badgeVariant: "info",
      },
      {
        id: "act-settings-theme",
        title: "Ganti Skema Tema Warna",
        subtitle: "Buka pengaturan tema (Light, Ocean, Emerald, Midnight)",
        category: "action",
        href: "/settings",
        icon: <Settings className="h-4 w-4" />,
        badge: "Tampilan",
        badgeVariant: "default",
      },
      {
        id: "act-change-pw",
        title: "Perbarui Kata Sandi",
        subtitle: "Langsung buka formulir ubah kata sandi akun Anda",
        category: "action",
        href: "/password",
        icon: <KeyRound className="h-4 w-4" />,
        badge: "Keamanan",
        badgeVariant: "warning",
      },
    ],
    []
  );

  // Filter items by role, category tab, and search query
  const filteredMenuItems = useMemo(() => {
    if (activeCategory !== "all" && activeCategory !== "menu") return [];

    const roleFiltered = baseMenuItems.filter(
      (item) => !item.adminOnly || role === "admin"
    );
    if (!query.trim()) return roleFiltered;

    const q = query.toLowerCase();
    return roleFiltered.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        (item.subtitle && item.subtitle.toLowerCase().includes(q))
    );
  }, [baseMenuItems, query, role, activeCategory]);

  const filteredActions = useMemo(() => {
    if (activeCategory !== "all" && activeCategory !== "action") return [];

    if (!query.trim()) return quickActions;
    const q = query.toLowerCase();
    return quickActions.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        (item.subtitle && item.subtitle.toLowerCase().includes(q))
    );
  }, [quickActions, query, activeCategory]);

  // Debounced search for tasks from API when user types
  useEffect(() => {
    if (activeCategory !== "all" && activeCategory !== "task") {
      setTaskResults([]);
      return;
    }

    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setTaskResults([]);
      setIsLoadingTasks(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoadingTasks(true);
      try {
        const res = await fetch(`/api/tasks?search=${encodeURIComponent(trimmed)}`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data)) {
            const mapped: QuickSearchItem[] = json.data.slice(0, 5).map((t: any) => ({
              id: `task-${t.id}`,
              title: t.title,
              subtitle: `${t.task_code || "TUGAS"} • ${t.owner_name || "Staf"} • Status: ${t.status}`,
              category: "task" as const,
              href: `/tasks`,
              icon: <CheckSquare className="h-4 w-4" />,
              badge: t.priority ? t.priority.toUpperCase() : "MEDIUM",
              badgeVariant:
                t.priority === "urgent"
                  ? "danger"
                  : t.priority === "high"
                  ? "warning"
                  : "default",
            }));
            setTaskResults(mapped);
          }
        }
      } catch {
        // Silently ignore
      } finally {
        setIsLoadingTasks(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query, activeCategory]);

  // Combined flat list for keyboard arrow navigation
  const flatItems = useMemo(() => {
    return [...filteredMenuItems, ...filteredActions, ...taskResults];
  }, [filteredMenuItems, filteredActions, taskResults]);

  // Reset selected index when query, category, or results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [query, activeCategory, flatItems.length]);

  // Autofocus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setActiveCategory("all");
      setTaskResults([]);
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Navigate handler
  const handleSelectItem = useCallback(
    (item: QuickSearchItem) => {
      onClose();
      if (onNavigate) {
        onNavigate(item.href);
      } else {
        const cleanPath = item.href.replace(/^\//, "");
        window.history.pushState(null, "", "/" + cleanPath);
        window.dispatchEvent(new PopStateEvent("popstate"));
      }
    },
    [onClose, onNavigate]
  );

  // Keyboard navigation listener (inside modal)
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          flatItems.length === 0 ? 0 : (prev + 1) % flatItems.length
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          flatItems.length === 0
            ? 0
            : (prev - 1 + flatItems.length) % flatItems.length
        );
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (flatItems[selectedIndex]) {
          handleSelectItem(flatItems[selectedIndex]);
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    },
    [flatItems, selectedIndex, handleSelectItem, onClose]
  );

  // Auto-scroll selected item into view smoothly
  useEffect(() => {
    if (listRef.current) {
      const activeEl = listRef.current.querySelector(
        `[data-item-index="${selectedIndex}"]`
      ) as HTMLElement | null;
      if (activeEl) {
        activeEl.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  let currentIndexTracker = 0;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Pencarian Cepat"
      className="fixed inset-0 z-50 flex items-start justify-center pt-14 sm:pt-20 p-3 sm:p-4 overflow-y-auto"
      onKeyDown={handleKeyDown}
    >
      {/* Smooth Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/45 backdrop-blur-md modal-backdrop-animate transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Refined Modal Dialog */}
      <div className="relative z-10 w-full max-w-2xl rounded-2xl border border-slate-200/90 bg-white/95 backdrop-blur-xl shadow-2xl shadow-slate-900/20 overflow-hidden transition-all modal-dialog-animate dark:border-zinc-800/90 dark:bg-zinc-950/95 dark:shadow-black/60">
        {/* Header Search Input Bar */}
        <div className="relative flex items-center gap-3.5 px-4 sm:px-6 py-4 border-b border-slate-200/70 bg-white/60 dark:border-zinc-800/80 dark:bg-zinc-950/60">
          <Search className="h-5 w-5 text-slate-400 dark:text-zinc-400 shrink-0 stroke-[2.2]" />

          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari menu, tugas, aksi cepat, atau halaman..."
            className="w-full bg-transparent text-base sm:text-lg font-medium text-slate-900 placeholder:text-slate-400/90 outline-none dark:text-zinc-100 dark:placeholder:text-zinc-500"
          />

          {isLoadingTasks && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-medium dark:bg-blue-950/50 dark:text-blue-400 shrink-0 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping" />
              <span>Mencari...</span>
            </div>
          )}

          {query ? (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-400 hover:text-slate-700 hover:bg-slate-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors cursor-pointer"
              title="Hapus pencarian"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : (
            <div className="hidden sm:flex items-center gap-1.5 shrink-0">
              <kbd className="inline-flex items-center rounded-md border border-slate-200/90 bg-slate-100/90 px-2 py-0.5 text-[11px] font-mono font-medium text-slate-500 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
                ESC
              </kbd>
            </div>
          )}
        </div>

        {/* Apple-style Segmented Filter Bar */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-2 border-b border-slate-100/90 bg-slate-50/60 dark:border-zinc-800/60 dark:bg-zinc-900/40">
          <div className="inline-flex items-center p-0.5 rounded-xl bg-slate-200/70 dark:bg-zinc-800/70 text-xs font-medium">
            {(
              [
                { id: "all", label: "Semua" },
                { id: "menu", label: "Menu Navigasi" },
                { id: "action", label: "Aksi Cepat" },
                { id: "task", label: "Pekerjaan" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveCategory(tab.id)}
                className={`px-3 py-1 rounded-lg text-xs transition-all cursor-pointer ${
                  activeCategory === tab.id
                    ? "bg-white text-slate-900 shadow-xs font-semibold dark:bg-zinc-900 dark:text-white"
                    : "text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <span className="hidden sm:inline-block text-[11px] font-medium text-slate-400 dark:text-zinc-500">
            {flatItems.length} hasil
          </span>
        </div>

        {/* Results List Viewport */}
        <div
          ref={listRef}
          className="max-h-[380px] overflow-y-auto p-2 sm:p-3 space-y-3.5 scroll-smooth"
        >
          {flatItems.length === 0 && !isLoadingTasks ? (
            <div className="py-14 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-zinc-900 dark:text-zinc-500 mb-3">
                <Search className="h-6 w-6" />
              </div>
              <p className="text-sm font-semibold text-slate-700 dark:text-zinc-300">
                Tidak ada hasil yang cocok
              </p>
              <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1 max-w-xs mx-auto">
                Coba gunakan kata kunci lain seperti &quot;pekerjaan&quot;, &quot;laporan&quot;, atau &quot;kalender&quot;.
              </p>
            </div>
          ) : null}

          {/* Group 1: Navigation Menu */}
          {filteredMenuItems.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                <LayoutDashboard className="h-3 w-3 text-blue-500" />
                <span>Menu Navigasi ({filteredMenuItems.length})</span>
              </div>

              <div className="mt-1 space-y-1">
                {filteredMenuItems.map((item) => {
                  const itemIndex = currentIndexTracker++;
                  const isSelected = selectedIndex === itemIndex;

                  return (
                    <div
                      key={item.id}
                      data-item-index={itemIndex}
                      onClick={() => handleSelectItem(item)}
                      onMouseEnter={() => setSelectedIndex(itemIndex)}
                      className={`group flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-medium cursor-pointer transition-all ${
                        isSelected
                          ? "bg-blue-50/90 text-blue-950 border border-blue-200/80 shadow-2xs dark:bg-blue-950/40 dark:text-blue-100 dark:border-blue-800/60"
                          : "text-slate-700 hover:bg-slate-100/70 border border-transparent dark:text-zinc-200 dark:hover:bg-zinc-900/60"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-xl shrink-0 transition-colors ${
                            isSelected
                              ? "bg-blue-600 text-white shadow-xs"
                              : "bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-300"
                          }`}
                        >
                          {item.icon}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span
                            className={`font-semibold truncate text-[13px] ${
                              isSelected
                                ? "text-blue-900 dark:text-blue-100"
                                : "text-slate-900 dark:text-zinc-100"
                            }`}
                          >
                            {item.title}
                          </span>
                          {item.subtitle && (
                            <span
                              className={`text-[11px] truncate mt-0.5 ${
                                isSelected
                                  ? "text-blue-700/80 dark:text-blue-300/80"
                                  : "text-slate-500 dark:text-zinc-400"
                              }`}
                            >
                              {item.subtitle}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 ml-3">
                        {isSelected && (
                          <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-600 text-[10px] font-semibold text-white shadow-2xs animate-in fade-in duration-150">
                            Buka <CornerDownLeft className="h-3 w-3" />
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Group 2: Quick Actions */}
          {filteredActions.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                <Sparkles className="h-3 w-3 text-amber-500" />
                <span>Aksi Cepat ({filteredActions.length})</span>
              </div>

              <div className="mt-1 space-y-1">
                {filteredActions.map((item) => {
                  const itemIndex = currentIndexTracker++;
                  const isSelected = selectedIndex === itemIndex;

                  return (
                    <div
                      key={item.id}
                      data-item-index={itemIndex}
                      onClick={() => handleSelectItem(item)}
                      onMouseEnter={() => setSelectedIndex(itemIndex)}
                      className={`group flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-medium cursor-pointer transition-all ${
                        isSelected
                          ? "bg-blue-50/90 text-blue-950 border border-blue-200/80 shadow-2xs dark:bg-blue-950/40 dark:text-blue-100 dark:border-blue-800/60"
                          : "text-slate-700 hover:bg-slate-100/70 border border-transparent dark:text-zinc-200 dark:hover:bg-zinc-900/60"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-xl shrink-0 transition-colors ${
                            isSelected
                              ? "bg-blue-600 text-white shadow-xs"
                              : "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400"
                          }`}
                        >
                          {item.icon}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span
                            className={`font-semibold truncate text-[13px] ${
                              isSelected
                                ? "text-blue-900 dark:text-blue-100"
                                : "text-slate-900 dark:text-zinc-100"
                            }`}
                          >
                            {item.title}
                          </span>
                          {item.subtitle && (
                            <span
                              className={`text-[11px] truncate mt-0.5 ${
                                isSelected
                                  ? "text-blue-700/80 dark:text-blue-300/80"
                                  : "text-slate-500 dark:text-zinc-400"
                              }`}
                            >
                              {item.subtitle}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 ml-3">
                        {item.badge && (
                          <span
                            className={`px-2 py-0.5 text-[10px] font-semibold rounded-md ${
                              isSelected
                                ? "bg-blue-200/70 text-blue-900 dark:bg-blue-900/70 dark:text-blue-200"
                                : "bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400"
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                        {isSelected && (
                          <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-600 text-[10px] font-semibold text-white shadow-2xs">
                            Pilih <CornerDownLeft className="h-3 w-3" />
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Group 3: Live Tasks Search Results */}
          {taskResults.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                <CheckSquare className="h-3 w-3 text-emerald-500" />
                <span>Pekerjaan Ditemukan ({taskResults.length})</span>
              </div>

              <div className="mt-1 space-y-1">
                {taskResults.map((item) => {
                  const itemIndex = currentIndexTracker++;
                  const isSelected = selectedIndex === itemIndex;

                  return (
                    <div
                      key={item.id}
                      data-item-index={itemIndex}
                      onClick={() => handleSelectItem(item)}
                      onMouseEnter={() => setSelectedIndex(itemIndex)}
                      className={`group flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-medium cursor-pointer transition-all ${
                        isSelected
                          ? "bg-blue-50/90 text-blue-950 border border-blue-200/80 shadow-2xs dark:bg-blue-950/40 dark:text-blue-100 dark:border-blue-800/60"
                          : "text-slate-700 hover:bg-slate-100/70 border border-transparent dark:text-zinc-200 dark:hover:bg-zinc-900/60"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-xl shrink-0 transition-colors ${
                            isSelected
                              ? "bg-blue-600 text-white shadow-xs"
                              : "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
                          }`}
                        >
                          {item.icon}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span
                            className={`font-semibold truncate text-[13px] ${
                              isSelected
                                ? "text-blue-900 dark:text-blue-100"
                                : "text-slate-900 dark:text-zinc-100"
                            }`}
                          >
                            {item.title}
                          </span>
                          {item.subtitle && (
                            <span
                              className={`text-[11px] truncate mt-0.5 ${
                                isSelected
                                  ? "text-blue-700/80 dark:text-blue-300/80"
                                  : "text-slate-500 dark:text-zinc-400"
                              }`}
                            >
                              {item.subtitle}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 ml-3">
                        {item.badge && (
                          <span
                            className={`px-2 py-0.5 text-[10px] font-semibold rounded-md border ${
                              item.badgeVariant === "danger"
                                ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/40"
                                : item.badgeVariant === "warning"
                                ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/40"
                                : "bg-slate-100 text-slate-600 border-slate-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700"
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                        {isSelected && (
                          <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-600 text-[10px] font-semibold text-white shadow-2xs">
                            Buka <CornerDownLeft className="h-3 w-3" />
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Refined Footer Navigation Hints */}
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/80 px-4 sm:px-5 py-2.5 text-[11px] text-slate-500 dark:border-zinc-800/80 dark:bg-zinc-900/60 dark:text-zinc-400">
          <div className="flex items-center gap-3 sm:gap-4">
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-slate-200 bg-white px-1 font-mono text-[10px] shadow-2xs dark:border-zinc-800 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300">
                ↑
              </kbd>
              <kbd className="rounded border border-slate-200 bg-white px-1 font-mono text-[10px] shadow-2xs dark:border-zinc-800 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300">
                ↓
              </kbd>
              <span>Navigasi</span>
            </span>

            <span className="flex items-center gap-1">
              <kbd className="rounded border border-slate-200 bg-white px-1.5 font-mono text-[10px] shadow-2xs dark:border-zinc-800 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300">
                ↵
              </kbd>
              <span>Pilih</span>
            </span>

            <span className="flex items-center gap-1">
              <kbd className="rounded border border-slate-200 bg-white px-1.5 font-mono text-[10px] shadow-2xs dark:border-zinc-800 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300">
                ESC
              </kbd>
              <span>Tutup</span>
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-400 dark:text-zinc-500">
            <span>{flatItems.length} pilihan</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickSearchModal;
