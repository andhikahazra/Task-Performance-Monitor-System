"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  TrendingUp,
  Download,
  Award,
  CheckCircle,
  Clock,
  AlertTriangle,
  ClipboardCheck,
  Info,
} from "lucide-react";
import { SafeUser, EvaluationResponse, UserEvaluationResult } from "@/types/database";
import { Button } from "@/components/ui/Button";
import { KpiCard } from "@/components/ui/KpiCard";
import { PanelCard } from "@/components/ui/PanelCard";
import { Select } from "@/components/ui/Select";
import { StatusPill } from "@/components/ui/StatusPill";
import { Pagination } from "@/components/ui/Pagination";
import { useToast } from "@/components/ui/Toast";

export interface EvaluationViewProps {
  user: SafeUser;
}

export const EvaluationView: React.FC<EvaluationViewProps> = ({ user }) => {
  const { error, success } = useToast();
  const [periodMode, setPeriodMode] = useState<"month" | "week">("month");
  const [dateParam, setDateParam] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [selectedUserId, setSelectedUserId] = useState<string>("all");
  const [data, setData] = useState<EvaluationResponse | null>(null);
  const [usersList, setUsersList] = useState<SafeUser[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Dynamic Month Options (Current month + past 11 months)
  const monthOptions = useMemo(() => {
    const options: { label: string; value: string }[] = [];
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

  // Dynamic Week Options (Current week + past 7 weeks)
  const weekOptions = useMemo(() => {
    const options: { label: string; value: string }[] = [];
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const currentMonday = new Date(now);
    currentMonday.setDate(now.getDate() + diffToMonday);
    currentMonday.setHours(0, 0, 0, 0);

    const monthNamesShort = [
      "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
      "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
    ];

    for (let i = 0; i < 8; i++) {
      const mon = new Date(currentMonday);
      mon.setDate(currentMonday.getDate() - i * 7);

      const sun = new Date(mon);
      sun.setDate(mon.getDate() + 6);

      const monDay = String(mon.getDate()).padStart(2, "0");
      const sunDay = String(sun.getDate()).padStart(2, "0");
      const monM = monthNamesShort[mon.getMonth()];
      const sunM = monthNamesShort[sun.getMonth()];
      const y = sun.getFullYear();

      const valY = mon.getFullYear();
      const valM = String(mon.getMonth() + 1).padStart(2, "0");
      const valD = String(mon.getDate()).padStart(2, "0");
      const val = `${valY}-${valM}-${valD}`;

      const label =
        mon.getMonth() === sun.getMonth()
          ? `${monDay} – ${sunDay} ${sunM} ${y}`
          : `${monDay} ${monM} – ${sunDay} ${sunM} ${y}`;

      options.push({ label, value: val });
    }
    return options;
  }, []);

  // Load users for user filter
  useEffect(() => {
    async function loadUsers() {
      try {
        const res = await fetch("/api/users");
        if (res.ok) {
          const json = await res.json();
          if (json.success) setUsersList(json.data || []);
        }
      } catch (e) {
        console.error(e);
      }
    }
    loadUsers();
  }, []);

  // Load Evaluation Data
  const loadEvaluation = useCallback(async () => {
    setIsLoading(true);
    try {
      const q = new URLSearchParams({
        period: periodMode,
        date: dateParam,
      });
      if (selectedUserId !== "all") {
        q.append("user_id", selectedUserId);
      }

      const res = await fetch(`/api/evaluation?${q.toString()}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setData(json.data);
        }
      } else {
        error("Gagal memuat data evaluasi kinerja.");
      }
    } catch (err) {
      console.error(err);
      error("Terjadi kendala jaringan saat memuat data evaluasi.");
    } finally {
      setIsLoading(false);
    }
  }, [periodMode, dateParam, selectedUserId, error]);

  useEffect(() => {
    loadEvaluation();
  }, [loadEvaluation]);

  // Export CSV
  const handleExportCsv = () => {
    if (!data || !data.results.length) {
      error("Tidak ada data evaluasi untuk diekspor.");
      return;
    }

    const headers = [
      "Peringkat",
      "Nama Pengguna",
      "Departemen",
      "Jatuh Tempo",
      "Selesai",
      "Persentase Penyelesaian (%)",
      "Ketepatan Waktu (%)",
      "Skor Evaluasi",
      "Kategori",
    ];

    const rows = data.results.map((r, i) => [
      `#${i + 1}`,
      `"${r.userName}"`,
      `"${r.department}"`,
      r.dueCount,
      r.completedCount,
      r.completionRate !== null ? r.completionRate.toFixed(1) : "-",
      r.timelyRate !== null ? r.timelyRate.toFixed(1) : "-",
      r.score !== null ? r.score.toFixed(1) : "-",
      `"${r.category}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `Evaluasi_Kinerja_${periodMode}_${dateParam}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    success("Data evaluasi berhasil diekspor ke CSV!");
  };

  // Flatten evaluated tasks breakdown
  const evaluatedTasksBreakdown = useMemo(() => {
    if (!data) return [];
    return data.results.flatMap((r) =>
      r.tasks.map((t) => ({
        ...t,
        owner_name: r.userName,
        department: r.department,
      }))
    );
  }, [data]);

  // Leaderboard Pagination State
  const [leaderboardPage, setLeaderboardPage] = useState<number>(1);
  const [leaderboardPageSize, setLeaderboardPageSize] = useState<number>(10);

  // Breakdown Tasks Pagination State
  const [breakdownPage, setBreakdownPage] = useState<number>(1);
  const [breakdownPageSize, setBreakdownPageSize] = useState<number>(10);

  // Reset pagination when period or user filter changes
  useEffect(() => {
    setLeaderboardPage(1);
    setBreakdownPage(1);
  }, [periodMode, dateParam, selectedUserId]);

  // Paginated Leaderboard Results
  const totalLeaderboard = data?.results.length || 0;
  const totalLeaderboardPages = Math.ceil(totalLeaderboard / leaderboardPageSize) || 1;

  const paginatedLeaderboardResults = useMemo(() => {
    if (!data?.results) return [];
    const start = (leaderboardPage - 1) * leaderboardPageSize;
    return data.results.slice(start, start + leaderboardPageSize);
  }, [data?.results, leaderboardPage, leaderboardPageSize]);

  // Paginated Tasks Breakdown
  const totalBreakdown = evaluatedTasksBreakdown.length;
  const totalBreakdownPages = Math.ceil(totalBreakdown / breakdownPageSize) || 1;

  const paginatedBreakdownTasks = useMemo(() => {
    const start = (breakdownPage - 1) * breakdownPageSize;
    return evaluatedTasksBreakdown.slice(start, start + breakdownPageSize);
  }, [evaluatedTasksBreakdown, breakdownPage, breakdownPageSize]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="text-[11px] font-bold tracking-wider uppercase text-slate-500 dark:text-zinc-400">
            KINERJA & AKUNTABILITAS
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-zinc-100 tracking-tight mt-1">
            Evaluasi Kinerja Otomatis
          </h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-0.5">
            Penilaian per pengguna berdasarkan penyelesaian pekerjaan, deadline,
            dan status pekerjaan.
          </p>
        </div>

        <div>
          <Button
            variant="outline"
            onClick={handleExportCsv}
            leftIcon={<Download className="h-4 w-4" />}
          >
            Ekspor Evaluasi
          </Button>
        </div>
      </div>

      {/* Control Filters Panel */}
      <PanelCard>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1.5">
              Periode Evaluasi
            </label>
            <Select
              value={periodMode}
              onChange={(e) => {
                const mode = e.target.value as "month" | "week";
                setPeriodMode(mode);
                if (mode === "month") {
                  setDateParam(monthOptions[0]?.value || "");
                } else {
                  setDateParam(weekOptions[0]?.value || "");
                }
              }}
              options={[
                { label: "Bulanan", value: "month" },
                { label: "Mingguan", value: "week" },
              ]}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1.5">
              Rentang Tanggal
            </label>
            <Select
              value={dateParam}
              onChange={(e) => setDateParam(e.target.value)}
              options={periodMode === "month" ? monthOptions : weekOptions}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1.5">
              Filter Pengguna
            </label>
            <Select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              options={[
                { label: "Semua Pengguna", value: "all" },
                ...usersList.map((u) => ({
                  label: u.full_name,
                  value: String(u.id),
                })),
              ]}
            />
          </div>
        </div>

        {data && (
          <div className="mt-3 text-xs text-slate-500 dark:text-zinc-400">
            Periode {data.period.mode === "month" ? "bulanan" : "mingguan"}:{" "}
            <strong>{data.period.label}</strong>. Nilai dihitung otomatis: Skor =
            50% penyelesaian + 50% ketepatan waktu.
          </div>
        )}
      </PanelCard>

      {/* 4 Summary KPI Cards */}
      {data && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
          <KpiCard
            label="Rata-rata Skor Valid"
            value={
              data.summary.averageScore !== null
                ? data.summary.averageScore.toFixed(1).replace(".", ",")
                : "—"
            }
            color="blue"
            icon={<Award className="h-4 w-4" />}
            footerText="Skor gabungan tim"
          />
          <KpiCard
            label="Penyelesaian"
            value={
              data.summary.overallCompletionRate !== null
                ? `${data.summary.overallCompletionRate.toFixed(1).replace(".", ",")}%`
                : "—"
            }
            color="green"
            icon={<CheckCircle className="h-4 w-4" />}
            footerText={`${data.summary.totalCompletedTasks} dari ${data.summary.totalDueTasks} selesai`}
          />
          <KpiCard
            label="Tepat Waktu"
            value={
              data.summary.overallTimelyRate !== null
                ? `${data.summary.overallTimelyRate.toFixed(1).replace(".", ",")}%`
                : "—"
            }
            color="purple"
            icon={<Clock className="h-4 w-4" />}
            footerText="Selesai sebelum deadline"
          />
          <KpiCard
            label="Perlu Perhatian"
            value={data.summary.totalTasksNeedingAttention}
            color="red"
            icon={<AlertTriangle className="h-4 w-4" />}
            footerText="Pekerjaan tertunda / terlambat"
          />
        </div>
      )}

      {/* Score Comparison Bar Chart & AI Review Card */}
      {data && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Score Comparison Bar Chart */}
          <PanelCard
            title="Perbandingan Skor Kinerja"
            subtitle="Distribusi pencapaian skor per individu"
            icon={<TrendingUp className="h-4 w-4" />}
            iconTheme="blue"
          >
            <div className="space-y-3 pt-2">
              {data.results.map((res) => {
                const scoreVal = res.score ?? 0;
                const barColor =
                  scoreVal >= 85
                    ? "bg-emerald-500"
                    : scoreVal >= 70
                    ? "bg-blue-600"
                    : "bg-amber-500";

                return (
                  <div key={res.userId} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800 dark:text-zinc-200">
                        {res.userName}
                      </span>
                      <span className="font-mono font-bold text-slate-700 dark:text-zinc-300">
                        {res.score !== null ? `${res.score.toFixed(1)} / 100` : "—"}
                      </span>
                    </div>

                    <div className="h-2.5 w-full rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                        style={{ width: `${Math.min(100, Math.max(0, scoreVal))}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </PanelCard>

          {/* Ringkasan Kinerja & Rekomendasi Evaluasi Card */}
          <PanelCard
            title="Ringkasan Kinerja & Rekomendasi Evaluasi"
            subtitle="Rangkuman audit operasional dan tindak lanjut tim"
            icon={<ClipboardCheck className="h-4 w-4" />}
            iconTheme="blue"
          >
            <div className="space-y-3">
              <p className="text-xs text-slate-700 dark:text-zinc-300 leading-relaxed bg-slate-50/80 dark:bg-zinc-900/50 p-3 rounded-lg border border-slate-200/80 dark:border-zinc-800">
                {data.aiReview.summary}
              </p>

              <div className="space-y-2 pt-1">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                  Temuan Kunci:
                </h4>
                {data.aiReview.findings.map((f, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2.5 rounded-lg border border-slate-200 bg-white p-2.5 dark:border-zinc-800 dark:bg-zinc-900/60 text-xs"
                  >
                    <span className="mt-1 flex h-2 w-2 shrink-0 rounded-full bg-blue-600 dark:bg-blue-400" />
                    <div>
                      <strong className="text-slate-900 dark:text-zinc-100 block">
                        {f.title}
                      </strong>
                      <span className="text-slate-500 dark:text-zinc-400 text-[11px]">
                        {f.description}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </PanelCard>
        </div>
      )}

      {/* Leaderboard Table */}
      <PanelCard
        title="Peringkat Evaluasi Pengguna"
        subtitle="Daftar peringkat terurut berdasarkan skor gabungan"
      >
        <div className="table-wrap rounded-lg border border-slate-200 dark:border-zinc-800 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 border-b border-slate-200 dark:border-zinc-800">
                <th className="px-3.5 py-3 text-xs uppercase font-bold">Peringkat</th>
                <th className="px-3.5 py-3 text-xs uppercase font-bold">Pengguna</th>
                <th className="px-3.5 py-3 text-xs uppercase font-bold">Jatuh Tempo</th>
                <th className="px-3.5 py-3 text-xs uppercase font-bold">Selesai</th>
                <th className="px-3.5 py-3 text-xs uppercase font-bold">Penyelesaian</th>
                <th className="px-3.5 py-3 text-xs uppercase font-bold">Tepat Waktu</th>
                <th className="px-3.5 py-3 text-xs uppercase font-bold">Skor</th>
                <th className="px-3.5 py-3 text-xs uppercase font-bold text-right">Kategori</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-zinc-800">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Memuat evaluasi...
                  </td>
                </tr>
              ) : !data || data.results.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Belum ada data evaluasi untuk periode ini.
                  </td>
                </tr>
              ) : (
                paginatedLeaderboardResults.map((item, idx) => {
                  const globalRank = (leaderboardPage - 1) * leaderboardPageSize + idx + 1;
                  return (
                    <tr
                      key={item.userId}
                      className="hover:bg-blue-50/40 dark:hover:bg-zinc-800/30 transition-colors"
                    >
                      <td className="text-slate-800 dark:text-zinc-200 text-sm py-3 px-3.5 border-b border-slate-100 dark:border-zinc-800/60 font-bold">
                        {item.score !== null ? (
                          globalRank === 1 ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/60 shadow-xs">
                              <Award className="w-3.5 h-3.5 text-amber-500" />
                              #1
                            </span>
                          ) : globalRank === 2 ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300 dark:bg-zinc-800 dark:text-zinc-200 dark:border-zinc-700 shadow-xs">
                              <Award className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-400" />
                              #2
                            </span>
                          ) : globalRank === 3 ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100/60 text-amber-800 border border-amber-300/80 dark:bg-amber-950/30 dark:text-amber-500 dark:border-amber-900 shadow-xs">
                              <Award className="w-3.5 h-3.5 text-amber-700 dark:text-amber-600" />
                              #3
                            </span>
                          ) : (
                            <span className="text-slate-500 dark:text-zinc-400 font-mono text-xs font-semibold px-2 py-0.5">
                              #{globalRank}
                            </span>
                          )
                        ) : (
                          <span className="text-slate-400 dark:text-zinc-500 font-mono text-xs">
                            —
                          </span>
                        )}
                      </td>
                      <td className="text-slate-800 dark:text-zinc-200 text-sm py-3 px-3.5 border-b border-slate-100 dark:border-zinc-800/60">
                        <div className="font-semibold text-slate-900 dark:text-zinc-100">
                          {item.userName}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {item.department}
                        </div>
                      </td>
                      <td className="text-slate-800 dark:text-zinc-200 text-sm py-3 px-3.5 border-b border-slate-100 dark:border-zinc-800/60 font-mono">
                        {item.dueCount}
                      </td>
                      <td className="text-slate-800 dark:text-zinc-200 text-sm py-3 px-3.5 border-b border-slate-100 dark:border-zinc-800/60 font-mono">
                        {item.completedCount}
                      </td>
                      <td className="text-slate-800 dark:text-zinc-200 text-sm py-3 px-3.5 border-b border-slate-100 dark:border-zinc-800/60 font-mono">
                        {item.completionRate !== null
                          ? `${item.completionRate.toFixed(1).replace(".", ",")}%`
                          : "—"}
                      </td>
                      <td className="text-slate-800 dark:text-zinc-200 text-sm py-3 px-3.5 border-b border-slate-100 dark:border-zinc-800/60 font-mono">
                        {item.timelyRate !== null
                          ? `${item.timelyRate.toFixed(1).replace(".", ",")}%`
                          : "—"}
                      </td>
                      <td className="text-slate-800 dark:text-zinc-200 text-sm py-3 px-3.5 border-b border-slate-100 dark:border-zinc-800/60 font-bold text-slate-900 dark:text-zinc-100 font-mono">
                        {item.score !== null ? item.score.toFixed(1).replace(".", ",") : "—"}
                      </td>
                      <td className="text-slate-800 dark:text-zinc-200 text-sm py-3 px-3.5 border-b border-slate-100 dark:border-zinc-800/60 text-right">
                        <StatusPill
                          status={
                            item.score === null
                              ? "Belum Mulai"
                              : item.score >= 80
                              ? "Selesai"
                              : item.score >= 70
                              ? "Pending"
                              : "Terlambat"
                          }
                        >
                          {item.category}
                        </StatusPill>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {totalLeaderboard > 0 && (
          <Pagination
            currentPage={leaderboardPage}
            totalPages={totalLeaderboardPages}
            totalItems={totalLeaderboard}
            pageSize={leaderboardPageSize}
            onPageChange={setLeaderboardPage}
            onPageSizeChange={setLeaderboardPageSize}
            pageSizeOptions={[10, 20, 50]}
            className="mt-4"
          />
        )}
      </PanelCard>

      {/* Operational Insights List */}
      {data && data.insights.length > 0 && (
        <PanelCard
          title="Wawasan Operasional"
          subtitle="Rekomendasi tindak lanjut manajerial"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {data.insights.map((ins, idx) => {
              const renderIcon = (iconName: string) => {
                switch (iconName) {
                  case "trending":
                  case "↗":
                    return <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />;
                  case "alert":
                  case "!":
                    return <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />;
                  case "check":
                  case "✓":
                    return <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />;
                  case "clock":
                  case "◷":
                    return <Clock className="h-4 w-4 text-rose-600 dark:text-rose-400" />;
                  default:
                    return <Info className="h-4 w-4 text-slate-600 dark:text-zinc-400" />;
                }
              };

              return (
                <div
                  key={idx}
                  className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs dark:border-zinc-800 dark:bg-zinc-950"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800">
                    {renderIcon(ins.icon)}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-zinc-100">
                      {ins.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                      {ins.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </PanelCard>
      )}

      {/* Evaluated Tasks Breakdown Table */}
      {evaluatedTasksBreakdown.length > 0 && (
        <PanelCard
          title="Rincian Pekerjaan Terkait"
          subtitle="Daftar pekerjaan yang dievaluasi pada periode terpilih"
        >
          <div className="table-wrap rounded-lg border border-slate-200 dark:border-zinc-800 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 border-b border-slate-200 dark:border-zinc-800">
                  <th className="px-3.5 py-3 text-xs uppercase font-bold">Pekerjaan</th>
                  <th className="px-3.5 py-3 text-xs uppercase font-bold">Pemilik</th>
                  <th className="px-3.5 py-3 text-xs uppercase font-bold">Deadline</th>
                  <th className="px-3.5 py-3 text-xs uppercase font-bold">Status</th>
                  <th className="px-3.5 py-3 text-xs uppercase font-bold text-right">Ketepatan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-zinc-800">
                {paginatedBreakdownTasks.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/30">
                    <td className="text-slate-800 dark:text-zinc-200 text-sm py-3 px-3.5 border-b border-slate-100 dark:border-zinc-800/60">
                      <div className="font-semibold text-slate-900 dark:text-zinc-100">
                        {t.title}
                      </div>
                      {t.code && (
                        <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded border border-slate-200 bg-slate-50 text-[10px] font-mono font-medium text-slate-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
                          {t.code}
                        </span>
                      )}
                    </td>
                    <td className="text-slate-800 dark:text-zinc-200 text-sm py-3 px-3.5 border-b border-slate-100 dark:border-zinc-800/60">
                      <div className="font-medium text-slate-900 dark:text-zinc-100">{t.owner_name}</div>
                      <div className="text-[10px] text-slate-400">{t.department}</div>
                    </td>
                    <td className="text-slate-800 dark:text-zinc-200 text-sm py-3 px-3.5 border-b border-slate-100 dark:border-zinc-800/60 font-mono">
                      {new Date(t.deadline).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="text-slate-800 dark:text-zinc-200 text-sm py-3 px-3.5 border-b border-slate-100 dark:border-zinc-800/60">
                      <StatusPill status={t.status} />
                    </td>
                    <td className="text-slate-800 dark:text-zinc-200 text-sm py-3 px-3.5 border-b border-slate-100 dark:border-zinc-800/60 text-right">
                      {t.status === "Selesai" ? (
                        t.onTime ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/60">
                            <CheckCircle className="w-3 h-3 text-emerald-500" />
                            Tepat Waktu
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/60">
                            <AlertTriangle className="w-3 h-3 text-rose-500" />
                            Terlambat
                          </span>
                        )
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800/60">
                          <Clock className="w-3 h-3 text-blue-500" />
                          Dalam Proses
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalBreakdown > 0 && (
            <Pagination
              currentPage={breakdownPage}
              totalPages={totalBreakdownPages}
              totalItems={totalBreakdown}
              pageSize={breakdownPageSize}
              onPageChange={setBreakdownPage}
              onPageSizeChange={setBreakdownPageSize}
              pageSizeOptions={[10, 25, 50]}
              className="mt-4"
            />
          )}
        </PanelCard>
      )}
    </div>
  );
};

export default EvaluationView;
