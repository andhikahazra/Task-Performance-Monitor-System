import React, { forwardRef } from "react";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  leftAddon?: React.ReactNode;
  rightAddon?: React.ReactNode;
  isError?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className = "",
      leftAddon,
      rightAddon,
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
        {leftAddon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center pointer-events-none text-slate-500 dark:text-zinc-400 text-sm select-none z-10">
            {leftAddon}
          </div>
        )}
        <input
          ref={ref}
          disabled={disabled}
          style={{
            paddingLeft: leftAddon ? "2.75rem" : undefined,
            paddingRight: rightAddon ? "2.75rem" : undefined,
            ...style,
          }}
          className={`field w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500 ${
            leftAddon ? "!pl-11" : ""
          } ${rightAddon ? "!pr-11" : ""} ${errorStyles} ${className}`}
          {...props}
        />
        {rightAddon && (
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200 text-sm z-10">
            {rightAddon}
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
export default Input;
