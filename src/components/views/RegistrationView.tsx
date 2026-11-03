"use client";

import React, { useState } from "react";
import {
  UserPlus,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  Info,
  Eye,
  EyeOff,
  Send,
} from "lucide-react";
import { SafeUser } from "@/types/database";
import { Button } from "@/components/ui/Button";
import { PanelCard } from "@/components/ui/PanelCard";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { FormField } from "@/components/ui/FormField";
import { StatusPill } from "@/components/ui/StatusPill";
import { useToast } from "@/components/ui/Toast";

export interface RegistrationViewProps {
  user?: SafeUser;
}

export const RegistrationView: React.FC<RegistrationViewProps> = ({ user }) => {
  const { success, error, info } = useToast();

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    confirm_password: "",
    department: "Operasional",
    job_title: "Staf",
    consent: false,
  });

  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.consent) {
      error("Harap setujui pernyataan konfirmasi terlebih dahulu.");
      return;
    }

    if (form.password.length < 6) {
      error("Password minimal 6 karakter.");
      return;
    }

    if (form.password !== form.confirm_password) {
      error("Konfirmasi password tidak cocok.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: form.full_name,
          email: form.email,
          password: form.password,
          department: form.department,
          job_title: form.job_title,
        }),
      });

      const json = await res.json();
      if (json.success) {
        success(
          "Pendaftaran berhasil dikirim! Akun Anda kini menunggu persetujuan Super Admin."
        );
        setForm({
          full_name: "",
          email: "",
          password: "",
          confirm_password: "",
          department: "Operasional",
          job_title: "Staf",
          consent: false,
        });
      } else {
        error(json.message || "Pendaftaran gagal.");
      }
    } catch (err) {
      console.error(err);
      error("Terjadi kendala jaringan saat mengirim pendaftaran.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="text-[11px] font-bold tracking-wider uppercase text-slate-500 dark:text-zinc-400">
            AKSES PENGGUNA
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-zinc-100 tracking-tight mt-1">
            Pendaftaran Akun
          </h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-0.5">
            Formulir calon pengguna Management Monitor. Akun baru menunggu
            persetujuan Super Admin.
          </p>
        </div>

        <div>
          <StatusPill status="Pending">Menunggu Persetujuan</StatusPill>
        </div>
      </div>

      {/* Notice Banner */}
      <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50/70 p-3.5 text-xs text-blue-900 dark:border-blue-900/40 dark:bg-blue-950/20 dark:text-blue-300">
        <Info className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400 mt-0.5" />
        <div>
          <strong>Alur Pendaftaran:</strong> Calon pengguna mengisi data diri →
          permintaan masuk ke daftar tindakan Super Admin → akun berstatus
          nonaktif sampai diverifikasi dan disetujui.
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Card (2 cols) */}
        <div className="lg:col-span-2">
          <PanelCard
            title="Informasi Pendaftar"
            subtitle="Gunakan alamat email resmi untuk pendaftaran akun"
            icon={<UserPlus className="h-4 w-4" />}
            iconTheme="blue"
          >
            <form onSubmit={handleSubmit} className="space-y-4">
              <FormField label="Nama Lengkap" required>
                <Input
                  required
                  placeholder="Contoh: Raden Mas Danang"
                  value={form.full_name}
                  onChange={(e) =>
                    setForm({ ...form, full_name: e.target.value })
                  }
                />
              </FormField>

              <FormField
                label="Alamat Email"
                required
                hint="Contoh: nama@perusahaan.com atau akun Gmail Anda"
              >
                <Input
                  type="email"
                  required
                  placeholder="nama@perusahaan.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </FormField>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Password" required hint="Minimal 6 karakter">
                  <Input
                    type={showPass ? "text" : "password"}
                    required
                    placeholder="Minimal 6 karakter"
                    value={form.password}
                    onChange={(e) =>
                      setForm({ ...form, password: e.target.value })
                    }
                    rightAddon={
                      <button
                        type="button"
                        onClick={() => setShowPass(!showPass)}
                        className="cursor-pointer text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300"
                      >
                        {showPass ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    }
                  />
                </FormField>

                <FormField label="Konfirmasi Password" required>
                  <Input
                    type={showConfirm ? "text" : "password"}
                    required
                    placeholder="Ulangi password"
                    value={form.confirm_password}
                    onChange={(e) =>
                      setForm({ ...form, confirm_password: e.target.value })
                    }
                    rightAddon={
                      <button
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                        className="cursor-pointer text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300"
                      >
                        {showConfirm ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    }
                  />
                </FormField>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Departemen" required>
                  <Select
                    value={form.department}
                    onChange={(e) =>
                      setForm({ ...form, department: e.target.value })
                    }
                    options={[
                      "Operasional",
                      "Administrasi",
                      "Proyek",
                      "Keuangan",
                      "Teknologi",
                      "SDM / HR",
                    ]}
                  />
                </FormField>

                <FormField label="Jabatan" required>
                  <Select
                    value={form.job_title}
                    onChange={(e) =>
                      setForm({ ...form, job_title: e.target.value })
                    }
                    options={["Staf", "Koordinator", "Spesialis", "Manajer"]}
                  />
                </FormField>
              </div>

              <div className="pt-2">
                <label className="flex items-start gap-2.5 text-xs text-slate-600 dark:text-zinc-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    required
                    checked={form.consent}
                    onChange={(e) =>
                      setForm({ ...form, consent: e.target.checked })
                    }
                    className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500 mt-0.5"
                  />
                  <span>
                    Saya memastikan informasi yang saya masukkan benar dan
                    memahami bahwa akses baru aktif setelah disetujui Super Admin.
                  </span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-zinc-800">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() =>
                    setForm({
                      full_name: "",
                      email: "",
                      password: "",
                      confirm_password: "",
                      department: "Operasional",
                      job_title: "Staf",
                      consent: false,
                    })
                  }
                >
                  Kosongkan
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                  isLoading={isLoading}
                  leftIcon={<Send className="h-4 w-4" />}
                >
                  Kirim Pendaftaran
                </Button>
              </div>
            </form>
          </PanelCard>
        </div>

        {/* Workflow Info (1 col) */}
        <div className="space-y-6">
          <PanelCard
            title="Tahapan Proses Pendaftaran"
            subtitle="Setelah formulir dikirimkan"
            icon={<ShieldCheck className="h-4 w-4" />}
            iconTheme="emerald"
          >
            <div className="space-y-4">
              {/* Step 1 */}
              <div className="flex items-start justify-between gap-3 p-3 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/40">
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-zinc-100">
                    1. Pemeriksaan Data
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                    Super Admin memeriksa identitas dan divisi pemohon.
                  </p>
                </div>
                <StatusPill status="Pending">Menunggu</StatusPill>
              </div>

              {/* Step 2 */}
              <div className="flex items-start justify-between gap-3 p-3 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/40">
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-zinc-100">
                    2. Persetujuan Akun
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                    Akun belum dapat digunakan sebelum disetujui.
                  </p>
                </div>
                <StatusPill status="Belum Mulai">Belum</StatusPill>
              </div>

              {/* Step 3 */}
              <div className="flex items-start justify-between gap-3 p-3 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/40">
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-zinc-100">
                    3. Aktivasi Akses
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                    Setelah disetujui, pengguna dapat masuk ke workspace.
                  </p>
                </div>
                <span className="text-[11px] font-semibold text-slate-400">
                  Berikutnya
                </span>
              </div>
            </div>

            <div className="mt-5 rounded-lg bg-slate-100 dark:bg-zinc-900 p-3 text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed border border-slate-200 dark:border-zinc-800">
              <strong>Standar Keamanan:</strong> Kata sandi Anda dienkripsi secara
              satu arah menggunakan algoritma bcrypt yang aman. Super Admin tidak
              dapat melihat kata sandi asli Anda.
            </div>
          </PanelCard>
        </div>
      </div>
    </div>
  );
};

export default RegistrationView;
