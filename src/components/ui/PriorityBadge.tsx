import React from "react";

export type PriorityType = "Kritis" | "Tinggi" | "Menengah" | "Rendah";

export interface PriorityBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement> {
  priority: PriorityType | string;
  variant?: "dot" | "pill";
  showDot?: boolean;
}

interface PriorityStyle {
  label: string;
  dotColor: string;
  textColor: string;
  pillClasses: string;
}

const normalizePriority = (val: string): PriorityType => {
  const lower = (val || "").toLowerCase().trim();
  if (lower.includes("kritis") || lower.includes("crit") || lower.includes("urgent")) {
    return "Kritis";
  }
  if (lower.includes("tinggi") || lower.includes("high")) {
    return "Tinggi";
  }
  if (lower.includes("rendah") || lower.includes("low")) {
    return "Rendah";
  }
  return "Menengah";
};

const priorityStyles: Record<PriorityType, PriorityStyle> = {
  Kritis: {
    label: "Kritis",
    dotColor: "bg-rose-500",
    textColor: "text-rose-700 dark:text-rose-400 font-semibold",
    pillClasses:
      "bg-rose-50 text-rose-700 border-rose-200/90 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-800/40",
  },
  Tinggi: {
    label: "Tinggi",
    dotColor: "bg-amber-500",
    textColor: "text-amber-700 dark:text-amber-400 font-medium",
    pillClasses:
      "bg-amber-50 text-amber-700 border-amber-200/90 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-800/40",
  },
  Menengah: {
    label: "Menengah",
    dotColor: "bg-blue-500",
    textColor: "text-slate-700 dark:text-zinc-300 font-medium",
    pillClasses:
      "bg-blue-50 text-blue-700 border-blue-200/90 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-800/40",
  },
  Rendah: {
    label: "Rendah",
    dotColor: "bg-slate-400 dark:bg-zinc-500",
    textColor: "text-slate-500 dark:text-zinc-400 font-medium",
    pillClasses:
      "bg-slate-100 text-slate-600 border-slate-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700",
  },
};

/**
 * PriorityBadge
 *
 * Implements Mitra UI Anti-AI Slop Standards:
 * - Default 'dot' variant: Clean minimal 6px dot + high-legibility muted text (Mitra UI Section 4.2).
 *   Prevents twin-box visual clash when displayed alongside StatusPill in data tables.
 * - 'pill' variant: Compact bordered pastel pill for standalone chips or filter dropdowns (Mitra UI Section 4.1).
 */
export const PriorityBadge: React.FC<PriorityBadgeProps> = ({
  priority,
  variant = "dot",
  showDot = true,
  className = "",
  children,
  ...props
}) => {
  const normKey = normalizePriority(priority);
  const style = priorityStyles[normKey];
  const displayLabel = children || style.label;

  if (variant === "pill") {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-semibold rounded-md border tracking-wide select-none ${style.pillClasses} ${className}`}
        {...props}
      >
        {showDot && (
          <span
            className={`w-1.5 h-1.5 rounded-full shrink-0 ${style.dotColor}`}
            aria-hidden="true"
          />
        )}
        <span>{displayLabel}</span>
      </span>
    );
  }

  // Default: Dot Indicator (Mitra UI 4.2)
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs select-none ${style.textColor} ${className}`}
      {...props}
    >
      {showDot && (
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${style.dotColor} ${
            normKey === "Kritis" ? "ring-2 ring-rose-400/20" : ""
          }`}
          aria-hidden="true"
        />
      )}
      <span>{displayLabel}</span>
    </span>
  );
};

export default PriorityBadge;
