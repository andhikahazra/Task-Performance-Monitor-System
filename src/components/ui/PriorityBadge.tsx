import React from "react";

export type PriorityType = "Kritis" | "Tinggi" | "Menengah" | "Rendah";

export interface PriorityBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement> {
  priority: PriorityType | string;
  showDot?: boolean;
}

const priorityConfig: Record<
  string,
  {
    classes: string;
    dotClass: string;
  }
> = {
  Kritis: {
    classes:
      "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-800/40",
    dotClass: "bg-rose-500",
  },
  Tinggi: {
    classes:
      "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-800/40",
    dotClass: "bg-amber-500",
  },
  Menengah: {
    classes:
      "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-800/40",
    dotClass: "bg-blue-500",
  },
  Rendah: {
    classes:
      "bg-slate-100 text-slate-600 border-slate-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700",
    dotClass: "bg-slate-400",
  },
};

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({
  priority,
  showDot = true,
  className = "",
  children,
  ...props
}) => {
  const config = priorityConfig[priority] || {
    classes:
      "bg-slate-100 text-slate-600 border-slate-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700",
    dotClass: "bg-slate-400",
  };

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
      <span>{children || priority}</span>
    </span>
  );
};

export default PriorityBadge;
