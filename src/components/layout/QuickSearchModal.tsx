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
} from "lucide-react";

export interface QuickSearchItem {
  id: string;
  title: string;
  subtitle?: string;
  category: "menu" | "action" | "task";
  href: string;
  icon: React.ReactNode;
  badge?: string;
  adminOnly?: boolean;
}

export interface QuickSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  role?: "admin" | "user";
  onNavigate?: (path: string) => void;
}

export const QuickSearchModal: React.FC<QuickSearchModalProps> = ({
  isOpen,
  onClose,
  role = "admin",
  onNavigate,
}) => {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
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
        subtitle: "Ringkasan metrik kinerja, KPI, dan aktivitas terkini",
        category: "menu",
        href: "/dashboard",
        icon: <LayoutDashboard className="h-4 w-4" />,
      },
      {
        id: "nav-tasks",
        title: role === "user" ? "Pekerjaan Saya" : "Daftar Pekerjaan",
        subtitle: "Kelola daftar tugas, status progres, dan deadline",
        category: "menu",
        href: "/tasks",
        icon: <CheckSquare className="h-4 w-4" />,
      },
      {
        id: "nav-calendar",
        title: "Kalender Aktivitas",
        subtitle: "Jadwal tenggat waktu, agenda, dan timeline tugas",
        category: "menu",
        href: "/calendar",
        icon: <Calendar className="h-4 w-4" />,
      },
      {
        id: "nav-actions",
        title: "Perlu Tindakan",
        subtitle: "Persetujuan tugas selesai dan verifikasi pendaftaran akun",
        category: "menu",
        href: "/actions",
        icon: <Clock className="h-4 w-4" />,
        adminOnly: true,
      },
      {
        id: "nav-evaluation",
        title: "Evaluasi & Ranking",
        subtitle: "Peringkat skor KPI, performa tim, dan analitik produktivitas",
        category: "menu",
        href: "/evaluation",
        icon: <TrendingUp className="h-4 w-4" />,
        adminOnly: true,
      },
      {
        id: "nav-reports",
        title: "Laporan & Ekspor",
        subtitle: "Rekap data pekerjaan, unduh CSV/Excel, dan ringkasan eksekutif",
        category: "menu",
        href: "/reports",
        icon: <FileText className="h-4 w-4" />,
      },
      {
        id: "nav-registration",
        title: "Pendaftaran Pengguna",
        subtitle: "Form pendaftaran pegawai baru dan registrasi akun internal",
        category: "menu",
        href: "/registration",
        icon: <UserPlus className="h-4 w-4" />,
      },
      {
        id: "nav-password",
        title: "Ganti Password",
        subtitle: "Perbarui kata sandi akun untuk keamanan akses Anda",
        category: "menu",
        href: "/password",
        icon: <KeyRound className="h-4 w-4" />,
      },
      {
        id: "nav-users",
        title: "Manajemen Pengguna",
        subtitle: "Kelola akun pengguna, peran hak akses, dan status verifikasi",
        category: "menu",
        href: "/users",
        icon: <Users className="h-4 w-4" />,
        adminOnly: true,
      },
      {
        id: "nav-settings",
        title: "Pengaturan Sistem",
        subtitle: "Konfigurasi tema, preferensi tampilan, dan profil sistem",
        category: "menu",
        href: "/settings",
        icon: <Settings className="h-4 w-4" />,
        adminOnly: true,
      },
      {
        id: "nav-notifications",
        title: "Pusat Notifikasi",
        subtitle: "Riwayat peringatan, tugas baru, dan pengumuman sistem",
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
        subtitle: "Tambahkan tugas kerja atau target proyek baru",
        category: "action",
        href: "/tasks",
        icon: <PlusCircle className="h-4 w-4" />,
        badge: "Tugas",
      },
      {
        id: "act-settings",
        title: "Ubah Tema Tampilan",
        subtitle: "Pilih skema warna Light, Ocean, Emerald, atau Midnight",
        category: "action",
        href: "/settings",
        icon: <Settings className="h-4 w-4" />,
        badge: "Tema",
      },
    ],
    []
  );

  // Filter items by role and search query
  const filteredMenuItems = useMemo(() => {
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
  }, [baseMenuItems, query, role]);

  const filteredActions = useMemo(() => {
    if (!query.trim()) return quickActions;
    const q = query.toLowerCase();
    return quickActions.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        (item.subtitle && item.subtitle.toLowerCase().includes(q))
    );
  }, [quickActions, query]);

  // Debounced search for tasks from API when user types
  useEffect(() => {
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
              badge: t.priority || "Medium",
            }));
            setTaskResults(mapped);
          }
        }
      } catch {
        // Silently ignore search error
      } finally {
        setIsLoadingTasks(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  // Combined flat list for keyboard arrow navigation
  const flatItems = useMemo(() => {
    return [...filteredMenuItems, ...filteredActions, ...taskResults];
  }, [filteredMenuItems, filteredActions, taskResults]);

  // Reset selected index when query or results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [query, flatItems.length]);

  // Autofocus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTaskResults([]);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Navigate handler
  const handleSelectItem = useCallback(
    (item: QuickSearchItem) => {
      onClose();
      if (onNavigate) {
        onNavigate(item.href);
      } else {
        // Trigger default navigation / pushState
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

  // Auto-scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const activeEl = listRef.current.querySelector(
        `[data-item-index="${selectedIndex}"]`
      ) as HTMLElement | null;
      if (activeEl) {
        activeEl.scrollIntoView({ block: "nearest" });
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
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-4 overflow-y-auto"
      onKeyDown={handleKeyDown}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-150 dark:bg-black/70"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div className="relative z-10 w-full max-w-xl rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden transition-all animate-in zoom-in-95 duration-150 dark:border-zinc-800 dark:bg-zinc-950">
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-3 dark:border-zinc-800">
          <Search className="h-5 w-5 text-slate-400 dark:text-zinc-500 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari menu, halaman, aksi cepat, atau tugas..."
            className="w-full bg-transparent text-sm font-medium text-slate-900 placeholder-slate-400 outline-none dark:text-zinc-100 dark:placeholder-zinc-500"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-flex items-center rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-mono text-slate-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
              ESC
            </kbd>
          )}
        </div>

        {/* Results List */}
        <div
          ref={listRef}
          className="max-h-[380px] overflow-y-auto p-2 space-y-3"
        >
          {flatItems.length === 0 && !isLoadingTasks ? (
            <div className="py-12 text-center text-xs text-slate-400 dark:text-zinc-500">
              Tidak ada hasil yang cocok dengan &quot;{query}&quot;
            </div>
          ) : null}

          {/* Group 1: Navigation Menu */}
          {filteredMenuItems.length > 0 && (
            <div>
              <p className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                Menu Navigasi
              </p>
              <div className="space-y-0.5">
                {filteredMenuItems.map((item) => {
                  const itemIndex = currentIndexTracker++;
                  const isSelected = selectedIndex === itemIndex;

                  return (
                    <div
                      key={item.id}
                      data-item-index={itemIndex}
                      onClick={() => handleSelectItem(item)}
                      onMouseEnter={() => setSelectedIndex(itemIndex)}
                      className={`group flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-blue-600 text-white shadow-xs"
                          : "text-slate-700 hover:bg-slate-100 dark:text-zinc-200 dark:hover:bg-zinc-900"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`flex h-7 w-7 items-center justify-center rounded-lg shrink-0 transition-colors ${
                            isSelected
                              ? "bg-white/20 text-white"
                              : "bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-300"
                          }`}
                        >
                          {item.icon}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold truncate">
                            {item.title}
                          </span>
                          {item.subtitle && (
                            <span
                              className={`text-[11px] truncate ${
                                isSelected
                                  ? "text-blue-100"
                                  : "text-slate-400 dark:text-zinc-500"
                              }`}
                            >
                              {item.subtitle}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        {isSelected && (
                          <CornerDownLeft className="h-3.5 w-3.5 text-blue-100" />
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
              <p className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                Aksi Cepat
              </p>
              <div className="space-y-0.5">
                {filteredActions.map((item) => {
                  const itemIndex = currentIndexTracker++;
                  const isSelected = selectedIndex === itemIndex;

                  return (
                    <div
                      key={item.id}
                      data-item-index={itemIndex}
                      onClick={() => handleSelectItem(item)}
                      onMouseEnter={() => setSelectedIndex(itemIndex)}
                      className={`group flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-blue-600 text-white shadow-xs"
                          : "text-slate-700 hover:bg-slate-100 dark:text-zinc-200 dark:hover:bg-zinc-900"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`flex h-7 w-7 items-center justify-center rounded-lg shrink-0 transition-colors ${
                            isSelected
                              ? "bg-white/20 text-white"
                              : "bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-300"
                          }`}
                        >
                          {item.icon}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold truncate">
                            {item.title}
                          </span>
                          {item.subtitle && (
                            <span
                              className={`text-[11px] truncate ${
                                isSelected
                                  ? "text-blue-100"
                                  : "text-slate-400 dark:text-zinc-500"
                              }`}
                            >
                              {item.subtitle}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        {item.badge && (
                          <span
                            className={`px-1.5 py-0.5 text-[10px] font-semibold rounded-md ${
                              isSelected
                                ? "bg-white/20 text-white"
                                : "bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400"
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                        {isSelected && (
                          <CornerDownLeft className="h-3.5 w-3.5 text-blue-100" />
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
              <p className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                Pekerjaan Ditemukan
              </p>
              <div className="space-y-0.5">
                {taskResults.map((item) => {
                  const itemIndex = currentIndexTracker++;
                  const isSelected = selectedIndex === itemIndex;

                  return (
                    <div
                      key={item.id}
                      data-item-index={itemIndex}
                      onClick={() => handleSelectItem(item)}
                      onMouseEnter={() => setSelectedIndex(itemIndex)}
                      className={`group flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-blue-600 text-white shadow-xs"
                          : "text-slate-700 hover:bg-slate-100 dark:text-zinc-200 dark:hover:bg-zinc-900"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`flex h-7 w-7 items-center justify-center rounded-lg shrink-0 transition-colors ${
                            isSelected
                              ? "bg-white/20 text-white"
                              : "bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-300"
                          }`}
                        >
                          {item.icon}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold truncate">
                            {item.title}
                          </span>
                          {item.subtitle && (
                            <span
                              className={`text-[11px] truncate ${
                                isSelected
                                  ? "text-blue-100"
                                  : "text-slate-400 dark:text-zinc-500"
                              }`}
                            >
                              {item.subtitle}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        {item.badge && (
                          <span
                            className={`px-1.5 py-0.5 text-[10px] font-semibold rounded-md ${
                              isSelected
                                ? "bg-white/20 text-white"
                                : "bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400"
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                        {isSelected && (
                          <CornerDownLeft className="h-3.5 w-3.5 text-blue-100" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation Hints */}
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/60 px-4 py-2.5 text-[11px] text-slate-400 dark:border-zinc-800/80 dark:bg-zinc-900/40 dark:text-zinc-500">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-slate-200 bg-white px-1 font-mono text-[10px] shadow-2xs dark:border-zinc-800 dark:bg-zinc-800">
                ↑
              </kbd>
              <kbd className="rounded border border-slate-200 bg-white px-1 font-mono text-[10px] shadow-2xs dark:border-zinc-800 dark:bg-zinc-800">
                ↓
              </kbd>
              <span>Navigasi</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-slate-200 bg-white px-1.5 font-mono text-[10px] shadow-2xs dark:border-zinc-800 dark:bg-zinc-800">
                ↵
              </kbd>
              <span>Buka</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-slate-200 bg-white px-1.5 font-mono text-[10px] shadow-2xs dark:border-zinc-800 dark:bg-zinc-800">
                ESC
              </kbd>
              <span>Tutup</span>
            </span>
          </div>

          <span className="text-[10px] font-medium text-slate-400">
            Quick Command
          </span>
        </div>
      </div>
    </div>
  );
};

export default QuickSearchModal;
