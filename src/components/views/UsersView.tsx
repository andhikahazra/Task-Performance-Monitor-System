"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Users as UsersIcon,
  UserPlus,
  Search,
  CheckCircle2,
  XCircle,
  RotateCw,
  Mail,
  Building,
  Briefcase,
  ShieldCheck,
  Shield,
} from "lucide-react";
import { SafeUser } from "@/types/database";
import { Button } from "@/components/ui/Button";
import { StatusPill } from "@/components/ui/StatusPill";
import { PanelCard } from "@/components/ui/PanelCard";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { FormField } from "@/components/ui/FormField";
import { useToast } from "@/components/ui/Toast";

export interface UsersViewProps {
  currentUser: SafeUser;
}

export const UsersView: React.FC<UsersViewProps> = ({ currentUser }) => {
  const { success, error, info } = useToast();
  const [users, setUsers] = useState<SafeUser[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Invite Modal
  const [isInviteOpen, setIsInviteOpen] = useState<boolean>(false);
  const [inviteLoading, setInviteLoading] = useState<boolean>(false);
  const [inviteForm, setInviteForm] = useState({
    full_name: "",
    email: "",
    password: "",
    department: "Operasional",
    job_title: "Staf",
    role: "user" as "admin" | "user",
  });

  // Action loading states
  const [actionId, setActionId] = useState<number | null>(null);

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/users");
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setUsers(json.data || []);
        }
      } else {
        error("Gagal memuat daftar pengguna.");
      }
    } catch (err) {
      console.error(err);
      error("Terjadi kendala jaringan saat memuat pengguna.");
    } finally {
      setIsLoading(false);
    }
  }, [error]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Handle Approve / Reject user
  const handleUpdateStatus = async (
    targetUser: SafeUser,
    newStatus: "active" | "rejected"
  ) => {
    if (newStatus === "rejected") {
      const confirmed = window.confirm(
        `Apakah Anda yakin ingin menolak permohonan akses untuk ${targetUser.full_name}?`
      );
      if (!confirmed) return;
    }

    setActionId(targetUser.id);
    try {
      const res = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: targetUser.id,
          status: newStatus,
        }),
      });

      const json = await res.json();
      if (json.success) {
        success(
          newStatus === "active"
            ? `Pengguna ${targetUser.full_name} berhasil disetujui.`
            : `Pengguna ${targetUser.full_name} telah ditolak.`
        );
        loadUsers();
      } else {
        error(json.message || "Gagal memperbarui status pengguna.");
      }
    } catch (err) {
      console.error(err);
      error("Terjadi kesalahan jaringan.");
    } finally {
      setActionId(null);
    }
  };

  // Handle Add User Submit
  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteForm.full_name.trim() || !inviteForm.email.trim() || !inviteForm.password) {
      error("Harap isi semua kolom wajib.");
      return;
    }

    setInviteLoading(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...inviteForm,
          status: "active",
        }),
      });

      const json = await res.json();
      if (json.success) {
        success("Pengguna baru berhasil ditambahkan!");
        setIsInviteOpen(false);
        setInviteForm({
          full_name: "",
          email: "",
          password: "",
          department: "Operasional",
          job_title: "Staf",
          role: "user",
        });
        loadUsers();
      } else {
        error(json.message || "Gagal menambahkan pengguna.");
      }
    } catch (err) {
      console.error(err);
      error("Terjadi kendala jaringan.");
    } finally {
      setInviteLoading(false);
    }
  };

  // Filter users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (roleFilter !== "all" && u.role !== roleFilter) return false;
      if (statusFilter !== "all" && u.status !== statusFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchName = u.full_name.toLowerCase().includes(q);
        const matchEmail = u.email.toLowerCase().includes(q);
        const matchDept = u.department?.toLowerCase().includes(q);
        const matchTitle = u.job_title?.toLowerCase().includes(q);
        if (!matchName && !matchEmail && !matchDept && !matchTitle) return false;
      }
      return true;
    });
  }, [users, roleFilter, statusFilter, search]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="text-[11px] font-bold tracking-wider uppercase text-slate-500 dark:text-zinc-400">
            ADMINISTRASI
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-zinc-100 tracking-tight mt-1">
            Pengguna
          </h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-0.5">
            Kelola status akses, departemen, dan peran pengguna sistem.
          </p>
        </div>

        <div>
          <Button
            variant="primary"
            onClick={() => setIsInviteOpen(true)}
            leftIcon={<UserPlus className="h-4 w-4" />}
          >
            Tambah Pengguna
          </Button>
        </div>
      </div>

      {/* Main Panel Card */}
      <PanelCard>
        {/* Toolbar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama, email, jabatan..."
            leftAddon={<Search className="h-4 w-4" />}
          />

          <Select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            options={[
              { label: "Semua Peran", value: "all" },
              { label: "Administrator", value: "admin" },
              { label: "Pengguna (User)", value: "user" },
            ]}
          />

          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { label: "Semua Status Akses", value: "all" },
              { label: "Aktif", value: "active" },
              { label: "Menunggu Persetujuan", value: "pending" },
              { label: "Ditolak", value: "rejected" },
            ]}
          />
        </div>

        {/* Users Table */}
        <div className="table-wrap rounded-lg border border-slate-200 dark:border-zinc-800 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 border-b border-slate-200 dark:border-zinc-800">
                <th className="px-3.5 py-3 text-xs uppercase font-bold">Pengguna</th>
                <th className="px-3.5 py-3 text-xs uppercase font-bold">Email</th>
                <th className="px-3.5 py-3 text-xs uppercase font-bold">Jabatan & Departemen</th>
                <th className="px-3.5 py-3 text-xs uppercase font-bold">Peran</th>
                <th className="px-3.5 py-3 text-xs uppercase font-bold">Status Akses</th>
                <th className="px-3.5 py-3 text-xs uppercase font-bold">Aktivitas Terakhir</th>
                <th className="px-3.5 py-3 text-xs uppercase font-bold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-zinc-800">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <RotateCw className="h-4 w-4 animate-spin text-blue-600" />
                      <span>Memuat pengguna...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Tidak ada pengguna yang cocok.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isProcessing = actionId === u.id;
                  const isSelf = u.id === currentUser.id;

                  return (
                    <tr
                      key={u.id}
                      className="hover:bg-blue-50/40 dark:hover:bg-zinc-800/30 transition-colors"
                    >
                      <td className="text-slate-800 dark:text-zinc-200 text-sm py-3 px-3.5 border-b border-slate-100 dark:border-zinc-800/60">
                        <div className="flex items-center gap-2.5">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/40 font-bold text-xs text-blue-800 dark:text-blue-300">
                            {u.avatar_initials ||
                              u.full_name.slice(0, 2).toUpperCase()}
                          </span>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-1.5">
                              {u.full_name}
                              {isSelf && (
                                <span className="rounded bg-slate-100 dark:bg-zinc-800 px-1 py-0.2 text-[9px] font-semibold text-slate-600 dark:text-zinc-400">
                                  Anda
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              Terdaftar:{" "}
                              {new Date(u.created_at).toLocaleDateString("id-ID", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="text-slate-800 dark:text-zinc-200 text-sm py-3 px-3.5 border-b border-slate-100 dark:border-zinc-800/60">
                        {u.email}
                      </td>

                      <td className="text-slate-800 dark:text-zinc-200 text-sm py-3 px-3.5 border-b border-slate-100 dark:border-zinc-800/60">
                        <div className="font-medium text-slate-800 dark:text-zinc-200">
                          {u.job_title || "Staf"}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {u.department || "Operasional"}
                        </div>
                      </td>

                      <td className="text-slate-800 dark:text-zinc-200 text-sm py-3 px-3.5 border-b border-slate-100 dark:border-zinc-800/60">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold ${
                            u.role === "admin"
                              ? "bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300"
                              : "bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300"
                          }`}
                        >
                          {u.role === "admin" ? (
                            <ShieldCheck className="h-3 w-3" />
                          ) : (
                            <Shield className="h-3 w-3" />
                          )}
                          {u.role === "admin" ? "Admin" : "Pengguna"}
                        </span>
                      </td>

                      <td className="text-slate-800 dark:text-zinc-200 text-sm py-3 px-3.5 border-b border-slate-100 dark:border-zinc-800/60">
                        <StatusPill
                          status={
                            u.status === "active"
                              ? "Aktif"
                              : u.status === "pending"
                              ? "Menunggu"
                              : "Terlambat"
                          }
                        >
                          {u.status === "active"
                            ? "Aktif"
                            : u.status === "pending"
                            ? "Menunggu"
                            : "Ditolak"}
                        </StatusPill>
                      </td>

                      <td className="text-slate-800 dark:text-zinc-200 text-sm py-3 px-3.5 border-b border-slate-100 dark:border-zinc-800/60 text-slate-500 dark:text-zinc-400 whitespace-nowrap">
                        {u.last_activity_at
                          ? new Date(u.last_activity_at).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "Belum pernah aktif"}
                      </td>

                      <td className="text-slate-800 dark:text-zinc-200 text-sm py-3 px-3.5 border-b border-slate-100 dark:border-zinc-800/60 text-right whitespace-nowrap">
                        {u.status === "pending" ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              disabled={isProcessing}
                              onClick={() => handleUpdateStatus(u, "active")}
                              className="px-2 py-1 text-xs font-semibold text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded-md transition-colors cursor-pointer active:scale-[0.98]"
                            >
                              Setujui
                            </button>
                            <button
                              type="button"
                              disabled={isProcessing}
                              onClick={() => handleUpdateStatus(u, "rejected")}
                              className="px-2 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-md transition-colors cursor-pointer active:scale-[0.98]"
                            >
                              Tolak
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400">
                            Terverifikasi
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </PanelCard>

      {/* Invite / Add User Modal */}
      <Modal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        title="Tambah Pengguna Baru"
        subtitle="Daftarkan akun pengguna atau administrator ke sistem."
        size="md"
      >
        <form onSubmit={handleInviteSubmit} className="space-y-4">
          <FormField label="Nama Lengkap" required>
            <Input
              required
              placeholder="Contoh: Siti Rahmawati"
              value={inviteForm.full_name}
              onChange={(e) =>
                setInviteForm({ ...inviteForm, full_name: e.target.value })
              }
            />
          </FormField>

          <FormField label="Email Perusahaan" required>
            <Input
              type="email"
              required
              placeholder="siti@perusahaan.com"
              value={inviteForm.email}
              onChange={(e) =>
                setInviteForm({ ...inviteForm, email: e.target.value })
              }
            />
          </FormField>

          <FormField label="Password Awal" required hint="Minimal 6 karakter">
            <Input
              type="password"
              required
              placeholder="••••••••"
              value={inviteForm.password}
              onChange={(e) =>
                setInviteForm({ ...inviteForm, password: e.target.value })
              }
            />
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Departemen" required>
              <Select
                value={inviteForm.department}
                onChange={(e) =>
                  setInviteForm({ ...inviteForm, department: e.target.value })
                }
                options={[
                  "Operasional",
                  "Administrasi",
                  "Teknologi",
                  "Keuangan",
                  "SDM / HR",
                  "Manajemen",
                ]}
              />
            </FormField>

            <FormField label="Jabatan" required>
              <Input
                required
                placeholder="Contoh: Analis Finansial"
                value={inviteForm.job_title}
                onChange={(e) =>
                  setInviteForm({ ...inviteForm, job_title: e.target.value })
                }
              />
            </FormField>
          </div>

          <FormField label="Peran Akses (Role)" required>
            <Select
              value={inviteForm.role}
              onChange={(e) =>
                setInviteForm({
                  ...inviteForm,
                  role: e.target.value as "admin" | "user",
                })
              }
              options={[
                { label: "Pengguna Biasa (User)", value: "user" },
                { label: "Super Admin", value: "admin" },
              ]}
            />
          </FormField>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-zinc-800">
            <Button
              variant="outline"
              type="button"
              onClick={() => setIsInviteOpen(false)}
            >
              Batal
            </Button>
            <Button variant="primary" type="submit" isLoading={inviteLoading}>
              Tambah Pengguna
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default UsersView;
