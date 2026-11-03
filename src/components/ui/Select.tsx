import React, { forwardRef } from "react";
import { ChevronDown } from "lucide-react";

export interface SelectOption {
  label: string;
  value: string | number;
}

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options?: (SelectOption | string)[];
  isError?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className = "",
      children,
      options,
      isError = false,
      disabled,
      style,
      ...props
    },
    ref
  ) => {
    const errorStyles = isError
      ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500/20 dark:border-rose-600"
      : "focus:border-[var(--color-primary)] focus:ring-[var(--color-primary)]/15";

    return (
      <div className="relative flex items-center w-full">
        <select
          ref={ref}
          disabled={disabled}
          style={{ paddingRight: "2.5rem", ...style }}
          className={`field w-full appearance-none rounded-lg border border-slate-200 bg-white px-3.5 py-2 !pr-10 text-sm text-slate-900 outline-none transition-all dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 ${errorStyles} ${className}`}
          {...props}
        >
          {options
            ? options.map((opt) => {
                const label = typeof opt === "string" ? opt : opt.label;
                const val = typeof opt === "string" ? opt : opt.value;
                return (
                  <option key={String(val)} value={val}>
                    {label}
                  </option>
                );
              })
            : children}
        </select>
        <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500">
          <ChevronDown className="h-4 w-4" />
        </div>
      </div>
    );
  }
);

Select.displayName = "Select";
export default Select;
