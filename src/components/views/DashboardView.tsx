"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  CheckSquare,
  CheckCircle2,
  RotateCw,
  AlertTriangle,
  Users,
  Search,
  ArrowRight,
  TrendingUp,
  Clock,
  ExternalLink,
  ChevronRight,
  Activity,
  Plus,
} from "lucide-react";
import { Task, SafeUser } from "@/types/database";
import { Button } from "@/components/ui/Button";
import { KpiCard } from "@/components/ui/KpiCard";
import { StatusPill } from "@/components/ui/StatusPill";
import { PriorityBadge } from "@/components/ui/PriorityBadge";
import { PanelCard } from "@/components/ui/PanelCard";

export interface DashboardViewProps {
  user: SafeUser;
  onOpenCreateTask?: () => void;
  onOpenTaskDetail?: (task: Task) => void;
  onOpenStatusUpdate?: (task: Task) => void;
  onNavigate?: (view: string) => void;
}

interface TrendPoint {
  day: string;
  shortDay: string;
  completed: number;
  created: number;
  x: number;
  yCompleted: number;
  yCreated: number;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  user,
  onOpenCreateTask,
  onOpenTaskDetail,
  onOpenStatusUpdate,
  onNavigate,
}) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeUsersCount, setActiveUsersCount] = useState<number>(0);
  const [totalUsersCount, setTotalUsersCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [recentFilter, setRecentFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Chart Tooltip state
  const [hoveredPoint, setHoveredPoint] = useState<{
    day: string;
    series: string;
    value: number;
    x: number;
    y: number;
  } | null>(null);

  // Donut hover state
  const [hoveredDonutIdx, setHoveredDonutIdx] = useState<number | null>(null);

  // Fetch tasks data
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      setIsLoading(true);
      try {
        const [tasksRes, usersRes] = await Promise.all([
          fetch("/api/tasks?include_demo=false"),
          fetch("/api/users"),
        ]);

        if (tasksRes.ok) {
          const tasksData = await tasksRes.json();
          if (tasksData.success && isMounted) {
            setTasks(tasksData.data || []);
          }
        }

        if (usersRes.ok) {
          const usersData = await usersRes.json();
          if (usersData.success && isMounted && Array.isArray(usersData.data)) {
            const allUsers = usersData.data as SafeUser[];
            setTotalUsersCount(allUsers.length);
            const active = allUsers.filter(
              (u) => u.status === "active"
            ).length;
            setActiveUsersCount(active);
          }
        }
      } catch (err) {
        console.error("Error loading dashboard data:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Greeting based on time
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 11) return "Selamat pagi";
    if (hour < 15) return "Selamat siang";
    if (hour < 18) return "Selamat sore";
    return "Selamat malam";
  }, []);

  const todayDateString = useMemo(() => {
    return new Date().toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }, []);

  // Metrics calculation
  const metrics = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === "Selesai").length;
    const inProgress = tasks.filter((t) => t.status === "Dalam Proses").length;
    const pending = tasks.filter((t) => t.status === "Pending").length;
    const notStarted = tasks.filter((t) => t.status === "Belum Mulai").length;

    const now = new Date();
    const late = tasks.filter((t) => {
      if (t.status === "Selesai") return false;
      const d = new Date(
        typeof t.deadline === "string" ? t.deadline.replace(" ", "T") : t.deadline
      );
      return !isNaN(d.getTime()) && d < now;
    }).length;

    const completionRate =
      total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      total,
      completed,
      inProgress,
      pending,
      notStarted,
      late,
      completionRate,
    };
  }, [tasks]);

  // Donut data calculations
  const donutData = useMemo(() => {
    const parts = [
      { name: "Selesai", count: metrics.completed, color: "#3b82f6" },
      { name: "Dalam Proses", count: metrics.inProgress, color: "#10b981" },
      { name: "Pending", count: metrics.pending, color: "#f59e0b" },
      { name: "Belum Mulai", count: metrics.notStarted, color: "#94a3b8" },
    ];

    const totalCount = parts.reduce((a, b) => a + b.count, 0);
    const sum = totalCount || 1;
    let accum = 0;
    const partsWithAngles = parts.map((part) => {
      const startPct = totalCount > 0 ? (accum / sum) * 100 : 0;
      accum += part.count;
      const endPct = totalCount > 0 ? (accum / sum) * 100 : 0;
      const pct =
        totalCount > 0 ? ((part.count / sum) * 100).toFixed(1).replace(".", ",") : "0";
      return {
        ...part,
        startPct,
        endPct,
        pct,
      };
    });

    const activeParts = partsWithAngles.filter((p) => p.count > 0);
    const conicGradient =
      activeParts.length > 0
        ? activeParts
            .map(
              (p) =>
                `${p.color} ${p.startPct}% ${Math.max(
                  p.startPct,
                  p.endPct - 0.45
                )}%, #ffffff ${Math.max(p.startPct, p.endPct - 0.45)}% ${p.endPct}%`
            )
            .join(", ")
        : "#e2e8f0 0% 100%";

    return {
      parts: partsWithAngles,
      totalCount,
      conicGradient,
    };
  }, [metrics]);

  // Trend 7-day SVG points (last 7 days ending today)
  const { trendPoints, maxY, yTicks } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const getDayKey = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    const parseDateToKey = (val: string | Date | null | undefined): string | null => {
      if (!val) return null;
      const d = new Date(typeof val === "string" ? val.replace(" ", "T") : val);
      if (isNaN(d.getTime())) return null;
      return getDayKey(d);
    };

    const daysData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = getDayKey(d);
      const dayName = d.toLocaleDateString("id-ID", { weekday: "long" });
      const shortDay = d.toLocaleDateString("id-ID", { weekday: "short" });

      const completedCount = tasks.filter((t) => {
        if (t.status !== "Selesai") return false;
        return parseDateToKey(t.completed_at) === key;
      }).length;

      const createdCount = tasks.filter((t) => {
        return parseDateToKey(t.created_at) === key;
      }).length;

      daysData.push({
        day: dayName,
        shortDay: shortDay.charAt(0).toUpperCase() + shortDay.slice(1),
        completed: completedCount,
        created: createdCount,
      });
    }

    const maxCount = Math.max(
      ...daysData.map((d) => Math.max(d.completed, d.created)),
      0
    );

    const calculatedMaxY =
      maxCount <= 4
        ? 4
        : maxCount <= 10
        ? 10
        : maxCount <= 20
        ? 20
        : Math.ceil(maxCount / 10) * 10;

    const ticks = [
      calculatedMaxY,
      Math.round(calculatedMaxY * 0.75),
      Math.round(calculatedMaxY * 0.5),
      Math.round(calculatedMaxY * 0.25),
      0,
    ];

    const points: TrendPoint[] = daysData.map((item, idx) => {
      const x = 42 + idx * 91;
      const yCompleted = Math.round(162 - (item.completed / calculatedMaxY) * 144);
      const yCreated = Math.round(162 - (item.created / calculatedMaxY) * 144);
      return {
        ...item,
        x,
        yCompleted,
        yCreated,
      };
    });

    return {
      trendPoints: points,
      maxY: calculatedMaxY,
      yTicks: ticks,
    };
  }, [tasks]);

  const completedLinePath = useMemo(() => {
    return trendPoints
      .map((p, idx) => `${idx === 0 ? "M" : "L"}${p.x} ${p.yCompleted}`)
      .join(" ");
  }, [trendPoints]);

  const completedAreaPath = useMemo(() => {
    return `${completedLinePath} L588 162 L42 162Z`;
  }, [completedLinePath]);

  const createdLinePath = useMemo(() => {
    return trendPoints
      .map((p, idx) => `${idx === 0 ? "M" : "L"}${p.x} ${p.yCreated}`)
      .join(" ");
  }, [trendPoints]);

  // Filtered recent tasks
  const filteredTasks = useMemo(() => {
    return tasks
      .filter((t) => {
        if (recentFilter === "progress") return t.status === "Dalam Proses";
        if (recentFilter === "late") {
          if (t.status === "Selesai") return false;
          const d = new Date(
            typeof t.deadline === "string" ? t.deadline.replace(" ", "T") : t.deadline
          );
          return !isNaN(d.getTime()) && d < new Date();
        }
        if (recentFilter === "done") return t.status === "Selesai";
        return true;
      })
      .filter((t) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          t.title.toLowerCase().includes(q) ||
          t.code.toLowerCase().includes(q) ||
          (t.owner_name && t.owner_name.toLowerCase().includes(q))
        );
      })
      .slice(0, 7);
  }, [tasks, recentFilter, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="text-[11px] font-bold tracking-wider uppercase text-slate-500 dark:text-zinc-400">
            OVERVIEW • <span>{todayDateString}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-zinc-100 tracking-tight mt-1">
            {greeting}, {user.full_name}
          </h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-0.5">
            Pantau pekerjaan, tenggat waktu, dan aktivitas tim dari satu tempat.
          </p>
        </div>

        <div>
          <Button
            variant="primary"
            onClick={onOpenCreateTask}
            leftIcon={<Plus className="h-4 w-4" />}
            className="shadow-md"
          >
            Buat Pekerjaan
          </Button>
        </div>
      </div>

      {/* 5 KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
        <KpiCard
          label="Total Pekerjaan"
          value={metrics.total}
          color="blue"
          icon={<CheckSquare className="h-4 w-4" />}
          footerText={
            <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-zinc-400 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              Terdaftar di sistem
            </span>
          }
        />
        <KpiCard
          label="Selesai"
          value={metrics.completed}
          color="green"
          icon={<CheckCircle2 className="h-4 w-4" />}
          footerText={
            <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-zinc-400 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              {metrics.completionRate}% dari total
            </span>
          }
        />
        <KpiCard
          label="Dalam Proses"
          value={metrics.inProgress}
          color="purple"
          icon={<RotateCw className="h-4 w-4" />}
          footerText={
            <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-zinc-400 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
              Sedang dikerjakan
            </span>
          }
        />
        <KpiCard
          label="Terlambat"
          value={metrics.late}
          color="red"
          icon={<AlertTriangle className="h-4 w-4" />}
          footerText={
            <span
              className={`inline-flex items-center gap-1.5 text-xs ${
                metrics.late > 0
                  ? "text-rose-600 dark:text-rose-400 font-semibold"
                  : "text-slate-500 dark:text-zinc-400 font-medium"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  metrics.late > 0 ? "bg-rose-500" : "bg-slate-400"
                }`}
              />
              {metrics.late > 0 ? "Perlu perhatian" : "Semua tepat waktu"}
            </span>
          }
        />
        <KpiCard
          label="Pengguna Aktif"
          value={activeUsersCount}
          color="amber"
          icon={<Users className="h-4 w-4" />}
          footerText={
            <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-zinc-400 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              Dari {totalUsersCount} pengguna
            </span>
          }
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Executive Trend SVG Chart (2 cols on lg) */}
        <div className="lg:col-span-2">
          <PanelCard
            title="Tren Penyelesaian Pekerjaan"
            subtitle="Perbandingan pekerjaan selesai dan dibuat · 7 hari terakhir"
            action={
              <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-300">
                7 Hari Terakhir
              </span>
            }
          >
            <div className="flex items-center gap-4 text-xs font-medium text-slate-600 dark:text-zinc-400 mb-3">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-blue-600" />
                <span>Pekerjaan selesai</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-slate-400" />
                <span>Pekerjaan dibuat</span>
              </div>
            </div>

            {/* SVG Interactive Line Chart Container */}
            <div className="relative w-full h-[210px] overflow-visible select-none">
              {/* Tooltip Overlay */}
              {hoveredPoint && (
                <div
                  className="absolute pointer-events-none z-20 -translate-x-1/2 -translate-y-full rounded-lg bg-[#1e293b] p-3 text-xs text-white shadow-xl border border-slate-700/60 transition-all duration-75"
                  style={{
                    left: `${(hoveredPoint.x / 600) * 100}%`,
                    top: `${hoveredPoint.y - 12}px`,
                  }}
                >
                  <div className="font-bold text-slate-100">{hoveredPoint.day}</div>
                  <div className="text-slate-300 text-xs mt-0.5">
                    {hoveredPoint.series}:{" "}
                    <span className="font-bold text-white">
                      {hoveredPoint.value} pekerjaan
                    </span>
                  </div>
                </div>
              )}

              <svg
                viewBox="0 0 600 190"
                preserveAspectRatio="none"
                className="w-full h-full overflow-visible"
                aria-label="Grafik tren pekerjaan 7 hari"
              >
                <defs>
                  <linearGradient id="trendFill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#2563eb" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Horizontal & Vertical Grid Lines */}
                <g className="stroke-slate-200 dark:stroke-zinc-800" strokeWidth="1" strokeDasharray="3 4">
                  <path d="M42 18H590 M42 54H590 M42 90H590 M42 126H590 M42 162H590" />
                  <path d="M42 18V162 M133 18V162 M224 18V162 M315 18V162 M406 18V162 M497 18V162 M588 18V162" />
                </g>

                {/* Y Axis Numbers */}
                <g className="fill-slate-500 dark:fill-zinc-400 font-semibold text-[11px] font-mono">
                  <text x="32" y="22" textAnchor="end">{yTicks[0]}</text>
                  <text x="32" y="58" textAnchor="end">{yTicks[1]}</text>
                  <text x="32" y="94" textAnchor="end">{yTicks[2]}</text>
                  <text x="32" y="130" textAnchor="end">{yTicks[3]}</text>
                  <text x="32" y="166" textAnchor="end">{yTicks[4]}</text>
                </g>

                {/* Area Gradient Fill */}
                <path d={completedAreaPath} fill="url(#trendFill)" />

                {/* Secondary Line: Pekerjaan Dibuat */}
                <path
                  d={createdLinePath}
                  fill="none"
                  stroke="#94a3b8"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Primary Line: Pekerjaan Selesai */}
                <path
                  d={completedLinePath}
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth="3.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Points on Completed Line */}
                <g>
                  {trendPoints.map((pt) => (
                    <circle
                      key={`comp-${pt.day}`}
                      cx={pt.x}
                      cy={pt.yCompleted}
                      r="4.5"
                      className="fill-white stroke-blue-600 stroke-2 cursor-pointer transition-transform hover:scale-150"
                      onMouseEnter={() =>
                        setHoveredPoint({
                          day: pt.day,
                          series: "Pekerjaan selesai",
                          value: pt.completed,
                          x: pt.x,
                          y: pt.yCompleted,
                        })
                      }
                      onMouseLeave={() => setHoveredPoint(null)}
                    />
                  ))}
                </g>

                {/* Points on Created Line */}
                <g>
                  {trendPoints.map((pt) => (
                    <circle
                      key={`creat-${pt.day}`}
                      cx={pt.x}
                      cy={pt.yCreated}
                      r="4"
                      className="fill-white stroke-slate-400 stroke-2 cursor-pointer transition-transform hover:scale-150"
                      onMouseEnter={() =>
                        setHoveredPoint({
                          day: pt.day,
                          series: "Pekerjaan dibuat",
                          value: pt.created,
                          x: pt.x,
                          y: pt.yCreated,
                        })
                      }
                      onMouseLeave={() => setHoveredPoint(null)}
                    />
                  ))}
                </g>
              </svg>

              {/* Day Labels along X Axis */}
              <div className="flex justify-between pl-10 pr-2 pt-2 text-xs font-semibold text-slate-500 dark:text-zinc-400">
                {trendPoints.map((pt, idx) => (
                  <span key={idx} className="w-8 text-center">
                    {pt.shortDay}
                  </span>
                ))}
              </div>
            </div>
          </PanelCard>
        </div>

        {/* Status Donut Chart (1 col on lg) */}
        <div>
          <PanelCard
            title="Komposisi Status"
            subtitle="Ringkasan semua pekerjaan"
            action={
              <button
                type="button"
                onClick={() => onNavigate && onNavigate("tasks")}
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                Lihat detail <ArrowRight className="h-3 w-3" />
              </button>
            }
          >
            <div className="flex flex-col items-center justify-center pt-2">
              {/* Conic Gradient Donut */}
              <div
                className="relative flex h-44 w-44 items-center justify-center rounded-full shadow-inner transition-all duration-300 cursor-pointer"
                style={{
                  background: `conic-gradient(${donutData.conicGradient})`,
                }}
                onMouseLeave={() => setHoveredDonutIdx(null)}
              >
                {/* Center Hole cutout */}
                <div className="flex h-28 w-28 flex-col items-center justify-center rounded-full bg-white dark:bg-zinc-900 shadow-inner border border-slate-100 dark:border-zinc-800 text-center p-2 select-none">
                  {hoveredDonutIdx !== null ? (
                    <>
                      <span className="text-3xl font-black text-slate-900 dark:text-zinc-100 tabular-nums">
                        {donutData.parts[hoveredDonutIdx].pct}%
                      </span>
                      <span className="text-xs text-slate-500 dark:text-zinc-400 font-medium line-clamp-1">
                        {donutData.parts[hoveredDonutIdx].name}
                      </span>
                      <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                        {donutData.parts[hoveredDonutIdx].count} tugas
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-3xl font-black text-slate-900 dark:text-zinc-100 tabular-nums">
                        {metrics.total}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-zinc-400 font-medium">
                        Total Tugas
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Interactive Legend List */}
              <div className="w-full mt-5 space-y-2">
                {donutData.parts.map((part, idx) => (
                  <div
                    key={part.name}
                    onMouseEnter={() => setHoveredDonutIdx(idx)}
                    onMouseLeave={() => setHoveredDonutIdx(null)}
                    className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs transition-colors cursor-pointer ${
                      hoveredDonutIdx === idx
                        ? "bg-slate-100 dark:bg-zinc-900 font-semibold"
                        : "hover:bg-slate-50 dark:hover:bg-zinc-900/60"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: part.color }}
                      />
                      <span className="text-slate-700 dark:text-zinc-300">
                        {part.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-500 dark:text-zinc-400 font-mono">
                      <span>{part.count}</span>
                      <span className="text-[10px]">({part.pct}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </PanelCard>
        </div>
      </div>

      {/* Bottom Grid: Recent Tasks & Alerts/Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Tasks Table (2 cols) */}
        <div className="lg:col-span-2">
          <PanelCard
            title="Pekerjaan Terbaru"
            subtitle="Pantau progres dan tenggat pekerjaan"
            action={
              <button
                type="button"
                onClick={() => onNavigate && onNavigate("tasks")}
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                Lihat semua →
              </button>
            }
          >
            {/* Table Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              {/* Range Filter Tabs */}
              <div className="p-0.5 rounded-lg bg-slate-100 dark:bg-zinc-900 inline-flex items-center gap-0.5">
                {[
                  { id: "all", label: "Semua" },
                  { id: "progress", label: "Dalam Proses" },
                  { id: "late", label: "Terlambat" },
                  { id: "done", label: "Selesai" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setRecentFilter(tab.id)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
                      recentFilter === tab.id
                        ? "bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 shadow-xs"
                        : "text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Search input */}
              <div className="relative w-full sm:w-56">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari pekerjaan..."
                  className="w-full rounded-lg border border-slate-200 bg-white py-1.5 pl-8 pr-3 text-xs outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                />
              </div>
            </div>

            {/* Table Wrap */}
            <div className="table-wrap rounded-lg border border-slate-200 dark:border-zinc-800 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-zinc-900/80 text-slate-500 dark:text-zinc-400 border-b border-slate-200 dark:border-zinc-800">
                    <th className="px-3.5 py-2.5 text-[11px] uppercase tracking-wider font-bold">Pekerjaan</th>
                    <th className="px-3.5 py-2.5 text-[11px] uppercase tracking-wider font-bold">Pemilik</th>
                    <th className="px-3.5 py-2.5 text-[11px] uppercase tracking-wider font-bold">Deadline</th>
                    <th className="px-3.5 py-2.5 text-[11px] uppercase tracking-wider font-bold">Prioritas</th>
                    <th className="px-3.5 py-2.5 text-[11px] uppercase tracking-wider font-bold">Status</th>
                    <th className="px-3.5 py-2.5 text-[11px] uppercase tracking-wider font-bold text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/80 dark:divide-zinc-800">
                  {filteredTasks.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400 dark:text-zinc-500">
                        Tidak ada pekerjaan yang cocok.
                      </td>
                    </tr>
                  ) : (
                    filteredTasks.map((task) => {
                      const deadlineDate = new Date(
                        typeof task.deadline === "string"
                          ? task.deadline.replace(" ", "T")
                          : task.deadline
                      );
                      const isOverdue =
                        task.status !== "Selesai" &&
                        !isNaN(deadlineDate.getTime()) &&
                        deadlineDate < new Date();

                      return (
                        <tr
                          key={task.id}
                          className="hover:bg-blue-50/35 dark:hover:bg-zinc-800/30 transition-colors"
                        >
                          <td className="py-3 px-3.5 border-b border-slate-100 dark:border-zinc-800/60 max-w-[240px]">
                            <div className="font-semibold text-slate-900 dark:text-zinc-100 truncate">
                              {task.title}
                            </div>
                            <div className="flex items-center gap-1.5 mt-1">
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400 border border-slate-200/80 dark:border-zinc-700/60">
                                {task.code}
                              </span>
                              {task.category && (
                                <span className="text-[10px] font-medium text-slate-400 dark:text-zinc-500 truncate">
                                  • {task.category}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-3.5 border-b border-slate-100 dark:border-zinc-800/60 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-zinc-800 text-[10px] font-bold text-slate-600 dark:text-zinc-300 border border-slate-200/60 dark:border-zinc-700/50">
                                {task.owner_name
                                  ? task.owner_name.slice(0, 2).toUpperCase()
                                  : "ST"}
                              </span>
                              <span className="text-xs text-slate-700 dark:text-zinc-300 font-medium">
                                {task.owner_name || "Staf"}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-3.5 border-b border-slate-100 dark:border-zinc-800/60 whitespace-nowrap">
                            <div className="flex items-center gap-1.5 text-xs">
                              {isOverdue ? (
                                <span className="inline-flex items-center gap-1 font-semibold text-rose-600 dark:text-rose-400">
                                  <Clock className="h-3 w-3" />
                                  {!isNaN(deadlineDate.getTime())
                                    ? deadlineDate.toLocaleDateString("id-ID", {
                                        day: "numeric",
                                        month: "short",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })
                                    : "-"}
                                </span>
                              ) : (
                                <span className="text-slate-600 dark:text-zinc-400">
                                  {!isNaN(deadlineDate.getTime())
                                    ? deadlineDate.toLocaleDateString("id-ID", {
                                        day: "numeric",
                                        month: "short",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })
                                    : "-"}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-3.5 border-b border-slate-100 dark:border-zinc-800/60 whitespace-nowrap">
                            <PriorityBadge priority={task.priority} />
                          </td>
                          <td className="py-3 px-3.5 border-b border-slate-100 dark:border-zinc-800/60 whitespace-nowrap">
                            <StatusPill status={task.status} />
                          </td>
                          <td className="py-3 px-3.5 border-b border-slate-100 dark:border-zinc-800/60 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => onOpenTaskDetail && onOpenTaskDetail(task)}
                                className="px-2 py-1 text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-md transition-all cursor-pointer active:scale-[0.98]"
                              >
                                Detail & diskusi
                              </button>
                              <button
                                type="button"
                                onClick={() => onOpenStatusUpdate && onOpenStatusUpdate(task)}
                                className="px-2 py-1 text-[11px] font-medium text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-md transition-all cursor-pointer active:scale-[0.98]"
                              >
                                Ubah status
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </PanelCard>
        </div>

        {/* Right Column: Perlu Perhatian & Aktivitas Terbaru */}
        <div className="space-y-6">
          {/* Perlu Perhatian Card */}
          <PanelCard
            title="Perlu Perhatian"
            subtitle="Notifikasi penting yang menunggu tindak lanjut"
            action={
              <button
                type="button"
                onClick={() => onNavigate && onNavigate("notifications")}
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                Semua →
              </button>
            }
          >
            <div className="space-y-3">
              {/* Alert 1 */}
              <div className="flex items-start gap-3 rounded-lg border border-rose-200 bg-rose-50/50 p-3 dark:border-rose-900/40 dark:bg-rose-950/20">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-400">
                  <AlertTriangle className="h-3.5 w-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-slate-900 dark:text-zinc-100">
                    {metrics.late > 0
                      ? `${metrics.late} pekerjaan melewati deadline`
                      : "Tidak ada pekerjaan terlambat"}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                    {metrics.late > 0
                      ? "Periksa status dan tindak lanjut pemilik pekerjaan."
                      : "Semua pekerjaan berjalan sesuai jadwal."}
                  </p>
                  <div className="mt-2 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">
                      {metrics.late > 0 ? "Baru saja diperbarui" : "Status terkini"}
                    </span>
                    <button
                      type="button"
                      onClick={() => onNavigate && onNavigate("tasks")}
                      className="font-semibold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                    >
                      Periksa →
                    </button>
                  </div>
                </div>
              </div>

              {/* Alert 2 */}
              <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50/50 p-3 dark:border-amber-900/40 dark:bg-amber-950/20">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-amber-100 text-amber-600 font-bold dark:bg-amber-900/40 dark:text-amber-400 text-xs">
                  <Clock className="h-3.5 w-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-slate-900 dark:text-zinc-100">
                    {metrics.pending > 0
                      ? `${metrics.pending} permintaan Pending & deadline`
                      : "Tidak ada permintaan tertunda"}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                    {metrics.pending > 0
                      ? "Menunggu keputusan dan tinjauan Super Admin."
                      : "Semua permintaan telah diproses."}
                  </p>
                  <div className="mt-2 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">
                      {metrics.pending > 0 ? "Permintaan terbuka" : "Status terkini"}
                    </span>
                    <button
                      type="button"
                      onClick={() => onNavigate && onNavigate("actions")}
                      className="font-semibold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
                    >
                      Tinjau →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </PanelCard>

          {/* Aktivitas Terbaru Card */}
          <PanelCard
            title="Aktivitas Terbaru"
            subtitle="Perubahan terbaru di workspace"
            action={
              <button
                type="button"
                onClick={() => onNavigate && onNavigate("notifications")}
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                Riwayat →
              </button>
            }
          >
            <div className="space-y-3.5">
              {[
                {
                  id: 1,
                  user: "Budi Santoso",
                  action: "memperbarui status menjadi",
                  target: "Selesai",
                  task: "MM-1024 · Rekapitulasi Laporan Finansial",
                  time: "10 menit yang lalu",
                  statusType: "Selesai",
                },
                {
                  id: 2,
                  user: "Siti Rahma",
                  action: "mengajukan status",
                  target: "Pending",
                  task: "MM-1025 · Integrasi Payment Gateway API",
                  time: "32 menit yang lalu",
                  statusType: "Pending",
                },
                {
                  id: 3,
                  user: "Ahmad Fauzi",
                  action: "menambahkan komentar pada",
                  target: "Diskusi",
                  task: "MM-1021 · Audit Log Keamanan Q3",
                  time: "1 jam yang lalu",
                },
                {
                  id: 4,
                  user: "Super Admin",
                  action: "menyetujui pendaftaran akun",
                  target: "User Baru",
                  task: "Dewi Lestari · Divisi HR",
                  time: "3 jam yang lalu",
                },
              ].map((act) => (
                <div key={act.id} className="flex items-start gap-2.5 text-xs">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-zinc-800 text-[10px] font-bold text-slate-700 dark:text-zinc-300">
                    {act.user.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-800 dark:text-zinc-200 leading-tight">
                      <span className="font-semibold">{act.user}</span>{" "}
                      <span className="text-slate-500 dark:text-zinc-400">
                        {act.action}
                      </span>{" "}
                      <span className="font-medium text-blue-600 dark:text-blue-400">
                        {act.target}
                      </span>
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400 truncate mt-0.5">
                      {act.task}
                    </p>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {act.time}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </PanelCard>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;
