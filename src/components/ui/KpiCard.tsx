import React from "react";

export type KpiColor = "blue" | "green" | "amber" | "red" | "purple" | "cyan";

export interface KpiCardProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  color?: KpiColor;
  trend?: string;
  trendGood?: boolean;
  footerText?: React.ReactNode;
  variant?: "standard" | "gradient";
}

const colorStyles: Record<
  KpiColor,
  {
    iconBg: string;
    iconColor: string;
    iconBorder: string;
    gradientBg: string;
    dotBg: string;
  }
> = {
  blue: {
    iconBg: "bg-blue-50 dark:bg-blue-950/60",
    iconColor: "text-blue-600 dark:text-blue-400",
    iconBorder: "border-blue-100 dark:border-blue-900/50",
    gradientBg:
      "bg-gradient-to-br from-blue-600 to-indigo-600 text-white border-0 shadow-md",
    dotBg: "bg-blue-500",
  },
  green: {
    iconBg: "bg-emerald-50 dark:bg-emerald-950/60",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    iconBorder: "border-emerald-100 dark:border-emerald-900/50",
    gradientBg:
      "bg-gradient-to-br from-emerald-600 to-teal-600 text-white border-0 shadow-md",
    dotBg: "bg-emerald-500",
  },
  amber: {
    iconBg: "bg-amber-50 dark:bg-amber-950/60",
    iconColor: "text-amber-600 dark:text-amber-400",
    iconBorder: "border-amber-100 dark:border-amber-900/50",
    gradientBg:
      "bg-gradient-to-br from-amber-600 to-orange-500 text-white border-0 shadow-md",
    dotBg: "bg-amber-500",
  },
  red: {
    iconBg: "bg-rose-50 dark:bg-rose-950/60",
    iconColor: "text-rose-600 dark:text-rose-400",
    iconBorder: "border-rose-100 dark:border-rose-900/50",
    gradientBg:
      "bg-gradient-to-br from-rose-600 to-red-600 text-white border-0 shadow-md",
    dotBg: "bg-rose-500",
  },
  purple: {
    iconBg: "bg-purple-50 dark:bg-purple-950/60",
    iconColor: "text-purple-600 dark:text-purple-400",
    iconBorder: "border-purple-100 dark:border-purple-900/50",
    gradientBg:
      "bg-gradient-to-br from-purple-600 to-violet-600 text-white border-0 shadow-md",
    dotBg: "bg-purple-500",
  },
  cyan: {
    iconBg: "bg-cyan-50 dark:bg-cyan-950/60",
    iconColor: "text-cyan-600 dark:text-cyan-400",
    iconBorder: "border-cyan-100 dark:border-cyan-900/50",
    gradientBg:
      "bg-gradient-to-br from-cyan-600 to-blue-600 text-white border-0 shadow-md",
    dotBg: "bg-cyan-500",
  },
};

export const KpiCard: React.FC<KpiCardProps> = ({
  label,
  value,
  icon,
  color = "blue",
  trend,
  trendGood,
  footerText,
  variant = "standard",
  className = "",
  ...props
}) => {
  const currentConfig = colorStyles[color] || colorStyles.blue;
  const isGradient = variant === "gradient";

  return (
    <div
      className={`kpi-card relative overflow-hidden rounded-xl border border-slate-200/80 bg-white dark:border-zinc-800 dark:bg-zinc-900 p-4 shadow-xs hover:shadow-md transition-all duration-200 ${
        isGradient
          ? currentConfig.gradientBg
          : "text-slate-900 dark:text-zinc-100"
      } ${className}`}
      {...props}
    >
      <div className="flex items-center justify-between gap-2">
        <span
          className={`text-xs font-semibold uppercase tracking-wider ${
            isGradient
              ? "text-white/80"
              : "text-slate-500 dark:text-zinc-400"
          }`}
        >
          {label}
        </span>
        {icon && (
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-lg border ${
              isGradient
                ? "bg-white/20 text-white border-white/20"
                : `${currentConfig.iconBg} ${currentConfig.iconColor} ${currentConfig.iconBorder}`
            }`}
          >
            {icon}
          </div>
        )}
      </div>

      <div className="my-2.5">
        <span
          className={`text-3xl font-extrabold tracking-tight font-mono tabular-nums ${
            isGradient ? "text-white" : "text-slate-900 dark:text-zinc-100"
          }`}
        >
          {value}
        </span>
      </div>

      {(trend || footerText) && (
        <div
          className={`flex items-center gap-1.5 text-xs ${
            isGradient ? "text-white/85" : "text-slate-500 dark:text-zinc-400"
          }`}
        >
          {trend && (
            <span
              className={`inline-flex items-center ${
                isGradient
                  ? "text-white font-bold"
                  : trendGood === true
                  ? "text-emerald-600 dark:text-emerald-400 font-semibold"
                  : trendGood === false
                  ? "text-rose-600 dark:text-rose-400 font-bold"
                  : "text-slate-700 dark:text-zinc-300 font-semibold"
              }`}
            >
              {trend}
            </span>
          )}
          {footerText && (
            <span className={isGradient ? "text-white/80" : "text-slate-500 dark:text-zinc-400"}>
              {footerText}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default KpiCard;
