import React from "react";

export type StatusType =
  | "Selesai"
  | "Dalam Proses"
  | "Pending"
  | "Terlambat"
  | "Belum Mulai"
  | "Aktif"
  | "Menunggu"
  | "Disetujui"
  | "Ditolak";

export interface StatusPillProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: StatusType | string;
  showDot?: boolean;
}

interface StatusStyle {
  label: string;
  classes: string;
  dotClass: string;
}

const normalizeStatusKey = (val: string): string => {
  const lower = (val || "").toLowerCase().trim().replace(/[-_]/g, " ");
  if (lower === "selesai" || lower === "completed" || lower === "done") {
    return "Selesai";
  }
  if (lower === "aktif" || lower === "active") {
    return "Aktif";
  }
  if (lower === "disetujui" || lower === "approved") {
    return "Disetujui";
  }
  if (lower === "dalam proses" || lower === "in progress") {
    return "Dalam Proses";
  }
  if (lower === "pending" || lower === "menunggu" || lower === "waiting") {
    return "Pending";
  }
  if (lower === "terlambat" || lower === "overdue" || lower === "late") {
    return "Terlambat";
  }
  if (lower === "ditolak" || lower === "rejected") {
    return "Ditolak";
  }
  if (lower === "belum mulai" || lower === "not started" || lower === "todo") {
    return "Belum Mulai";
  }
  return val;
};

const statusConfig: Record<string, StatusStyle> = {
  Selesai: {
    label: "Selesai",
    classes:
      "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-800/40",
    dotClass: "bg-emerald-500 dark:bg-emerald-400",
  },
  Aktif: {
    label: "Aktif",
    classes:
      "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-800/40",
    dotClass: "bg-emerald-500 dark:bg-emerald-400",
  },
  Disetujui: {
    label: "Disetujui",
    classes:
      "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-800/40",
    dotClass: "bg-emerald-500 dark:bg-emerald-400",
  },
  "Dalam Proses": {
    label: "Dalam Proses",
    classes:
      "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-800/40",
    dotClass: "bg-blue-500 dark:bg-blue-400",
  },
  Pending: {
    label: "Pending",
    classes:
      "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-800/40",
    dotClass: "bg-amber-500 dark:bg-amber-400",
  },
  Menunggu: {
    label: "Menunggu",
    classes:
      "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-800/40",
    dotClass: "bg-amber-500 dark:bg-amber-400",
  },
  Terlambat: {
    label: "Terlambat",
    classes:
      "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-800/40",
    dotClass: "bg-rose-500 dark:bg-rose-400",
  },
  Ditolak: {
    label: "Ditolak",
    classes:
      "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-800/40",
    dotClass: "bg-rose-500 dark:bg-rose-400",
  },
  "Belum Mulai": {
    label: "Belum Mulai",
    classes:
      "bg-slate-100 text-slate-600 border-slate-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700",
    dotClass: "bg-slate-400 dark:bg-zinc-500",
  },
};

const defaultConfig: StatusStyle = {
  label: "Status",
  classes:
    "bg-slate-100 text-slate-600 border-slate-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700",
  dotClass: "bg-slate-400 dark:bg-zinc-500",
};

/**
 * StatusPill
 *
 * Implements Mitra UI Anti-AI Slop Standards (Section 4.1):
 * - Subtle pastel background + 1px matching border + high-contrast text.
 * - Compact dimensions: px-2.5 py-0.5 text-xs font-semibold rounded-md border inline-flex items-center.
 * - Clean minimal 6px dot indicator inside.
 * - Strict guardrails: NO solid neon backgrounds, NO saturated gradients, NO gratuitous emojis.
 */
export const StatusPill: React.FC<StatusPillProps> = ({
  status,
  showDot = true,
  className = "",
  children,
  ...props
}) => {
  const normKey = normalizeStatusKey(status);
  const config = statusConfig[normKey] || defaultConfig;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-semibold rounded-md border tracking-wide select-none ${config.classes} ${className}`}
      {...props}
    >
      {showDot && (
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${config.dotClass}`}
          aria-hidden="true"
        />
      )}
      <span>{children || config.label || status}</span>
    </span>
  );
};

export default StatusPill;
