"use client";

import React, { useState } from "react";
import { KeyRound, Eye, EyeOff, ShieldCheck, Lock } from "lucide-react";
import { SafeUser } from "@/types/database";
import { Button } from "@/components/ui/Button";
import { PanelCard } from "@/components/ui/PanelCard";
import { Input } from "@/components/ui/Input";
import { FormField } from "@/components/ui/FormField";
import { useToast } from "@/components/ui/Toast";

export interface ChangePasswordViewProps {
  user: SafeUser;
}

export const ChangePasswordView: React.FC<ChangePasswordViewProps> = ({
  user,
}) => {
  const { success, error } = useToast();

  const [currentPassword, setCurrentPassword] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");

  const [showCurrent, setShowCurrent] = useState<boolean>(false);
  const [showNew, setShowNew] = useState<boolean>(false);
  const [showConfirm, setShowConfirm] = useState<boolean>(false);

  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword) {
      error("Password saat ini wajib diisi.");
      return;
    }

    if (newPassword.length < 6) {
      error("Password baru minimal harus terdiri dari 6 karakter.");
      return;
    }

    if (newPassword !== confirmPassword) {
      error("Konfirmasi password baru tidak cocok.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
          confirm_password: confirmPassword,
        }),
      });

      const json = await res.json();
      if (json.success) {
        success("Password Anda berhasil diperbarui!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        error(json.message || "Gagal mengubah password.");
      }
    } catch (err) {
      console.error(err);
      error("Terjadi kendala jaringan saat memperbarui password.");
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
            KEAMANAN AKUN
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-zinc-100 tracking-tight mt-1">
            Ganti Password
          </h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-0.5">
            Perbarui kata sandi akun Anda secara berkala untuk menjaga keamanan.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-4xl">
        {/* Form Card (2 cols) */}
        <div className="lg:col-span-2">
          <PanelCard
            title="Perbarui Password"
            subtitle="Masukkan password saat ini lalu tentukan password baru yang aman."
            icon={<KeyRound className="h-4 w-4" />}
            iconTheme="blue"
          >
            <form onSubmit={handleSubmit} className="space-y-4">
              <FormField label="Password Saat Ini" required>
                <Input
                  type={showCurrent ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  rightAddon={
                    <button
                      type="button"
                      onClick={() => setShowCurrent(!showCurrent)}
                      className="cursor-pointer text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300"
                    >
                      {showCurrent ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  }
                />
              </FormField>

              <FormField
                label="Password Baru"
                required
                hint="Gunakan kombinasi minimal 6 karakter."
              >
                <Input
                  type={showNew ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  rightAddon={
                    <button
                      type="button"
                      onClick={() => setShowNew(!showNew)}
                      className="cursor-pointer text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300"
                    >
                      {showNew ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  }
                />
              </FormField>

              <FormField label="Konfirmasi Password Baru" required>
                <Input
                  type={showConfirm ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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

              <div className="pt-3 flex justify-end">
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={isLoading}
                  leftIcon={<Lock className="h-4 w-4" />}
                >
                  Simpan Password Baru
                </Button>
              </div>
            </form>
          </PanelCard>
        </div>

        {/* Security Checklist Info (1 col) */}
        <div>
          <PanelCard
            title="Panduan Keamanan"
            subtitle="Kriteria password yang kuat dan aman"
            icon={<ShieldCheck className="h-4 w-4" />}
            iconTheme="emerald"
          >
            <ul className="space-y-3 text-xs text-slate-600 dark:text-zinc-400">
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold">✓</span>
                <span>Minimal terdiri dari 6 karakter (disarankan 8+ karakter).</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold">✓</span>
                <span>Gunakan campuran huruf besar, huruf kecil, dan angka.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold">✓</span>
                <span>Hindari menggunakan nama lengkap, tanggal lahir, atau kata umum.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold">✓</span>
                <span>Jangan membagikan kata sandi akun Anda kepada siapapun.</span>
              </li>
            </ul>
          </PanelCard>
        </div>
      </div>
    </div>
  );
};

export default ChangePasswordView;
