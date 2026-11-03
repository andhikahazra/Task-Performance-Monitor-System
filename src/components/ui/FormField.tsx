import React from "react";

export interface FormFieldProps {
  label?: React.ReactNode;
  htmlFor?: string;
  required?: boolean;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  htmlFor,
  required = false,
  hint,
  error,
  children,
  className = "",
}) => {
  return (
    <div className={`flex flex-col gap-1.5 w-full ${className}`}>
      {label && (
        <label
          htmlFor={htmlFor}
          className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-zinc-300 select-none"
        >
          {label}
          {required && <span className="text-rose-600 dark:text-rose-400 ml-1 font-bold">*</span>}
        </label>
      )}

      {children}

      {error ? (
        <span className="text-xs text-rose-600 dark:text-rose-400 font-medium">
          {error}
        </span>
      ) : hint ? (
        <span className="text-xs text-slate-500 dark:text-zinc-400 font-medium">{hint}</span>
      ) : null}
    </div>
  );
};

export default FormField;
