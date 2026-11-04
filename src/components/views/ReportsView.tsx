"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  FileText,
  Download,
  Clock,
  AlertTriangle,
  RotateCw,
  CheckCircle2,
  ChevronRight,
  X,
  Search,
} from "lucide-react";
import { Task, SafeUser, ReportResponse, TaskStatus } from "@/types/database";
import { Button } from "@/components/ui/Button";
import { KpiCard } from "@/components/ui/KpiCard";
import { PanelCard } from "@/components/ui/PanelCard";
import { Select } from "@/components/ui/Select";
import { StatusPill } from "@/components/ui/StatusPill";
import { PriorityBadge } from "@/components/ui/PriorityBadge";
import { Pagination } from "@/components/ui/Pagination";
import { useToast } from "@/components/ui/Toast";

export interface ReportsViewProps {
  user: SafeUser;
  onOpenTaskDetail?: (task: Task) => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  user,
  onOpenTaskDetail,
}) => {
  const { error, success } = useToast();
  const [period, setPeriod] = useState<string>("all");
  const [reportData, setReportData] = useState<ReportResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [drillDownStatus, setDrillDownStatus] = useState<string | null>(null);
  const [drillSearch, setDrillSearch] = useState<string>("");

  // Dynamic Period Options (All + past 12 months)
  const periodOptions = useMemo(() => {
    const options: { label: string; value: string }[] = [
      { label: "Semua Periode", value: "all" },
    ];
    const now = new Date();
    const monthNames = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember",
    ];
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      options.push({
        label: `${monthNames[d.getMonth()]} ${y}`,
        value: `${y}-${m}`,
      });
    }
    return options;
  }, []);

  const loadReport = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/reports?period=${period}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setReportData(json.data);
        }
      } else {
        error("Gagal memuat laporan pekerjaan.");
      }
    } catch (err) {
      console.error(err);
      error("Terjadi kendala jaringan saat memuat laporan.");
    } finally {
      setIsLoading(false);
    }
  }, [period, error]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  // CSV Export
  const handleExportCsv = () => {
    if (!reportData || !reportData.tasks.length) {
      error("Tidak ada data laporan untuk diekspor.");
      return;
    }

    const headers = [
      "Kode",
      "Judul",
      "Kategori",
      "Pemilik",
      "Deadline",
      "Status",
      "Prioritas",
      "Tautan Bukti",
    ];

    const rows = reportData.tasks.map((t) => [
      `"${t.code}"`,
      `"${t.title.replace(/"/g, '""')}"`,
      `"${t.category}"`,
      `"${t.owner_name || ""}"`,
      `"${new Date(typeof t.deadline === "string" ? t.deadline.replace(" ", "T") : t.deadline).toISOString()}"`,
      `"${t.status}"`,
      `"${t.priority}"`,
      `"${t.evidence_url || ""}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Laporan_Pekerjaan_${period}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    success("Laporan pekerjaan berhasil diekspor ke CSV!");
  };

  // Filtered drill-down tasks
  const drillDownTasks = useMemo(() => {
    if (!reportData || !drillDownStatus) return [];
    return reportData.tasks
      .filter((t) => t.status === drillDownStatus)
      .filter((t) => {
        if (!drillSearch.trim()) return true;
        const q = drillSearch.toLowerCase();
        return (
          t.title.toLowerCase().includes(q) ||
          t.code.toLowerCase().includes(q) ||
          (t.owner_name && t.owner_name.toLowerCase().includes(q))
        );
      });
  }, [reportData, drillDownStatus, drillSearch]);

  // Drilldown Pagination
  const [drillPage, setDrillPage] = useState<number>(1);
  const drillPageSize = 10;

  useEffect(() => {
    setDrillPage(1);
  }, [drillDownStatus, drillSearch]);

  const totalDrillTasks = drillDownTasks.length;
  const totalDrillPages = Math.ceil(totalDrillTasks / drillPageSize) || 1;

  const paginatedDrillTasks = useMemo(() => {
    const start = (drillPage - 1) * drillPageSize;
    return drillDownTasks.slice(start, start + drillPageSize);
  }, [drillDownTasks, drillPage, drillPageSize]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="text-[11px] font-bold tracking-wider uppercase text-slate-500 dark:text-zinc-400">
            ANALISIS & LAPORAN
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-zinc-100 tracking-tight mt-1">
            Laporan
          </h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-0.5">
            Ringkasan pekerjaan berdasarkan periode dan status.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-48">
            <Select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              options={periodOptions}
            />
          </div>

          <Button
            variant="primary"
            onClick={handleExportCsv}
            leftIcon={<Download className="h-4 w-4" />}
          >
            Ekspor CSV
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      {reportData && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <KpiCard
            label={user.role === "admin" ? "Pekerjaan Dalam Data" : "Pekerjaan Saya"}
            value={reportData.kpis.totalTasks}
            color="blue"
            icon={<FileText className="h-4 w-4" />}
            footerText={
              user.role === "admin"
                ? "Seluruh pengguna · data operasional"
                : "Pekerjaan pribadi Anda"
            }
          />
          <KpiCard
            label="Rata-rata Waktu Selesai"
            value={
              reportData.kpis.averageDurationDays !== null
                ? `${reportData.kpis.averageDurationDays.toFixed(1).replace(".", ",")} hari`
                : "—"
            }
            color="green"
            icon={<Clock className="h-4 w-4" />}
            footerText={
              reportData.kpis.averageDurationDays !== null
                ? "Dihitung dari waktu mulai hingga selesai"
                : "Belum cukup data durasi"
            }
          />
          <KpiCard
            label="Persentase Terlambat"
            value={`${reportData.kpis.latePercentage.toFixed(1).replace(".", ",")}%`}
            color="red"
            icon={<AlertTriangle className="h-4 w-4" />}
            footerText={`${reportData.kpis.lateTasksCount} pekerjaan melewati deadline`}
          />
        </div>
      )}

      {/* Status Breakdown Summary Table */}
      <PanelCard
        title="Ringkasan Status Pekerjaan"
        subtitle="Klik pada baris status untuk melihat rincian pekerjaan"
      >
        <div className="table-wrap rounded-lg border border-slate-200 dark:border-zinc-800 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 border-b border-slate-200 dark:border-zinc-800">
                <th className="px-3.5 py-3 text-xs uppercase font-bold">Status</th>
                <th className="px-3.5 py-3 text-xs uppercase font-bold">Jumlah</th>
                <th className="px-3.5 py-3 text-xs uppercase font-bold">Persentase</th>
                <th className="px-3.5 py-3 text-xs uppercase font-bold">Keterangan</th>
                <th className="px-3.5 py-3 text-xs uppercase font-bold text-right">Rincian</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-zinc-800">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    Memuat ringkasan laporan...
                  </td>
                </tr>
              ) : !reportData || reportData.statusBreakdown.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    Tidak ada data untuk periode ini.
                  </td>
                </tr>
              ) : (
                reportData.statusBreakdown.map((item) => {
                  const isSelected = drillDownStatus === item.status;
                  return (
                    <tr
                      key={item.status}
                      onClick={() =>
                        setDrillDownStatus(isSelected ? null : item.status)
                      }
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-blue-50/70 dark:bg-blue-950/30"
                          : "hover:bg-slate-50 dark:hover:bg-zinc-900/50"
                      }`}
                    >
                      <td className="text-slate-800 dark:text-zinc-200 text-sm py-3 px-3.5 border-b border-slate-100 dark:border-zinc-800/60 font-bold">
                        <StatusPill status={item.status} />
                      </td>
                      <td className="text-slate-800 dark:text-zinc-200 text-sm py-3 px-3.5 border-b border-slate-100 dark:border-zinc-800/60 font-mono font-semibold">
                        {item.count}
                      </td>
                      <td className="text-slate-800 dark:text-zinc-200 text-sm py-3 px-3.5 border-b border-slate-100 dark:border-zinc-800/60 font-mono text-slate-600 dark:text-zinc-300">
                        {item.percentage.toFixed(1).replace(".", ",")}%
                      </td>
                      <td className="text-slate-800 dark:text-zinc-200 text-sm py-3 px-3.5 border-b border-slate-100 dark:border-zinc-800/60 text-slate-500 dark:text-zinc-400">
                        {item.description}
                      </td>
                      <td className="text-slate-800 dark:text-zinc-200 text-sm py-3 px-3.5 border-b border-slate-100 dark:border-zinc-800/60 text-right">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400">
                          {isSelected ? "Tutup" : "Lihat"}
                          <ChevronRight
                            className={`h-3.5 w-3.5 transition-transform ${
                              isSelected ? "rotate-90" : ""
                            }`}
                          />
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </PanelCard>

      {/* Drill-down Detail Panel */}
      {drillDownStatus && (
        <PanelCard
          title={
            <div className="flex items-center gap-2">
              <span>Pekerjaan Berstatus:</span>
              <StatusPill status={drillDownStatus} />
            </div>
          }
          subtitle={`Daftar tugas dengan status ${drillDownStatus} pada periode terpilih`}
          action={
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDrillDownStatus(null)}
              leftIcon={<X className="h-3.5 w-3.5" />}
            >
              Tutup Rincian
            </Button>
          }
        >
          {/* Search inside drilldown */}
          <div className="mb-4 max-w-sm">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Cari dalam status ini..."
                value={drillSearch}
                onChange={(e) => setDrillSearch(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white py-1.5 pl-8 pr-3 text-xs outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
              />
            </div>
          </div>

          <div className="table-wrap rounded-lg border border-slate-200 dark:border-zinc-800 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 border-b border-slate-200 dark:border-zinc-800">
                  <th className="px-3.5 py-3 text-xs uppercase font-bold">Kode</th>
                  <th className="px-3.5 py-3 text-xs uppercase font-bold">Judul</th>
                  <th className="px-3.5 py-3 text-xs uppercase font-bold">Pemilik</th>
                  <th className="px-3.5 py-3 text-xs uppercase font-bold">Deadline</th>
                  <th className="px-3.5 py-3 text-xs uppercase font-bold">Prioritas</th>
                  <th className="px-3.5 py-3 text-xs uppercase font-bold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-zinc-800">
                {drillDownTasks.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-400">
                      Tidak ada pekerjaan yang cocok.
                    </td>
                  </tr>
                ) : (
                  paginatedDrillTasks.map((task) => (
                    <tr
                      key={task.id}
                      className="hover:bg-blue-50/30 dark:hover:bg-zinc-800/30 transition-colors"
                    >
                      <td className="text-slate-800 dark:text-zinc-200 text-sm py-3 px-3.5 border-b border-slate-100 dark:border-zinc-800/60">
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-mono font-medium bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400 border border-slate-200/80 dark:border-zinc-700/60">
                          {task.code}
                        </span>
                      </td>
                      <td className="text-slate-800 dark:text-zinc-200 text-sm py-3 px-3.5 border-b border-slate-100 dark:border-zinc-800/60 font-semibold text-slate-900 dark:text-zinc-100">
                        {task.title}
                      </td>
                      <td className="text-slate-800 dark:text-zinc-200 text-sm py-3 px-3.5 border-b border-slate-100 dark:border-zinc-800/60 text-slate-600 dark:text-zinc-300">
                        {task.owner_name || "Staf"}
                      </td>
                      <td className="text-slate-800 dark:text-zinc-200 text-sm py-3 px-3.5 border-b border-slate-100 dark:border-zinc-800/60 text-slate-600 dark:text-zinc-300 whitespace-nowrap">
                        {new Date(
                          typeof task.deadline === "string" ? task.deadline.replace(" ", "T") : task.deadline
                        ).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="text-slate-800 dark:text-zinc-200 text-sm py-3 px-3.5 border-b border-slate-100 dark:border-zinc-800/60">
                        <PriorityBadge priority={task.priority} />
                      </td>
                      <td className="text-slate-800 dark:text-zinc-200 text-sm py-3 px-3.5 border-b border-slate-100 dark:border-zinc-800/60 text-right">
                        {onOpenTaskDetail && (
                          <button
                            type="button"
                            onClick={() => onOpenTaskDetail(task)}
                            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer active:scale-[0.98]"
                          >
                            Buka Detail →
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Drilldown Pagination */}
          <Pagination
            currentPage={drillPage}
            totalPages={totalDrillPages}
            totalItems={totalDrillTasks}
            pageSize={drillPageSize}
            onPageChange={setDrillPage}
            className="mt-4"
          />
        </PanelCard>
      )}
    </div>
  );
};

export default ReportsView;
