import React, { forwardRef } from "react";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "destructive"
  | "danger"
  | "outline"
  | "small";

export type ButtonSize = "sm" | "md" | "lg" | "icon";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className = "",
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      disabled,
      type = "button",
      ...props
    },
    ref
  ) => {
    // If variant is "small", map to secondary sm unless specified
    const actualVariant = variant === "small" ? "secondary" : variant;
    const actualSize = variant === "small" && size === "md" ? "sm" : size;

    const baseStyles =
      "inline-flex items-center justify-center font-medium transition-all duration-150 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 select-none active:scale-[0.98]";

    const variantStyles: Record<string, string> = {
      primary:
        "bg-[var(--color-primary)] text-white hover:opacity-95 shadow-xs border border-transparent focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/30",
      secondary:
        "bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-200 dark:bg-zinc-800 dark:text-zinc-200 dark:border-zinc-700 dark:hover:bg-zinc-700",
      outline:
        "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900",
      ghost:
        "bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-zinc-400 dark:hover:bg-zinc-800/70 dark:hover:text-zinc-200 border border-transparent",
      destructive:
        "bg-rose-600 text-white hover:bg-rose-700 shadow-xs border border-transparent focus-visible:ring-2 focus-visible:ring-rose-500/30 dark:bg-rose-700 dark:hover:bg-rose-800",
      danger:
        "bg-rose-600 text-white hover:bg-rose-700 shadow-xs border border-transparent focus-visible:ring-2 focus-visible:ring-rose-500/30 dark:bg-rose-700 dark:hover:bg-rose-800",
    };

    const sizeStyles: Record<ButtonSize, string> = {
      sm: "px-2.5 py-1.5 text-xs rounded-md gap-1.5",
      md: "px-3.5 py-2 text-sm rounded-lg gap-2",
      lg: "px-4 py-2.5 text-base rounded-lg gap-2.5",
      icon: "p-2 rounded-lg aspect-square",
    };

    const currentVariant = variantStyles[actualVariant] || variantStyles.primary;
    const currentSize = sizeStyles[actualSize] || sizeStyles.md;

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        className={`${baseStyles} ${currentVariant} ${currentSize} ${className}`}
        {...props}
      >
        {isLoading && (
          <svg
            className="animate-spin -ml-0.5 mr-1.5 h-3.5 w-3.5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {!isLoading && leftIcon && (
          <span className="shrink-0 inline-flex items-center">{leftIcon}</span>
        )}
        <span>{children}</span>
        {!isLoading && rightIcon && (
          <span className="shrink-0 inline-flex items-center">{rightIcon}</span>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";
