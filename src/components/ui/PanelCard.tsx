import React from "react";

export interface PanelCardProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  iconTheme?: "blue" | "emerald" | "amber" | "rose" | "purple" | "neutral";
  divider?: boolean;
}

const iconThemeStyles = {
  blue: "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
  emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
  amber: "bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
  rose: "bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400",
  purple: "bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
  neutral: "bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-300",
};

export const PanelCard: React.FC<PanelCardProps> = ({
  title,
  subtitle,
  icon,
  action,
  iconTheme = "blue",
  divider = false,
  children,
  className = "",
  ...props
}) => {
  const hasHeader = title || subtitle || icon || action;

  return (
    <article
      className={`panel-card rounded-xl border border-slate-200 bg-white p-5 shadow-xs transition-colors dark:border-zinc-800 dark:bg-zinc-950 ${className}`}
      {...props}
    >
      {hasHeader && (
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            {icon && (
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${iconThemeStyles[iconTheme]}`}
              >
                {icon}
              </div>
            )}
            <div>
              {title && (
                <h3 className="m-0 text-sm font-semibold text-slate-900 dark:text-zinc-100 tracking-tight">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="m-0 text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}

      {hasHeader && divider && (
        <div className="h-px bg-slate-200 dark:bg-zinc-800 my-4 -mx-5" />
      )}

      <div>{children}</div>
    </article>
  );
};

export default PanelCard;
