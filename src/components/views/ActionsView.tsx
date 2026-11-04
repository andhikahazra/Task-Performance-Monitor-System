"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Clock,
  CheckCircle2,
  XCircle,
  RotateCw,
  ExternalLink,
  ShieldCheck,
  Info,
  AlertTriangle,
} from "lucide-react";
import { Action, SafeUser } from "@/types/database";
import { Button } from "@/components/ui/Button";
import { StatusPill } from "@/components/ui/StatusPill";
import { PanelCard } from "@/components/ui/PanelCard";
import { Select } from "@/components/ui/Select";
import { Pagination } from "@/components/ui/Pagination";
import { useToast } from "@/components/ui/Toast";

export interface ActionsViewProps {
  user: SafeUser;
  onOpenTaskDetail?: (taskId: number) => void;
  onActionResolved?: () => void;
}

export const ActionsView: React.FC<ActionsViewProps> = ({
  user,
  onOpenTaskDetail,
  onActionResolved,
}) => {
  const { success, error, info } = useToast();
  const [actions, setActions] = useState<Action[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>("pending");
  const [processingId, setProcessingId] = useState<number | null>(null);

  const loadActions = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/actions?status=${statusFilter}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setActions(json.data || []);
        }
      } else {
        error("Gagal memuat permohonan persetujuan.");
      }
    } catch (err) {
      console.error(err);
      error("Terjadi kendala jaringan.");
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, error]);

  useEffect(() => {
    loadActions();
  }, [loadActions]);

  // Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter]);

  const totalActions = actions.length;
  const totalPages = Math.ceil(totalActions / pageSize) || 1;

  const paginatedActions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return actions.slice(start, start + pageSize);
  }, [actions, currentPage, pageSize]);

  const handleDecision = async (
    actionId: number,
    decision: "approve" | "reject"
  ) => {
    setProcessingId(actionId);
    try {
      const res = await fetch("/api/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actionId,
          decision,
          notes:
            decision === "approve"
              ? "Disetujui oleh Super Admin"
              : "Ditolak oleh Super Admin",
        }),
      });

      const json = await res.json();
      if (json.success) {
        success(
          decision === "approve"
            ? "Permintaan berhasil disetujui."
            : "Permintaan telah ditolak."
        );
        loadActions();
        if (onActionResolved) {
          onActionResolved();
        }
      } else {
        error(json.message || "Gagal memproses keputusan.");
      }
    } catch (err) {
      console.error(err);
      error("Terjadi kesalahan jaringan.");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="text-[11px] font-bold tracking-wider uppercase text-slate-500 dark:text-zinc-400">
            ADMINISTRASI
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-zinc-100 tracking-tight mt-1">
            Perlu Tindakan
          </h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-0.5">
            Permintaan persetujuan status, tenggat waktu, dan registrasi pengguna.
          </p>
        </div>

        {/* Status Filter */}
        <div className="w-48">
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { label: "Menunggu (Pending)", value: "pending" },
              { label: "Disetujui", value: "approved" },
              { label: "Ditolak", value: "rejected" },
              { label: "Semua Riwayat", value: "all" },
            ]}
          />
        </div>
      </div>

      {/* Info notice */}
      <div className="flex items-center gap-2.5 rounded-lg border border-blue-200 bg-blue-50/70 p-3 text-xs text-blue-900 dark:border-blue-900/40 dark:bg-blue-950/20 dark:text-blue-300">
        <Info className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
        <span>
          Keputusan Super Admin di sini akan memperbarui status tugas secara
          otomatis dan mengirimkan notifikasi audit ke sistem.
        </span>
      </div>

      {/* Actions List */}
      <PanelCard
        title="Daftar Permohonan"
        subtitle="Permohonan yang memerlukan tindakan persetujuan atau penolakan"
        icon={<Clock className="h-4 w-4" />}
        iconTheme="blue"
      >
        {isLoading ? (
          <div className="py-12 text-center text-slate-400 flex items-center justify-center gap-2 text-xs">
            <RotateCw className="h-4 w-4 animate-spin text-blue-600" />
            <span>Memuat daftar tindakan...</span>
          </div>
        ) : actions.length === 0 ? (
          <div className="py-16 text-center flex flex-col items-center justify-center">
            <div className="h-12 w-12 rounded-xl bg-slate-100 dark:bg-zinc-900 text-slate-400 dark:text-zinc-500 flex items-center justify-center mb-3">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100">
              Tidak ada permohonan
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 max-w-sm">
              Semua permohonan persetujuan telah ditinjau atau tidak ada data yang sesuai dengan filter yang dipilih.
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {paginatedActions.map((act) => {
                const isPending = act.status === "pending";
                const isProcessing = processingId === act.id;

                return (
                  <div
                    key={act.id}
                    className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs transition-colors dark:border-zinc-800 dark:bg-zinc-950"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                            act.level === "Kritis"
                              ? "bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-800/40"
                              : act.level === "Penting"
                              ? "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-800/40"
                              : "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-800/40"
                          }`}
                        >
                          {act.level === "Kritis" ? <AlertTriangle className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                              {act.title}
                            </h3>
                            <StatusPill
                              status={
                                act.status === "pending"
                                  ? "Menunggu"
                                  : act.status === "approved"
                                  ? "Disetujui"
                                  : "Ditolak"
                              }
                            >
                              {act.status === "pending"
                                ? "Menunggu"
                                : act.status === "approved"
                                ? "Disetujui"
                                : "Ditolak"}
                            </StatusPill>
                          </div>

                          <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed">
                            {act.body}
                          </p>

                          <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 dark:text-zinc-500 pt-1">
                            <span>
                              Pemohon: <strong>{act.user_name || "Pengguna"}</strong> (
                              {act.user_email || "-"})
                            </span>
                            <span>•</span>
                            <span>
                              {new Date(act.created_at).toLocaleDateString("id-ID", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                            {act.task_id && (
                              <>
                                <span>•</span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    onOpenTaskDetail && onOpenTaskDetail(act.task_id!)
                                  }
                                  className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5 font-medium cursor-pointer active:scale-[0.98]"
                                >
                                  {act.task_code || "Tugas"}: {act.task_title}{" "}
                                  <ExternalLink className="h-3 w-3" />
                                </button>
                              </>
                            )}
                          </div>

                          {act.decision_notes && (
                            <div className="mt-2 text-[11px] italic text-slate-500 dark:text-zinc-400">
                              Catatan keputusan: "{act.decision_notes}"
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action buttons (only if pending) */}
                      {isPending && user.role === "admin" && (
                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={isProcessing}
                            onClick={() => handleDecision(act.id, "reject")}
                            className="text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 border-rose-200 active:scale-[0.98]"
                            leftIcon={<XCircle className="h-3.5 w-3.5" />}
                          >
                            Tolak
                          </Button>
                          <Button
                            variant="primary"
                            size="sm"
                            isLoading={isProcessing}
                            onClick={() => handleDecision(act.id, "approve")}
                            className="active:scale-[0.98]"
                            leftIcon={<CheckCircle2 className="h-3.5 w-3.5" />}
                          >
                            Setujui
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Bar */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalActions}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
              pageSizeOptions={[10, 20, 50]}
              className="mt-4"
            />
          </>
        )}
      </PanelCard>
    </div>
  );
};

export default ActionsView;
