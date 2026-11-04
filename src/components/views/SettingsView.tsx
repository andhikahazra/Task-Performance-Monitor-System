"use client";

import React, { useState, useEffect } from "react";
import {
  Settings as SettingsIcon,
  Palette,
  Bell,
  Sliders,
  Building2,
  Save,
  Check,
  Database,
  RefreshCw,
} from "lucide-react";
import { SafeUser } from "@/types/database";
import { Button } from "@/components/ui/Button";
import { PanelCard } from "@/components/ui/PanelCard";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { FormField } from "@/components/ui/FormField";
import { useToast } from "@/components/ui/Toast";

export interface SettingsViewProps {
  user: SafeUser;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ user }) => {
  const { success, error, info } = useToast();

  const [currentTheme, setCurrentTheme] = useState<string>("light");
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Settings State
  const [workspaceName, setWorkspaceName] = useState<string>(
    "Management Monitor Pusat"
  );
  const [orgDepartment, setOrgDepartment] = useState<string>(
    user.department || "Operasional"
  );
  const [orgJobTitle, setOrgJobTitle] = useState<string>(
    user.job_title || "Administrator Sistem"
  );

  // Toggles
  const [reminderDeadline, setReminderDeadline] = useState<boolean>(true);
  const [appNotifications, setAppNotifications] = useState<boolean>(true);
  const [compactMode, setCompactMode] = useState<boolean>(false);
  const [weeklySummary, setWeeklySummary] = useState<boolean>(true);

  // Load existing theme & settings
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem("mm-theme") || "light";
      setCurrentTheme(savedTheme);
      document.documentElement.setAttribute("data-theme", savedTheme);
      document.documentElement.classList.toggle("dark", savedTheme === "midnight");
    } catch {
      // Ignore
    }

    async function loadSettings() {
      try {
        const res = await fetch("/api/settings");
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data?.settings) {
            const s = json.data.settings;
            if (s["workspace_name"]) setWorkspaceName(s["workspace_name"]);
            if (s["reminder_deadline"] !== undefined)
              setReminderDeadline(s["reminder_deadline"] === "true");
            if (s["app_notifications"] !== undefined)
              setAppNotifications(s["app_notifications"] === "true");
            if (s["compact_mode"] !== undefined)
              setCompactMode(s["compact_mode"] === "true");
            if (s["weekly_summary"] !== undefined)
              setWeeklySummary(s["weekly_summary"] === "true");
          }
        }
      } catch (err) {
        console.error("Error loading settings:", err);
      }
    }

    loadSettings();
  }, []);

  // Theme switch change
  const handleThemeChange = (newTheme: string) => {
    setCurrentTheme(newTheme);
    try {
      localStorage.setItem("mm-theme", newTheme);
      document.documentElement.setAttribute("data-theme", newTheme);
      document.documentElement.classList.toggle("dark", newTheme === "midnight");
      success(`Tema aplikasi diubah ke ${newTheme.toUpperCase()}`);
    } catch (e) {
      console.error(e);
    }
  };

  // Save settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (user.role !== "admin") {
      info("Preferensi tampilan berhasil disimpan di peramban Anda.");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        workspace_name: workspaceName,
        reminder_deadline: String(reminderDeadline),
        app_notifications: String(appNotifications),
        compact_mode: String(compactMode),
        weekly_summary: String(weeklySummary),
        department_default: orgDepartment,
      };

      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success) {
        success("Pengaturan workspace berhasil disimpan ke server!");
      } else {
        error(json.message || "Gagal menyimpan pengaturan.");
      }
    } catch (err) {
      console.error(err);
      error("Terjadi kendala jaringan saat menyimpan pengaturan.");
    } finally {
      setIsSaving(false);
    }
  };

  const [isSeeding, setIsSeeding] = useState<boolean>(false);

  const handleRunSeeder = async () => {
    if (
      !confirm(
        "Apakah Anda yakin ingin menjalankan seeder dinamis? Ini akan memperbarui data operasional dan indeks performa tanpa batas statis."
      )
    ) {
      return;
    }

    setIsSeeding(true);
    try {
      const res = await fetch("/api/seed", { method: "POST" });
      const json = await res.json();
      if (res.ok && json.success) {
        success("Seeder dinamis & optimasi database berhasil dijalankan!");
        setTimeout(() => {
          window.location.reload();
        }, 1200);
      } else {
        error(json.message || "Gagal menjalankan seeder.");
      }
    } catch (err) {
      console.error(err);
      error("Kendala jaringan saat menjalankan seeder.");
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="text-[11px] font-bold tracking-wider uppercase text-slate-500 dark:text-zinc-400">
            KONFIGURASI
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-zinc-100 tracking-tight mt-1">
            Pengaturan
          </h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-0.5">
            Konfigurasi dasar workspace, tema visual, dan preferensi notifikasi.
          </p>
        </div>

        <div>
          <Button
            variant="primary"
            onClick={handleSaveSettings}
            isLoading={isSaving}
            leftIcon={<Save className="h-4 w-4" />}
          >
            Simpan Pengaturan
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Visual Preference Card */}
        <PanelCard
          title="Preferensi Tampilan & Tema"
          subtitle="Personalisasi antarmuka pengguna sesuai kenyamanan visual"
          icon={<Palette className="h-4 w-4" />}
          iconTheme="blue"
        >
          <div className="space-y-4">
            <FormField
              label="Tema Warna Aplikasi"
              hint="Perubahan tema langsung diaplikasikan ke antarmuka aplikasi."
            >
              <Select
                value={currentTheme}
                onChange={(e) => handleThemeChange(e.target.value)}
                options={[
                  { label: "Light (Terang Standar)", value: "light" },
                  { label: "Ocean (Biru Laut)", value: "ocean" },
                  { label: "Emerald (Hijau Alam)", value: "emerald" },
                  { label: "Violet (Ungu Elegan)", value: "violet" },
                  { label: "Sunset (Oranye Hangat)", value: "sunset" },
                  { label: "Midnight (Gelap Total)", value: "midnight" },
                ]}
              />
            </FormField>

            {/* Theme preview swatch */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 pt-2">
              {[
                { id: "light", label: "Light", bg: "bg-blue-500" },
                { id: "ocean", label: "Ocean", bg: "bg-blue-700" },
                { id: "emerald", label: "Emerald", bg: "bg-teal-600" },
                { id: "violet", label: "Violet", bg: "bg-purple-600" },
                { id: "sunset", label: "Sunset", bg: "bg-orange-600" },
                { id: "midnight", label: "Midnight", bg: "bg-slate-900 border" },
              ].map((thm) => (
                <button
                  key={thm.id}
                  type="button"
                  onClick={() => handleThemeChange(thm.id)}
                  className={`flex flex-col items-center gap-1.5 p-2 rounded-lg border text-center transition-all cursor-pointer ${
                    currentTheme === thm.id
                      ? "border-blue-500 ring-2 ring-blue-500/30 bg-blue-50/20 dark:bg-zinc-800"
                      : "border-slate-200 dark:border-zinc-800 hover:border-slate-300"
                  }`}
                >
                  <span className={`h-6 w-6 rounded-full ${thm.bg}`} />
                  <span className="text-[11px] font-semibold text-slate-700 dark:text-zinc-300">
                    {thm.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </PanelCard>

        {/* Workspace Preferences & Toggles */}
        <PanelCard
          title="Notifikasi & Operasional"
          subtitle="Atur pengingat otomatis dan mode tampilan data"
          icon={<Bell className="h-4 w-4" />}
          iconTheme="amber"
        >
          <div className="space-y-4">
            {/* Toggle 1 */}
            <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/40">
              <div>
                <span className="text-xs font-bold text-slate-800 dark:text-zinc-200 block">
                  Pengingat Tenggat Waktu (Deadline)
                </span>
                <span className="text-[11px] text-slate-500 dark:text-zinc-400">
                  Kirim pemberitahuan saat pekerjaan mendekati jatuh tempo (H-1).
                </span>
              </div>
              <input
                type="checkbox"
                checked={reminderDeadline}
                onChange={(e) => setReminderDeadline(e.target.checked)}
                className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
            </div>

            {/* Toggle 2 */}
            <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/40">
              <div>
                <span className="text-xs font-bold text-slate-800 dark:text-zinc-200 block">
                  Notifikasi Aplikasi Langsung
                </span>
                <span className="text-[11px] text-slate-500 dark:text-zinc-400">
                  Tampilkan badge dan notifikasi interaktif dalam aplikasi.
                </span>
              </div>
              <input
                type="checkbox"
                checked={appNotifications}
                onChange={(e) => setAppNotifications(e.target.checked)}
                className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
            </div>

            {/* Toggle 3 */}
            <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/40">
              <div>
                <span className="text-xs font-bold text-slate-800 dark:text-zinc-200 block">
                  Mode Tabel Ringkas
                </span>
                <span className="text-[11px] text-slate-500 dark:text-zinc-400">
                  Rapatkan spasi baris tabel untuk menampilkan lebih banyak data.
                </span>
              </div>
              <input
                type="checkbox"
                checked={compactMode}
                onChange={(e) => setCompactMode(e.target.checked)}
                className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
            </div>

            {/* Toggle 4 */}
            <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/40">
              <div>
                <span className="text-xs font-bold text-slate-800 dark:text-zinc-200 block">
                  Ringkasan Kinerja Mingguan
                </span>
                <span className="text-[11px] text-slate-500 dark:text-zinc-400">
                  Aktifkan kompilasi metrik otomatis setiap akhir pekan.
                </span>
              </div>
              <input
                type="checkbox"
                checked={weeklySummary}
                onChange={(e) => setWeeklySummary(e.target.checked)}
                className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
            </div>
          </div>
        </PanelCard>

        {/* Organization Metadata (Admin Only) */}
        {user.role === "admin" && (
          <div className="lg:col-span-2">
            <PanelCard
              title="Informasi Workspace & Organisasi"
              subtitle="Kelola identitas organisasi dan parameter default sistem"
              icon={<Building2 className="h-4 w-4" />}
              iconTheme="emerald"
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <FormField label="Nama Workspace" required>
                  <Input
                    value={workspaceName}
                    onChange={(e) => setWorkspaceName(e.target.value)}
                    placeholder="Contoh: Management Monitor Pusat"
                  />
                </FormField>

                <FormField label="Departemen Induk" required>
                  <Input
                    value={orgDepartment}
                    onChange={(e) => setOrgDepartment(e.target.value)}
                    placeholder="Contoh: Operasional & Teknologi"
                  />
                </FormField>

                <FormField label="Jabatan Administrator" required>
                  <Input
                    value={orgJobTitle}
                    onChange={(e) => setOrgJobTitle(e.target.value)}
                    placeholder="Contoh: Administrator Sistem"
                  />
                </FormField>
              </div>

              <div className="mt-5 flex justify-end">
                <Button
                  variant="primary"
                  onClick={handleSaveSettings}
                  isLoading={isSaving}
                  leftIcon={<Save className="h-4 w-4" />}
                >
                  Simpan Perubahan Organisasi
                </Button>
              </div>
            </PanelCard>
          </div>
        )}

        {/* Database Seeder & Performance Optimization (Admin Only) */}
        {user.role === "admin" && (
          <div className="lg:col-span-2">
            <PanelCard
              title="Database Seeder & Optimasi Performa"
              subtitle="Otomasi pengisian data dinamis tanpa batas statis dan pembuatan indeks query skala tinggi"
              icon={<Database className="h-4 w-4" />}
              iconTheme="amber"
            >
              <div className="space-y-4">
                <p className="text-sm text-slate-600 dark:text-zinc-400">
                  Modul ini secara dinamis memperbarui indeks komposit performa query (<code className="text-xs bg-slate-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded font-mono">idx_tasks_eval</code>, <code className="text-xs bg-slate-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded font-mono">idx_tasks_created</code>, <code className="text-xs bg-slate-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded font-mono">idx_comments_task_created</code>) serta mengisi data operasional, tugas aktif hari ini, tren produktivitas 7 hari, dan riwayat evaluasi berkala secara dinamis relatif terhadap waktu saat ini (<code className="text-xs bg-slate-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded font-mono">NOW()</code>).
                </p>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <div>
                    <div className="text-sm font-bold text-amber-900 dark:text-amber-200">
                      Regenerasi Data Operasional Dinamis
                    </div>
                    <div className="text-xs text-amber-700 dark:text-amber-300/80 mt-0.5">
                      8 Pengguna · 84 Pekerjaan Dinamis · 7 Indeks Komposit · Komentar & Notifikasi
                    </div>
                  </div>

                  <Button
                    variant="primary"
                    onClick={handleRunSeeder}
                    isLoading={isSeeding}
                    leftIcon={<RefreshCw className={`h-4 w-4 ${isSeeding ? "animate-spin" : ""}`} />}
                    className="bg-amber-600 hover:bg-amber-700 text-white shrink-0"
                  >
                    Jalankan Seeder Dinamis
                  </Button>
                </div>
              </div>
            </PanelCard>
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsView;
