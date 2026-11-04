-- Database Initialization Script for Management Monitor
-- Character set and collation for Indonesian/multilingual support
CREATE DATABASE IF NOT EXISTS management_monitor CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE management_monitor;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  department VARCHAR(100) NOT NULL DEFAULT 'Operasional',
  job_title VARCHAR(100) NOT NULL DEFAULT 'Staf',
  role ENUM('admin', 'user') NOT NULL DEFAULT 'user',
  status ENUM('active', 'pending', 'rejected') NOT NULL DEFAULT 'active',
  avatar_initials VARCHAR(4) NOT NULL DEFAULT 'U',
  last_activity_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_email (email),
  INDEX idx_users_role (role),
  INDEX idx_users_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Tasks Table
CREATE TABLE IF NOT EXISTS tasks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(20) NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL,
  description TEXT NULL,
  category VARCHAR(100) NOT NULL DEFAULT 'Operasional',
  priority ENUM('Kritis', 'Tinggi', 'Menengah', 'Rendah') NOT NULL DEFAULT 'Menengah',
  status ENUM('Belum Mulai', 'Dalam Proses', 'Pending', 'Selesai', 'Terlambat') NOT NULL DEFAULT 'Belum Mulai',
  owner_id INT NOT NULL,
  deadline DATETIME NOT NULL,
  started_at DATETIME NULL,
  completed_at DATETIME NULL,
  evidence_url TEXT NULL,
  evidence_photo_name VARCHAR(255) NULL,
  pending_reason TEXT NULL,
  pending_requested_at DATETIME NULL,
  pending_approved TINYINT(1) NOT NULL DEFAULT 0,
  restart_history JSON NULL,
  is_demo_eval TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_tasks_owner FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_tasks_owner (owner_id),
  INDEX idx_tasks_status (status),
  INDEX idx_tasks_deadline (deadline),
  INDEX idx_tasks_category (category),
  INDEX idx_tasks_eval (is_demo_eval, deadline, owner_id, status),
  INDEX idx_tasks_created (created_at),
  INDEX idx_tasks_completed (completed_at),
  INDEX idx_tasks_dashboard (is_demo_eval, status, deadline)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Comments Table
CREATE TABLE IF NOT EXISTS comments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  task_id INT NOT NULL,
  user_id INT NOT NULL,
  parent_id INT NULL,
  text TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_comments_task FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  CONSTRAINT fk_comments_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_comments_parent FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE SET NULL,
  INDEX idx_comments_task (task_id),
  INDEX idx_comments_user (user_id),
  INDEX idx_comments_parent (parent_id),
  INDEX idx_comments_task_created (task_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Actions Table (Super Admin approvals: pending requests, deadline changes, etc.)
CREATE TABLE IF NOT EXISTS actions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  task_id INT NULL,
  user_id INT NOT NULL,
  level ENUM('Kritis', 'Penting', 'Informasi') NOT NULL DEFAULT 'Penting',
  type VARCHAR(50) NOT NULL DEFAULT 'pending_request',
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  previous_status VARCHAR(50) NULL,
  status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
  decision_notes TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  resolved_at DATETIME NULL,
  CONSTRAINT fk_actions_task FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE SET NULL,
  CONSTRAINT fk_actions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_actions_status (status),
  INDEX idx_actions_task (task_id),
  INDEX idx_actions_status_created (status, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL, -- NULL means broadcast to all/admins
  level ENUM('Kritis', 'Penting', 'Informasi') NOT NULL DEFAULT 'Informasi',
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  task_id INT NULL,
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_notif_task FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE SET NULL,
  INDEX idx_notif_user (user_id),
  INDEX idx_notif_read (is_read),
  INDEX idx_notif_created (created_at),
  INDEX idx_notif_user_read_created (user_id, is_read, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Settings Table
CREATE TABLE IF NOT EXISTS settings (
  key_name VARCHAR(100) PRIMARY KEY,
  key_value TEXT NOT NULL,
  description VARCHAR(255) NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- SEED DATA
-- Default Passwords:
-- Admin: Admin123 -> $2b$10$m1TReV77L8PLVj0qKACYe.OvDu7sTdKmGG5dKGvpmwLwvbS8cxiDG
-- User:  User123  -> $2b$10$epypTKOr.jj3nfKOx3LnP.Euer2dLY.yyd.A08EjpkqQVdQzvD58.

INSERT INTO users (id, full_name, email, password_hash, department, job_title, role, status, avatar_initials, last_activity_at) VALUES
(1, 'Super Admin', 'admin@demo.com', '$2b$10$m1TReV77L8PLVj0qKACYe.OvDu7sTdKmGG5dKGvpmwLwvbS8cxiDG', 'Administrasi', 'Administrator sistem', 'admin', 'active', 'SA', NOW()),
(2, 'Aditya Pratama', 'user@demo.com', '$2b$10$epypTKOr.jj3nfKOx3LnP.Euer2dLY.yyd.A08EjpkqQVdQzvD58.', 'Operasional', 'Koordinator', 'user', 'active', 'AP', NOW() - INTERVAL 12 MINUTE),
(3, 'Nadia Putri', 'nadia@example.com', '$2b$10$epypTKOr.jj3nfKOx3LnP.Euer2dLY.yyd.A08EjpkqQVdQzvD58.', 'Administrasi', 'Spesialis', 'user', 'active', 'NP', NOW() - INTERVAL 1 HOUR),
(4, 'Rizky Saputra', 'rizky@example.com', '$2b$10$epypTKOr.jj3nfKOx3LnP.Euer2dLY.yyd.A08EjpkqQVdQzvD58.', 'Proyek', 'Staf', 'user', 'pending', 'RS', NULL),
(5, 'Sarah Amelia', 'sarah@example.com', '$2b$10$epypTKOr.jj3nfKOx3LnP.Euer2dLY.yyd.A08EjpkqQVdQzvD58.', 'Operasional', 'Spesialis', 'user', 'active', 'SA', NOW() - INTERVAL 2 HOUR)
ON DUPLICATE KEY UPDATE full_name=VALUES(full_name);

INSERT INTO tasks (id, code, title, description, category, priority, status, owner_id, deadline, started_at, completed_at, evidence_url, is_demo_eval, created_at) VALUES
(1, 'MM-0001', 'Laporan mingguan operasional', 'Kompilasi dan validasi data operasional mingguan.', 'Operasional', 'Tinggi', 'Dalam Proses', 2, NOW() + INTERVAL 2 DAY, NOW() - INTERVAL 1 DAY, NULL, NULL, 0, NOW() - INTERVAL 2 DAY),
(2, 'MM-0002', 'Persiapan dokumen proyek', 'Susun dokumen pendukung dan catat hambatan.', 'Proyek', 'Kritis', 'Terlambat', 4, NOW() - INTERVAL 1 DAY, NOW() - INTERVAL 3 DAY, NULL, NULL, 0, NOW() - INTERVAL 4 DAY),
(3, 'MM-0003', 'Review dokumen administrasi', 'Pemeriksaan akhir dan konfirmasi data.', 'Administrasi', 'Menengah', 'Pending', 3, NOW() + INTERVAL 3 DAY, NOW() - INTERVAL 2 DAY, NULL, NULL, 0, NOW() - INTERVAL 3 DAY),
(4, 'MM-0004', 'Pembaruan SOP internal', 'Perbarui dokumen sesuai proses terbaru.', 'Operasional', 'Menengah', 'Dalam Proses', 5, NOW() + INTERVAL 4 DAY, NOW() - INTERVAL 1 DAY, NULL, NULL, 0, NOW() - INTERVAL 2 DAY),
(5, 'MM-0005', 'Rekap kebutuhan bulanan', 'Validasi kebutuhan dan siapkan ringkasan.', 'Administrasi', 'Rendah', 'Selesai', 2, NOW() - INTERVAL 2 DAY, NOW() - INTERVAL 4 DAY, NOW() - INTERVAL 2 DAY, 'https://drive.google.com/file/d/demo-rekap-bulanan', 0, NOW() - INTERVAL 5 DAY),
(6, 'MM-0006', 'Evaluasi hasil kuartal', 'Rangkum hasil, kendala, dan tindak lanjut.', 'Proyek', 'Tinggi', 'Belum Mulai', 5, NOW() + INTERVAL 5 DAY, NULL, NULL, NULL, 0, NOW() - INTERVAL 1 DAY),
(7, 'MM-0007', 'Verifikasi arsip dokumen', 'Pastikan arsip tersimpan dan dapat diakses.', 'Administrasi', 'Menengah', 'Selesai', 3, NOW() - INTERVAL 3 DAY, NOW() - INTERVAL 5 DAY, NOW() - INTERVAL 3 DAY, 'https://drive.google.com/file/d/demo-arsip-dokumen', 0, NOW() - INTERVAL 6 DAY),
(8, 'MM-0008', 'Rencana kerja pekan depan', 'Susun prioritas dan dependensi pekerjaan.', 'Operasional', 'Rendah', 'Belum Mulai', 4, NOW() + INTERVAL 1 DAY, NULL, NULL, NULL, 0, NOW() - INTERVAL 1 DAY)
ON DUPLICATE KEY UPDATE title=VALUES(title);

-- Evaluation Demo Tasks for robust evaluation calculations
INSERT INTO tasks (id, code, title, description, category, priority, status, owner_id, deadline, started_at, completed_at, is_demo_eval, created_at) VALUES
(901, 'MM-0901', 'Rekap KPI mingguan', 'Tugas evaluasi kinerja', 'Operasional', 'Menengah', 'Selesai', 2, NOW() - INTERVAL 5 DAY, NOW() - INTERVAL 7 DAY, NOW() - INTERVAL 5 DAY, 1, NOW() - INTERVAL 8 DAY),
(902, 'MM-0902', 'Audit kelengkapan laporan', 'Tugas evaluasi kinerja', 'Operasional', 'Menengah', 'Selesai', 2, NOW() - INTERVAL 4 DAY, NOW() - INTERVAL 6 DAY, NOW() - INTERVAL 4 DAY, 1, NOW() - INTERVAL 7 DAY),
(903, 'MM-0903', 'Analisis penyimpangan target', 'Tugas evaluasi kinerja', 'Operasional', 'Menengah', 'Selesai', 2, NOW() - INTERVAL 3 DAY, NOW() - INTERVAL 5 DAY, NOW() - INTERVAL 3 DAY, 1, NOW() - INTERVAL 6 DAY),
(904, 'MM-0904', 'Pembaruan dashboard operasional', 'Tugas evaluasi kinerja', 'Operasional', 'Menengah', 'Dalam Proses', 2, NOW() - INTERVAL 2 DAY, NOW() - INTERVAL 4 DAY, NULL, 1, NOW() - INTERVAL 5 DAY),
(905, 'MM-0905', 'Rencana tindak lanjut mingguan', 'Tugas evaluasi kinerja', 'Operasional', 'Menengah', 'Selesai', 2, NOW() - INTERVAL 1 DAY, NOW() - INTERVAL 3 DAY, NOW() - INTERVAL 1 DAY, 1, NOW() - INTERVAL 4 DAY),
(906, 'MM-0906', 'Validasi data akhir pekan', 'Tugas evaluasi kinerja', 'Operasional', 'Menengah', 'Selesai', 2, NOW(), NOW() - INTERVAL 2 DAY, NOW(), 1, NOW() - INTERVAL 3 DAY),

(907, 'MM-0907', 'Pemeriksaan dokumen vendor', 'Tugas evaluasi kinerja', 'Administrasi', 'Menengah', 'Selesai', 3, NOW() - INTERVAL 5 DAY, NOW() - INTERVAL 7 DAY, NOW() - INTERVAL 5 DAY, 1, NOW() - INTERVAL 8 DAY),
(908, 'MM-0908', 'Rekonsiliasi data administrasi', 'Tugas evaluasi kinerja', 'Administrasi', 'Menengah', 'Selesai', 3, NOW() - INTERVAL 4 DAY, NOW() - INTERVAL 6 DAY, NOW() - INTERVAL 4 DAY, 1, NOW() - INTERVAL 7 DAY),
(909, 'MM-0909', 'Pembaruan arsip kontrak', 'Tugas evaluasi kinerja', 'Administrasi', 'Menengah', 'Selesai', 3, NOW() - INTERVAL 3 DAY, NOW() - INTERVAL 5 DAY, NOW() - INTERVAL 3 DAY, 1, NOW() - INTERVAL 6 DAY),
(910, 'MM-0910', 'Validasi formulir permintaan', 'Tugas evaluasi kinerja', 'Administrasi', 'Menengah', 'Selesai', 3, NOW() - INTERVAL 2 DAY, NOW() - INTERVAL 4 DAY, NOW() - INTERVAL 2 DAY, 1, NOW() - INTERVAL 5 DAY),
(911, 'MM-0911', 'Penyusunan ringkasan dokumen', 'Tugas evaluasi kinerja', 'Administrasi', 'Menengah', 'Pending', 3, NOW() - INTERVAL 1 DAY, NOW() - INTERVAL 3 DAY, NULL, 1, NOW() - INTERVAL 4 DAY),
(912, 'MM-0912', 'Finalisasi daftar arsip', 'Tugas evaluasi kinerja', 'Administrasi', 'Menengah', 'Selesai', 3, NOW(), NOW() - INTERVAL 2 DAY, NOW(), 1, NOW() - INTERVAL 3 DAY),

(913, 'MM-0913', 'Pembaruan rencana proyek', 'Tugas evaluasi kinerja', 'Proyek', 'Menengah', 'Selesai', 4, NOW() - INTERVAL 5 DAY, NOW() - INTERVAL 7 DAY, NOW() - INTERVAL 5 DAY, 1, NOW() - INTERVAL 8 DAY),
(914, 'MM-0914', 'Koordinasi dependensi proyek', 'Tugas evaluasi kinerja', 'Proyek', 'Menengah', 'Terlambat', 4, NOW() - INTERVAL 4 DAY, NOW() - INTERVAL 6 DAY, NULL, 1, NOW() - INTERVAL 7 DAY),
(915, 'MM-0915', 'Penyusunan daftar risiko', 'Tugas evaluasi kinerja', 'Proyek', 'Menengah', 'Selesai', 4, NOW() - INTERVAL 3 DAY, NOW() - INTERVAL 5 DAY, NOW() - INTERVAL 3 DAY, 1, NOW() - INTERVAL 6 DAY),
(916, 'MM-0916', 'Konfirmasi jadwal mitra', 'Tugas evaluasi kinerja', 'Proyek', 'Menengah', 'Pending', 4, NOW() - INTERVAL 2 DAY, NOW() - INTERVAL 4 DAY, NULL, 1, NOW() - INTERVAL 5 DAY),
(917, 'MM-0917', 'Dokumentasi progres proyek', 'Tugas evaluasi kinerja', 'Proyek', 'Menengah', 'Selesai', 4, NOW() - INTERVAL 1 DAY, NOW() - INTERVAL 3 DAY, NOW() - INTERVAL 1 DAY, 1, NOW() - INTERVAL 4 DAY),
(918, 'MM-0918', 'Pemeriksaan output sprint', 'Tugas evaluasi kinerja', 'Proyek', 'Menengah', 'Dalam Proses', 4, NOW(), NOW() - INTERVAL 2 DAY, NULL, 1, NOW() - INTERVAL 3 DAY),

(919, 'MM-0919', 'Penyusunan SOP proses', 'Tugas evaluasi kinerja', 'Operasional', 'Menengah', 'Selesai', 5, NOW() - INTERVAL 5 DAY, NOW() - INTERVAL 7 DAY, NOW() - INTERVAL 5 DAY, 1, NOW() - INTERVAL 8 DAY),
(920, 'MM-0920', 'Review kualitas dokumen', 'Tugas evaluasi kinerja', 'Operasional', 'Menengah', 'Selesai', 5, NOW() - INTERVAL 4 DAY, NOW() - INTERVAL 6 DAY, NOW() - INTERVAL 4 DAY, 1, NOW() - INTERVAL 7 DAY),
(921, 'MM-0921', 'Pengumpulan masukan tim', 'Tugas evaluasi kinerja', 'Operasional', 'Menengah', 'Selesai', 5, NOW() - INTERVAL 3 DAY, NOW() - INTERVAL 5 DAY, NOW() - INTERVAL 3 DAY, 1, NOW() - INTERVAL 6 DAY),
(922, 'MM-0922', 'Pemetaan proses kerja', 'Tugas evaluasi kinerja', 'Operasional', 'Menengah', 'Selesai', 5, NOW() - INTERVAL 2 DAY, NOW() - INTERVAL 4 DAY, NOW() - INTERVAL 2 DAY, 1, NOW() - INTERVAL 5 DAY),
(923, 'MM-0923', 'Ringkasan hasil evaluasi', 'Tugas evaluasi kinerja', 'Operasional', 'Menengah', 'Selesai', 5, NOW() - INTERVAL 1 DAY, NOW() - INTERVAL 3 DAY, NOW() - INTERVAL 1 DAY, 1, NOW() - INTERVAL 4 DAY),
(924, 'MM-0924', 'Rencana perbaikan proses', 'Tugas evaluasi kinerja', 'Operasional', 'Menengah', 'Dalam Proses', 5, NOW(), NOW() - INTERVAL 2 DAY, NULL, 1, NOW() - INTERVAL 3 DAY)
ON DUPLICATE KEY UPDATE title=VALUES(title);

-- Initial Comments
INSERT INTO comments (id, task_id, user_id, parent_id, text, created_at) VALUES
(101, 1, 2, NULL, 'Laporan sudah saya unggah. Mohon ditinjau.', NOW() - INTERVAL 8 HOUR),
(102, 1, 1, 101, 'Terima kasih. Mohon tambahkan analisis penyebab perubahan angka.', NOW() - INTERVAL 7 HOUR),
(103, 1, 2, 102, 'Baik, saya tambahkan analisis dan mengunggah revisinya hari ini.', NOW() - INTERVAL 6 HOUR)
ON DUPLICATE KEY UPDATE text=VALUES(text);
ON DUPLICATE KEY UPDATE text=VALUES(text);

-- Initial Actions (Perlu Tindakan)
INSERT INTO actions (id, task_id, user_id, level, type, title, body, created_at, status) VALUES
(1, 1, 2, 'Penting', 'deadline_change', 'Perubahan deadline: Laporan mingguan operasional', 'Aditya Pratama meminta tenggat baru karena menunggu data pendukung.', NOW() - INTERVAL 22 MINUTE, 'pending'),
(2, 2, 4, 'Penting', 'pending_request', 'Permintaan Pending: Persiapan dokumen proyek', 'Rizky Saputra menyampaikan hambatan dari pihak eksternal.', NOW() - INTERVAL 1 HOUR, 'pending'),
(3, 3, 3, 'Penting', 'deadline_change', 'Permintaan perubahan deadline: Review dokumen administrasi', 'Nadia Putri meminta tambahan waktu untuk pemeriksaan akhir.', NOW() - INTERVAL 3 HOUR, 'pending')
ON DUPLICATE KEY UPDATE title=VALUES(title);

-- Initial Notifications
INSERT INTO notifications (id, user_id, level, title, body, is_read, created_at) VALUES
(1, NULL, 'Kritis', '3 pekerjaan melewati deadline', 'Ada pekerjaan yang membutuhkan perhatian segera.', 0, NOW() - INTERVAL 5 MINUTE),
(2, 1, 'Penting', 'Permintaan perubahan deadline', 'Aditya Pratama meminta perubahan deadline laporan mingguan.', 0, NOW() - INTERVAL 22 MINUTE),
(3, 1, 'Penting', 'Permintaan Pending pekerjaan', 'Rizky Saputra mengajukan status Pending untuk tugas proyek.', 0, NOW() - INTERVAL 1 HOUR),
(4, NULL, 'Informasi', 'Bukti pekerjaan berhasil diunggah', 'Nadia Putri menambahkan bukti untuk laporan administrasi.', 0, NOW() - INTERVAL 2 HOUR),
(5, NULL, 'Informasi', 'Pekerjaan baru dibuat', 'Aditya Pratama membuat pekerjaan baru.', 1, NOW() - INTERVAL 3 HOUR),
(6, NULL, 'Informasi', 'Status pekerjaan diperbarui', 'Satu pekerjaan berubah menjadi Dalam Proses.', 1, NOW() - INTERVAL 1 DAY)
ON DUPLICATE KEY UPDATE title=VALUES(title);

-- Initial Settings
INSERT INTO settings (key_name, key_value, description) VALUES
('workspace_name', 'Management Monitor', 'Nama workspace aplikasi'),
('departments', 'Operasional, Administrasi, Proyek, Keuangan, Lainnya', 'Daftar departemen organisasi'),
('job_titles', 'Koordinator, Spesialis, Staf, Manajer', 'Daftar jabatan organisasi'),
('theme', 'light', 'Tema aktif workspace'),
('reminder_deadline', 'true', 'Pengingat deadline 24 jam dan 1 jam'),
('app_notifications', 'true', 'Notifikasi dalam aplikasi'),
('compact_mode', 'false', 'Mode tampilan ringkas'),
('weekly_summary', 'true', 'Ringkasan mingguan otomatis')
ON DUPLICATE KEY UPDATE key_value=VALUES(key_value);
