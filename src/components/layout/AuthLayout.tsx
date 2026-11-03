"use client";

import React, { useState, useEffect } from "react";
import { Check, Palette } from "lucide-react";

export interface AuthLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  footerNote?: React.ReactNode;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  title = "Selamat datang kembali",
  subtitle = "Masuk untuk melanjutkan pekerjaan Anda.",
  footerNote,
}) => {
  const [activeTheme, setActiveTheme] = useState<string>("light");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("mm-theme") || "light";
      setActiveTheme(saved);
      document.documentElement.setAttribute("data-theme", saved);
      document.documentElement.classList.toggle("dark", saved === "midnight");
    } catch {}
  }, []);

  const handleThemeChange = (newTheme: string) => {
    setActiveTheme(newTheme);
    try {
      localStorage.setItem("mm-theme", newTheme);
      document.documentElement.setAttribute("data-theme", newTheme);
      document.documentElement.classList.toggle("dark", newTheme === "midnight");
    } catch {}
  };

  const highlights = [
    "Pantau pekerjaan dan tenggat waktu",
    "Simpan diskusi dan bukti pekerjaan",
    "Lihat laporan dan evaluasi secara terstruktur",
  ];

  return (
    <div className="grid min-h-screen w-full lg:grid-cols-[1fr_460px] bg-[var(--color-surface,#f8fafc)] text-[var(--color-ink,#0f172a)]">
      {/* Left Hero Panel (Desktop) */}
      <section className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 p-12 xl:p-16 text-white shadow-xl">
        {/* Background Decorative Rings */}
        <div
          className="pointer-events-none absolute -right-28 -bottom-28 h-96 w-96 rounded-full border border-white/10 shadow-[0_0_0_40px_rgba(255,255,255,0.03),0_0_0_90px_rgba(255,255,255,0.02)]"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -left-20 -top-20 h-80 w-80 rounded-full bg-white/5 blur-3xl"
          aria-hidden="true"
        />

        {/* Top Brand Tag */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 text-lg font-extrabold text-white backdrop-blur-md border border-white/20 shadow-md">
            M
          </div>
          <div>
            <h2
              style={{ color: "#ffffff" }}
              className="text-base font-bold tracking-tight !text-white leading-tight"
            >
              Management Monitor
            </h2>
            <p className="text-xs text-blue-100/90 font-medium">Work. Track. Improve.</p>
          </div>
        </div>

        {/* Hero Copy */}
        <div className="relative z-10 max-w-lg space-y-6">
          <div className="inline-block rounded-full bg-white/15 px-3.5 py-1 text-xs font-semibold tracking-wider uppercase text-white border border-white/25 shadow-2xs">
            Ruang kerja yang lebih terarah
          </div>
          <h1
            style={{ color: "#ffffff" }}
            className="text-4xl xl:text-5xl font-black tracking-tight leading-[1.15] !text-white"
          >
            Semua pekerjaan.
            <br />
            Lebih jelas.
          </h1>
          <p className="text-base text-blue-100 font-normal leading-relaxed max-w-md">
            Kelola tugas, pantau tenggat, dan pahami progres tim tanpa
            kehilangan konteks pekerjaan.
          </p>

          <div className="space-y-3 pt-3">
            {highlights.map((item) => (
              <div key={item} className="flex items-center gap-3 text-sm text-white/95 font-medium">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-400/25 text-emerald-300 border border-emerald-400/40">
                  <Check className="h-3.5 w-3.5" />
                </span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Note */}
        <div className="relative z-10 text-xs text-blue-100/80">
          Management Monitor &middot; Solusi tata kelola pekerjaan terpadu
        </div>
      </section>

      {/* Right Form Viewport */}
      <section className="relative flex flex-col items-center justify-center p-6 sm:p-10 lg:p-10 min-h-screen">
        {/* Top-right theme selector */}
        <div className="absolute top-4 right-4 sm:top-6 sm:right-6 flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/80 px-2.5 py-1 text-xs backdrop-blur-xs dark:border-zinc-800 dark:bg-zinc-900/80 shadow-2xs">
          <Palette className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
          <select
            value={activeTheme}
            onChange={(e) => handleThemeChange(e.target.value)}
            className="bg-transparent text-xs font-semibold text-slate-700 dark:text-zinc-200 outline-none cursor-pointer pr-1"
          >
            <option value="light">Light</option>
            <option value="ocean">Ocean</option>
            <option value="emerald">Emerald</option>
            <option value="violet">Violet</option>
            <option value="sunset">Sunset</option>
            <option value="midnight">Midnight</option>
          </select>
        </div>

        <div className="w-full max-w-[420px] rounded-2xl border border-slate-200/90 bg-white p-7 sm:p-9 shadow-xs dark:border-zinc-800 dark:bg-zinc-900/90 space-y-6">
          {/* Mobile Brand Header */}
          <div className="flex lg:hidden flex-col items-center text-center space-y-2 mb-2">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-lg font-extrabold text-white shadow-md shadow-blue-600/20">
              M
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-zinc-100">
              Management Monitor
            </h2>
            <p className="text-xs text-slate-600 dark:text-zinc-400 font-medium">
              Semua pekerjaan. Lebih jelas.
            </p>
          </div>

          {/* Form Header */}
          <div className="space-y-1.5 text-center lg:text-left">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">
              {title}
            </h2>
            {subtitle && (
              <p className="text-sm text-slate-600 dark:text-zinc-400 font-normal leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>

          {/* Form Body Slot */}
          <div className="w-full">{children}</div>

          {/* Optional Footer */}
          {footerNote && (
            <div className="text-center text-xs text-slate-500 dark:text-zinc-400 pt-3 border-t border-slate-100 dark:border-zinc-800">
              {footerNote}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default AuthLayout;
