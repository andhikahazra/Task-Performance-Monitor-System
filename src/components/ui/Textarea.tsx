import React, { forwardRef } from "react";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  isError?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = "", isError = false, disabled, ...props }, ref) => {
    const errorStyles = isError
      ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500/20 dark:border-rose-600"
      : "focus:border-[var(--color-primary)] focus:ring-[var(--color-primary)]/15";

    return (
      <textarea
        ref={ref}
        disabled={disabled}
        className={`field min-h-[90px] w-full resize-y rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500 ${errorStyles} ${className}`}
        {...props}
      />
    );
  }
);

Textarea.displayName = "Textarea";
export default Textarea;
