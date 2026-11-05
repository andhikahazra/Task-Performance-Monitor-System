# Daftar Akun Pengguna Awal (Seed Users)
**Management Monitor ERP HRIS KPI**

Dokumen ini memuat daftar akun bawaan (*seed users*) yang dihasilkan secara otomatis oleh sistem seeder (`src/lib/seeder.ts`) untuk keperluan pengujian fungsionalitas, otentikasi peran, tata kelola departemen, evaluasi kinerja, dan alur persetujuan.

---

## 🔑 Kredensial Cepat untuk Pengujian (Quick Access)

| Peruntukan | Email | Password | Peran (*Role*) | Status Akses |
|---|---|---|---|---|
| **Super Admin (Utama)** | `admin@demo.com` | `Admin123` | `admin` (Administrator) | `active` (Aktif) |
| **Pegawai / User (Demo)** | `user@demo.com` | `User123` | `user` (Koordinator) | `active` (Aktif) |
| **Akun Pending (Uji Approval)** | `hendra@example.com` | `User123` | `user` (Manajer Proyek) | `pending` (Menunggu) |

> **Catatan Password:** Password untuk seluruh akun pengguna standar adalah **`User123`**, sedangkan password untuk Super Admin adalah **`Admin123`**.

---

## 👥 Rincian Seluruh Akun Pengguna (*Seed Users*)

Berikut adalah data lengkap 8 akun pengguna yang telah terdaftar dalam database:

| ID | Nama Lengkap | Inisial | Email | Password | Peran | Departemen | Jabatan | Status |
|:--:|---|:--:|---|---|:--:|---|---|:--:|
| **1** | **Super Admin** | `SA` | `admin@demo.com` | `Admin123` | `admin` | Administrasi | Administrator sistem | `active` |
| **2** | **Aditya Pratama** | `AP` | `user@demo.com` | `User123` | `user` | Operasional | Koordinator | `active` |
| **3** | **Nadia Putri** | `NP` | `nadia@example.com` | `User123` | `user` | Administrasi | Spesialis Administrasi | `active` |
| **4** | **Rizky Saputra** | `RS` | `rizky@example.com` | `User123` | `user` | Proyek | Staf Proyek | `active` |
| **5** | **Sarah Amelia** | `SA` | `sarah@example.com` | `User123` | `user` | Operasional | Spesialis Operasional | `active` |
| **6** | **Budi Santoso** | `BS` | `budi@example.com` | `User123` | `user` | TI | Lead Developer | `active` |
| **7** | **Dewi Lestari** | `DL` | `dewi@example.com` | `User123` | `user` | Keuangan | Staf Keuangan | `active` |
| **8** | **Hendra Wijaya** | `HW` | `hendra@example.com` | `User123` | `user` | Proyek | Manajer Proyek | `pending` |

---

## 🛡️ Hak Akses Berdasarkan Peran (*Role Matrix*)

### 1. Super Admin (`admin`)
- **Dashboard Eksekutif:** Memantau metrik seluruh tugas lintas departemen, grafik tren, dan statistik pengguna aktif.
- **Manajemen Pekerjaan (CRUD Penuh):**
  - Membuat pekerjaan baru dan menugaskannya langsung ke pegawai pilihan (`owner_id`).
  - Mengedit judul, deskripsi, prioritas, tenggat waktu, dan penugasan ulang.
  - Menghapus tugas (*hard delete*).
- **Pusat Tindakan (*Perlu Tindakan*):** Menyetujui (*Approve*) atau Menolak (*Reject*) permintaan status *Pending* tugas dan permohonan akun pendaftar baru.
- **Evaluasi & Ranking Tim:** Mengakses peringkat kinerja seluruh pegawai, grafik capaian KPI, dan analisis AI Review.
- **Laporan & Rekap:** Mengekspor seluruh data pekerjaan perusahaan ke format CSV.
- **Administrasi Pengguna:** Mengelola pengguna, menyetujui akun `pending`, menolak akun, atau menambah pengguna baru.
- **Pengaturan & Seeder:** Menjalankan database seeder dinamis dan mengonfigurasi preferensi workspace.

### 2. Pegawai Biasa (`user`)
- **Dashboard Pribadi:** Memantau metrik tugas personal, deadline terdekat, dan progres kerja.
- **Pekerjaan Saya:**
  - Mengubah status tugas miliknya (Belum Mulai, Dalam Proses, Selesai).
  - Mengunggah tautan bukti penyelesaian pekerjaan (*evidence URL*).
  - Mengajukan permohonan status *Pending* disertai alasan kendala.
  - Berpartisipasi dalam diskusi komentar berulir (*threaded comments*).
- **Status Permohonan:** Memantau apakah permohonan status *Pending* yang diajukan sudah disetujui atau ditolak Super Admin beserta catatan keputusan (*decision notes*).
- **Kalender Kerja:** Melihat jadwal dan tenggat waktu pekerjaan pada kisi kalender bulanan.
- **Evaluasi & Peringkat:** Melihat peringkat kinerja tim (*Leaderboard*) dan posisi capaian diri sendiri secara transparan.
- **Keamanan Akun:** Mengubah kata sandi mandiri (*Change Password*).

---

## ⚡ Cara Menjalankan Ulang Seeder (*Re-seed Database*)

Jika ingin mengatur ulang data kembali ke kondisi awal yang bersih (*fresh dynamic state*):

### Opsi A: Melalui Antarmuka Pengguna (Web UI)
1. Masuk (*login*) sebagai `admin@demo.com`.
2. Buka menu **Pengaturan** di sidebar.
3. Gulir ke bagian **Pemeliharaan Database & Seeder**.
4. Klik tombol **Jalankan Seeder Dinamis**.

### Opsi B: Melalui API Endpoint
Kirimkan HTTP POST request dengan sesi admin aktif:
```bash
curl -X POST https://erpkpi.hazra.biz.id/api/seed \
  -H "Cookie: mm_token=<TOKEN_ADMIN>"
```
