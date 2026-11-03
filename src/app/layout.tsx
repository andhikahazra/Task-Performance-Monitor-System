import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Management Monitor",
  description:
    "Ruang kerja yang lebih terarah — Kelola tugas, pantau tenggat, dan pahami progres tim tanpa kehilangan konteks pekerjaan.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" data-theme="light" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var t = localStorage.getItem('mm-theme') || 'light';
                document.documentElement.setAttribute('data-theme', t);
                if (t === 'midnight') {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch(e) {}
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-[var(--color-surface,#f8fafc)] text-[var(--color-ink,#0f172a)] antialiased selection:bg-blue-100 selection:text-blue-900">
        {children}
      </body>
    </html>
  );
}
