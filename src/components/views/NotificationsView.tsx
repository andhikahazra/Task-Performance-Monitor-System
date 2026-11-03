"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Bell,
  CheckCheck,
  AlertCircle,
  AlertTriangle,
  Info,
  RotateCw,
  ExternalLink,
  Check,
} from "lucide-react";
import { Notification, SafeUser } from "@/types/database";
import { Button } from "@/components/ui/Button";
import { PanelCard } from "@/components/ui/PanelCard";
import { Select } from "@/components/ui/Select";
import { useToast } from "@/components/ui/Toast";

export interface NotificationsViewProps {
  user: SafeUser;
  onOpenTaskDetail?: (taskId: number) => void;
  onRefreshNotifications?: () => void;
}

export const NotificationsView: React.FC<NotificationsViewProps> = ({
  user,
  onOpenTaskDetail,
  onRefreshNotifications,
}) => {
  const { success, error, info } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [filterLevel, setFilterLevel] = useState<string>("all");
  const [isMarkingAll, setIsMarkingAll] = useState<boolean>(false);

  const loadNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/notifications?filter=${filterLevel}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setNotifications(json.data.notifications || []);
          setUnreadCount(json.data.unreadCount || 0);
        }
      } else {
        error("Gagal memuat notifikasi.");
      }
    } catch (err) {
      console.error(err);
      error("Terjadi kendala jaringan saat memuat notifikasi.");
    } finally {
      setIsLoading(false);
    }
  }, [filterLevel, error]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const handleMarkAllRead = async () => {
    setIsMarkingAll(true);
    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mark_all_read: true }),
      });

      const json = await res.json();
      if (json.success) {
        success("Semua notifikasi ditandai telah dibaca.");
        loadNotifications();
        if (onRefreshNotifications) onRefreshNotifications();
      } else {
        error(json.message || "Gagal menandai notifikasi.");
      }
    } catch (err) {
      console.error(err);
      error("Terjadi kendala jaringan.");
    } finally {
      setIsMarkingAll(false);
    }
  };

  const handleMarkRead = async (id: number) => {
    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      const json = await res.json();
      if (json.success) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
        if (onRefreshNotifications) onRefreshNotifications();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="text-[11px] font-bold tracking-wider uppercase text-slate-500 dark:text-zinc-400">
            PUSAT INFORMASI
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-zinc-100 tracking-tight mt-1">
            Notifikasi
          </h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-0.5">
            Semua aktivitas, pengingat deadline, dan pemberitahuan terkait pekerjaan.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={handleMarkAllRead}
            isLoading={isMarkingAll}
            leftIcon={<CheckCheck className="h-4 w-4" />}
          >
            Tandai semua dibaca
          </Button>
        </div>
      </div>

      {/* Main Panel */}
      <PanelCard>
        {/* Filter Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 pb-3 border-b border-slate-200 dark:border-zinc-800">
          <div className="w-56">
            <Select
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value)}
              options={[
                { label: "Semua Notifikasi", value: "all" },
                { label: "Belum Dibaca", value: "unread" },
                { label: "Kritis", value: "Kritis" },
                { label: "Penting", value: "Penting" },
                { label: "Informasi", value: "Informasi" },
              ]}
            />
          </div>

          <div className="text-xs text-slate-500 dark:text-zinc-400">
            {unreadCount > 0 ? (
              <span className="font-semibold text-rose-600 dark:text-rose-400">
                {unreadCount} notifikasi belum dibaca
              </span>
            ) : (
              <span>Semua notifikasi telah dibaca</span>
            )}
          </div>
        </div>

        {/* Notifications List */}
        {isLoading ? (
          <div className="py-12 text-center text-slate-400 flex items-center justify-center gap-2 text-xs">
            <RotateCw className="h-4 w-4 animate-spin text-blue-600" />
            <span>Memuat notifikasi...</span>
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-12 text-center text-slate-400 dark:text-zinc-500 text-xs">
            Tidak ada notifikasi pada filter ini.
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((item) => {
              const isUnread = !item.is_read;

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    if (isUnread) handleMarkRead(item.id);
                  }}
                  className={`flex items-start justify-between gap-3 rounded-xl border p-3.5 transition-colors cursor-pointer ${
                    isUnread
                      ? "border-blue-200 bg-blue-50/40 dark:border-blue-900/40 dark:bg-blue-950/20"
                      : "border-slate-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 opacity-90"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                        item.level === "Kritis"
                          ? "bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400"
                          : item.level === "Penting"
                          ? "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400"
                          : "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400"
                      }`}
                    >
                      {item.level === "Kritis" ? (
                        <AlertCircle className="h-4 w-4" />
                      ) : item.level === "Penting" ? (
                        <AlertTriangle className="h-4 w-4" />
                      ) : (
                        <Info className="h-4 w-4" />
                      )}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4
                          className={`text-xs text-slate-900 dark:text-zinc-100 ${
                            isUnread ? "font-bold" : "font-medium"
                          }`}
                        >
                          {item.title}
                        </h4>
                        {isUnread && (
                          <span className="h-2 w-2 rounded-full bg-blue-600 shrink-0" />
                        )}
                      </div>

                      <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed">
                        {item.body}
                      </p>

                      <div className="flex items-center gap-3 text-[10px] text-slate-400 font-mono pt-1">
                        <span>
                          {new Date(item.created_at).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        {item.task_id && onOpenTaskDetail && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (isUnread) {
                                handleMarkRead(item.id);
                              }
                              onOpenTaskDetail(item.task_id!);
                            }}
                            className="font-sans font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                          >
                            Buka Pekerjaan <ExternalLink className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {isUnread && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkRead(item.id);
                      }}
                      className="text-[11px] font-medium text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 p-1 shrink-0 cursor-pointer"
                      title="Tandai dibaca"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </PanelCard>
    </div>
  );
};

export default NotificationsView;
