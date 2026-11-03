import React from "react";

export type StatusType =
  | "Selesai"
  | "Dalam Proses"
  | "Pending"
  | "Terlambat"
  | "Belum Mulai"
  | "Aktif"
  | "Menunggu";

export interface StatusPillProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: StatusType | string;
  showDot?: boolean;
}

const statusConfig: Record<
  string,
  {
    classes: string;
    dotClass: string;
    label?: string;
  }
> = {
  Selesai: {
    classes:
      "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-800/40",
    dotClass: "bg-emerald-500",
  },
  Aktif: {
    classes:
      "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-800/40",
    dotClass: "bg-emerald-500",
  },
  "Dalam Proses": {
    classes:
      "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-800/40",
    dotClass: "bg-blue-500",
  },
  Pending: {
    classes:
      "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-800/40",
    dotClass: "bg-amber-500",
  },
  Menunggu: {
    classes:
      "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-800/40",
    dotClass: "bg-amber-500",
  },
  Terlambat: {
    classes:
      "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-800/40",
    dotClass: "bg-rose-500",
  },
  "Belum Mulai": {
    classes:
      "bg-slate-100 text-slate-600 border-slate-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700",
    dotClass: "bg-slate-400",
  },
};

export const StatusPill: React.FC<StatusPillProps> = ({
  status,
  showDot = true,
  className = "",
  children,
  ...props
}) => {
  const config = statusConfig[status] || {
    classes:
      "bg-slate-100 text-slate-600 border-slate-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700",
    dotClass: "bg-slate-400",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md border tracking-wide select-none ${config.classes} ${className}`}
      {...props}
    >
      {showDot && (
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${config.dotClass}`}
          aria-hidden="true"
        />
      )}
      <span>{children || status}</span>
    </span>
  );
};

export default StatusPill;
