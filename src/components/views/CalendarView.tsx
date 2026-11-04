"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  RotateCw,
  AlertTriangle,
  Filter,
} from "lucide-react";
import { Task, SafeUser } from "@/types/database";
import { Button } from "@/components/ui/Button";
import { StatusPill } from "@/components/ui/StatusPill";
import { PriorityBadge } from "@/components/ui/PriorityBadge";
import { PanelCard } from "@/components/ui/PanelCard";
import { Select } from "@/components/ui/Select";

export interface CalendarViewProps {
  user: SafeUser;
  onOpenTaskDetail?: (task: Task) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  user,
  onOpenTaskDetail,
}) => {
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<SafeUser[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters
  const [selectedUserFilter, setSelectedUserFilter] = useState<string>("all");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("all");

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  // Fetch tasks and users
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [tasksRes, usersRes] = await Promise.all([
        fetch(`/api/tasks?year=${year}&month=${month + 1}&include_demo=false`),
        user.role === "admin" ? fetch("/api/users") : Promise.resolve(null),
      ]);

      if (tasksRes.ok) {
        const json = await tasksRes.json();
        if (json.success) {
          setTasks(json.data || []);
        }
      }

      if (usersRes && usersRes.ok) {
        const json = await usersRes.json();
        if (json.success) {
          setUsers(json.data || []);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [year, month, user.role]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Month navigation handlers
  const prevMonth = () => {
    setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  };

  const todayMonth = () => {
    const now = new Date();
    setCurrentDate(new Date(now.getFullYear(), now.getMonth(), 1));
    setSelectedDate(now);
  };

  // Month title in Indonesian
  const monthTitle = useMemo(() => {
    return currentDate.toLocaleDateString("id-ID", {
      month: "long",
      year: "numeric",
    });
  }, [currentDate]);

  // Filter tasks based on selectedUserFilter and selectedStatusFilter
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (
        user.role === "admin" &&
        selectedUserFilter !== "all" &&
        String(t.owner_id) !== selectedUserFilter
      ) {
        return false;
      }
      if (selectedStatusFilter !== "all" && t.status !== selectedStatusFilter) {
        return false;
      }
      return true;
    });
  }, [tasks, user.role, selectedUserFilter, selectedStatusFilter]);

  // Monthly stats
  const monthlyStats = useMemo(() => {
    const total = filteredTasks.length;
    const done = filteredTasks.filter((t) => t.status === "Selesai").length;
    const active = filteredTasks.filter((t) =>
      ["Dalam Proses", "Pending"].includes(t.status)
    ).length;
    const now = new Date();
    const late = filteredTasks.filter((t) => {
      if (t.status === "Selesai") return false;
      if (t.status === "Terlambat") return true;
      const d = new Date(
        typeof t.deadline === "string" ? t.deadline.replace(" ", "T") : t.deadline
      );
      return !isNaN(d.getTime()) && d < now;
    }).length;

    return { total, done, active, late };
  }, [filteredTasks]);

  // 7-day calendar cells (42 cells: 6 rows x 7 cols)
  const calendarCells = useMemo(() => {
    const dayNames = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
    const firstDayIndex = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const cells = [];
    for (let i = 0; i < 42; i++) {
      const dayOffset = i - firstDayIndex + 1;
      const isMuted = dayOffset < 1 || dayOffset > daysInMonth;

      let cellYear = year;
      let cellMonth = month;
      let cellDay = dayOffset;

      if (dayOffset < 1) {
        cellMonth = month - 1;
        cellDay = daysInPrevMonth + dayOffset;
      } else if (dayOffset > daysInMonth) {
        cellMonth = month + 1;
        cellDay = dayOffset - daysInMonth;
      }

      const cellDate = new Date(cellYear, cellMonth, cellDay);
      cellDate.setHours(0, 0, 0, 0);

      const isToday = cellDate.getTime() === today.getTime();
      const isSelected =
        cellDate.getDate() === selectedDate.getDate() &&
        cellDate.getMonth() === selectedDate.getMonth() &&
        cellDate.getFullYear() === selectedDate.getFullYear();

      // Tasks for this date
      const dateTasks = filteredTasks.filter((t) => {
        const d = new Date(
          typeof t.deadline === "string" ? t.deadline.replace(" ", "T") : t.deadline
        );
        if (isNaN(d.getTime())) return false;
        return (
          d.getDate() === cellDay &&
          d.getMonth() === cellMonth &&
          d.getFullYear() === cellYear
        );
      });

      cells.push({
        index: i,
        dayNumber: cellDay,
        date: cellDate,
        isMuted,
        isToday,
        isSelected,
        tasks: dateTasks,
      });
    }

    return { dayNames, cells };
  }, [year, month, selectedDate, filteredTasks]);

  // Tasks for selected date
  const selectedDayTasks = useMemo(() => {
    const sYear = selectedDate.getFullYear();
    const sMonth = selectedDate.getMonth();
    const sDate = selectedDate.getDate();

    return filteredTasks
      .filter((t) => {
        const d = new Date(
          typeof t.deadline === "string" ? t.deadline.replace(" ", "T") : t.deadline
        );
        if (isNaN(d.getTime())) return false;
        return (
          d.getFullYear() === sYear &&
          d.getMonth() === sMonth &&
          d.getDate() === sDate
        );
      })
      .sort((a, b) => {
        const da = new Date(
          typeof a.deadline === "string" ? a.deadline.replace(" ", "T") : a.deadline
        ).getTime();
        const db = new Date(
          typeof b.deadline === "string" ? b.deadline.replace(" ", "T") : b.deadline
        ).getTime();
        return da - db;
      });
  }, [selectedDate, filteredTasks]);

  const selectedDateFormatted = useMemo(() => {
    return selectedDate.toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }, [selectedDate]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="text-[11px] font-bold tracking-wider uppercase text-slate-500 dark:text-zinc-400">
            PERENCANAAN
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-zinc-100 tracking-tight mt-1">
            Kalender Pekerjaan
          </h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-0.5">
            {user.role === "admin"
              ? "Lihat jadwal seluruh pengguna dan buka pekerjaan langsung dari tanggalnya."
              : "Kalender pribadi Anda. Pekerjaan pengguna lain tidak ditampilkan."}
          </p>
        </div>

        {/* Month Navigation Buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={prevMonth}
            leftIcon={<ChevronLeft className="h-4 w-4" />}
          >
            Sebelumnya
          </Button>
          <Button variant="secondary" size="sm" onClick={todayMonth}>
            Hari ini
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={nextMonth}
            rightIcon={<ChevronRight className="h-4 w-4" />}
          >
            Berikutnya
          </Button>
        </div>
      </div>

      {/* Monthly Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs dark:border-zinc-800 dark:bg-zinc-950 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 shrink-0">
            <CalendarIcon className="h-4 w-4" />
          </div>
          <div>
            <div className="text-[11px] text-slate-500 dark:text-zinc-400 uppercase font-semibold">
              Total Bulan Ini
            </div>
            <div className="text-lg font-bold text-slate-900 dark:text-zinc-100">
              {monthlyStats.total}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs dark:border-zinc-800 dark:bg-zinc-950 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 shrink-0">
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <div>
            <div className="text-[11px] text-slate-500 dark:text-zinc-400 uppercase font-semibold">
              Selesai
            </div>
            <div className="text-lg font-bold text-slate-900 dark:text-zinc-100">
              {monthlyStats.done}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs dark:border-zinc-800 dark:bg-zinc-950 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400 shrink-0">
            <RotateCw className="h-4 w-4" />
          </div>
          <div>
            <div className="text-[11px] text-slate-500 dark:text-zinc-400 uppercase font-semibold">
              Aktif
            </div>
            <div className="text-lg font-bold text-slate-900 dark:text-zinc-100">
              {monthlyStats.active}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs dark:border-zinc-800 dark:bg-zinc-950 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400 shrink-0">
            <AlertTriangle className="h-4 w-4" />
          </div>
          <div>
            <div className="text-[11px] text-slate-500 dark:text-zinc-400 uppercase font-semibold">
              Terlambat
            </div>
            <div className="text-lg font-bold text-slate-900 dark:text-zinc-100">
              {monthlyStats.late}
            </div>
          </div>
        </div>
      </div>

      {/* Main Calendar Panel */}
      <PanelCard>
        {/* Calendar Header with Title and Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 pb-3 border-b border-slate-200 dark:border-zinc-800">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-zinc-100 capitalize">
              {monthTitle}
            </h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              {monthlyStats.total} tenggat pekerjaan pada bulan ini
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* User Filter (Admin Only) */}
            {user.role === "admin" && (
              <div className="w-48">
                <Select
                  value={selectedUserFilter}
                  onChange={(e) => setSelectedUserFilter(e.target.value)}
                  options={[
                    { label: "Semua Pengguna", value: "all" },
                    ...users.map((u) => ({
                      label: u.full_name,
                      value: String(u.id),
                    })),
                  ]}
                />
              </div>
            )}

            {/* Status Filter */}
            <div className="w-44">
              <Select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                options={[
                  { label: "Semua Status", value: "all" },
                  { label: "Selesai", value: "Selesai" },
                  { label: "Dalam Proses", value: "Dalam Proses" },
                  { label: "Pending", value: "Pending" },
                  { label: "Belum Mulai", value: "Belum Mulai" },
                ]}
              />
            </div>
          </div>
        </div>

        {/* 7-Day Calendar Grid */}
        <div className="rounded-xl border border-slate-200 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-950">
          {/* Day Names Header */}
          <div className="grid grid-cols-7 border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-center text-xs font-bold text-slate-600 dark:text-zinc-400 py-2.5">
            {calendarCells.dayNames.map((name) => (
              <div key={name}>{name}</div>
            ))}
          </div>

          {/* 42 Date Cells */}
          <div className="grid grid-cols-7 divide-x divide-y divide-slate-200 dark:divide-zinc-800">
            {calendarCells.cells.map((cell) => {
              return (
                <div
                  key={cell.index}
                  onClick={() => setSelectedDate(cell.date)}
                  className={`min-h-[90px] p-2 transition-colors cursor-pointer flex flex-col justify-between ${
                    cell.isMuted
                      ? "bg-slate-50/50 text-slate-400 dark:bg-zinc-900/20 dark:text-zinc-600"
                      : "hover:bg-blue-50/30 dark:hover:bg-zinc-900/50 text-slate-800 dark:text-zinc-200"
                  } ${
                    cell.isSelected
                      ? "ring-2 ring-inset ring-blue-500 bg-blue-50/20 dark:bg-blue-950/20"
                      : ""
                  }`}
                >
                  {/* Date number & Today tag */}
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-xs font-bold ${
                        cell.isToday
                          ? "flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white"
                          : ""
                      }`}
                    >
                      {cell.dayNumber}
                    </span>

                    {cell.isToday && (
                      <span className="rounded bg-blue-100 dark:bg-blue-900/40 px-1 py-0.2 text-[9px] font-bold text-blue-700 dark:text-blue-300">
                        HARI INI
                      </span>
                    )}
                  </div>

                  {/* Events list */}
                  <div className="space-y-1 flex-1 overflow-hidden">
                    {cell.tasks.slice(0, 3).map((task) => (
                      <div
                        key={task.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onOpenTaskDetail) onOpenTaskDetail(task);
                        }}
                        className={`truncate rounded px-1.5 py-0.5 text-[10px] font-medium transition-transform hover:scale-[1.02] cursor-pointer ${
                          task.status === "Selesai"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300"
                            : task.status === "Pending"
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300"
                            : task.status === "Terlambat"
                            ? "bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300"
                            : "bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300"
                        }`}
                        title={`${task.title} (${task.status})`}
                      >
                        {task.title}
                      </div>
                    ))}

                    {cell.tasks.length > 3 && (
                      <div className="text-[10px] font-semibold text-slate-500 dark:text-zinc-400 pl-1">
                        +{cell.tasks.length - 3} lainnya
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Date Agenda Card */}
        <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                Agenda Tanggal: {selectedDateFormatted}
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                {selectedDayTasks.length > 0
                  ? `${selectedDayTasks.length} pekerjaan dengan tenggat pada tanggal ini.`
                  : "Tidak ada pekerjaan dengan tenggat pada tanggal ini."}
              </p>
            </div>
          </div>

          {selectedDayTasks.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-400">
              Tidak ada agenda pekerjaan pada tanggal terpilih.
            </div>
          ) : (
            <div className="space-y-2.5">
              {selectedDayTasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => onOpenTaskDetail && onOpenTaskDetail(task)}
                  className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-950 hover:border-blue-400 dark:hover:border-blue-600 transition-all cursor-pointer active:scale-[0.99] shadow-xs"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-1.5 h-8 rounded-full ${
                        task.status === "Selesai"
                          ? "bg-emerald-500"
                          : task.status === "Pending"
                          ? "bg-amber-500"
                          : task.status === "Terlambat"
                          ? "bg-rose-500"
                          : "bg-blue-500"
                      }`}
                    />
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-zinc-100">
                        {task.title}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-zinc-400 flex items-center gap-2 mt-1">
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400 border border-slate-200/80 dark:border-zinc-700/60">
                          {task.code}
                        </span>
                        <span>•</span>
                        <span>{task.owner_name || "Staf"}</span>
                        <span>•</span>
                        <PriorityBadge priority={task.priority} />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <StatusPill status={task.status} />
                    <span className="text-xs font-mono text-slate-500 dark:text-zinc-400">
                      {new Date(
                        typeof task.deadline === "string"
                          ? task.deadline.replace(" ", "T")
                          : task.deadline
                      ).toLocaleTimeString("id-ID", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </PanelCard>
    </div>
  );
};

export default CalendarView;
