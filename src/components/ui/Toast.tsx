"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from "lucide-react";

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastItem {
  id: string;
  type?: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

interface ToastContextType {
  toast: (item: Omit<ToastItem, "id"> | string) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (item: Omit<ToastItem, "id"> | string) => {
      const id = Math.random().toString(36).substring(2, 9);
      const toastItem: ToastItem =
        typeof item === "string"
          ? { id, message: item, type: "info", duration: 5000 }
          : { id, duration: 5000, type: "info", ...item };

      setToasts((prev) => [...prev, toastItem]);

      const duration = toastItem.duration ?? 5000;
      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const success = useCallback(
    (message: string, title?: string) =>
      addToast({ type: "success", message, title }),
    [addToast]
  );

  const error = useCallback(
    (message: string, title?: string) =>
      addToast({ type: "error", message, title }),
    [addToast]
  );

  const info = useCallback(
    (message: string, title?: string) =>
      addToast({ type: "info", message, title }),
    [addToast]
  );

  const warning = useCallback(
    (message: string, title?: string) =>
      addToast({ type: "warning", message, title }),
    [addToast]
  );

  return (
    <ToastContext.Provider value={{ toast: addToast, success, error, info, warning }}>
      {children}
      {/* Toast container */}
      <div
        aria-live="polite"
        className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
      >
        {toasts.map((t) => (
          <ToastCard key={t.id} toast={t} onDismiss={() => removeToast(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

const toastTypeStyles: Record<
  ToastType,
  {
    border: string;
    bg: string;
    text: string;
    icon: React.ReactNode;
  }
> = {
  success: {
    border: "border-emerald-200 dark:border-emerald-800/40",
    bg: "bg-emerald-50 dark:bg-emerald-950/90",
    text: "text-emerald-800 dark:text-emerald-200",
    icon: <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />,
  },
  error: {
    border: "border-rose-200 dark:border-rose-800/40",
    bg: "bg-rose-50 dark:bg-rose-950/90",
    text: "text-rose-800 dark:text-rose-200",
    icon: <AlertCircle className="h-4 w-4 text-rose-600 dark:text-rose-400" />,
  },
  warning: {
    border: "border-amber-200 dark:border-amber-800/40",
    bg: "bg-amber-50 dark:bg-amber-950/90",
    text: "text-amber-800 dark:text-amber-200",
    icon: <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />,
  },
  info: {
    border: "border-blue-200 dark:border-blue-800/40",
    bg: "bg-blue-50 dark:bg-blue-950/90",
    text: "text-blue-800 dark:text-blue-200",
    icon: <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />,
  },
};

export const ToastCard: React.FC<{
  toast: ToastItem;
  onDismiss: () => void;
}> = ({ toast, onDismiss }) => {
  const type = toast.type || "info";
  const style = toastTypeStyles[type];

  return (
    <div
      role="status"
      className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border shadow-lg backdrop-blur-md transition-all animate-in slide-in-from-bottom-3 duration-200 ${style.bg} ${style.border} ${style.text}`}
    >
      <div className="shrink-0 mt-0.5">{style.icon}</div>
      <div className="flex-1 text-xs">
        {toast.title && <p className="font-semibold">{toast.title}</p>}
        <p className={toast.title ? "mt-0.5 opacity-90" : "font-medium"}>
          {toast.message}
        </p>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="shrink-0 p-1 rounded-md opacity-60 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10 transition-opacity active:scale-[0.98]"
        aria-label="Tutup pemberitahuan"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
};

export default ToastProvider;
