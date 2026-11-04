import { pool } from '@/lib/db';
import bcrypt from 'bcryptjs';

// Helper format Tanggal SQL (YYYY-MM-DD HH:mm:ss)
function toSqlDateTime(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  const h = pad(date.getHours());
  const mi = pad(date.getMinutes());
  const s = pad(date.getSeconds());
  return `${y}-${m}-${d} ${h}:${mi}:${s}`;
}

function addHours(date: Date, hours: number): Date {
  const d = new Date(date);
  d.setHours(d.getHours() + hours);
  return d;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

async function addIndexSafely(tableName: string, indexName: string, indexCols: string) {
  try {
    await pool.query(`ALTER TABLE ${tableName} ADD INDEX ${indexName} (${indexCols})`);
    console.log(`  ✓ Index ${indexName} ditambahkan pada ${tableName}`);
  } catch (err: any) {
    if (err.errno === 1061 || err.code === 'ER_DUP_KEYNAME') {
      console.log(`  ℹ Index ${indexName} sudah ada pada ${tableName}`);
    } else {
      console.warn(`  ⚠ Warning index ${indexName}:`, err.message);
    }
  }
}

export async function runSeeder(): Promise<{
  success: boolean;
  usersCount: number;
  tasksCount: number;
  commentsCount: number;
  actionsCount: number;
  notificationsCount: number;
}> {
  console.log('🚀 Memulai Dynamic Database Seeder & Performance Optimization...');

  const now = new Date();

  // 1. Optimasi Indexing untuk Performa Query Skala Tinggi
  console.log('\n📌 1. Memeriksa & Menyiapkan Performance Indexes...');
  await addIndexSafely('tasks', 'idx_tasks_eval', 'is_demo_eval, deadline, owner_id, status');
  await addIndexSafely('tasks', 'idx_tasks_created', 'created_at');
  await addIndexSafely('tasks', 'idx_tasks_completed', 'completed_at');
  await addIndexSafely('tasks', 'idx_tasks_dashboard', 'is_demo_eval, status, deadline');
  await addIndexSafely('comments', 'idx_comments_task_created', 'task_id, created_at');
  await addIndexSafely('actions', 'idx_actions_status_created', 'status, created_at');
  await addIndexSafely('notifications', 'idx_notif_user_read_created', 'user_id, is_read, created_at');

  // 2. Bersihkan Data Lama Secara Terkendali
  console.log('\n🧹 2. Membersihkan tabel data lama...');
  await pool.query('SET FOREIGN_KEY_CHECKS = 0');
  await pool.query('TRUNCATE TABLE comments');
  await pool.query('TRUNCATE TABLE actions');
  await pool.query('TRUNCATE TABLE notifications');
  await pool.query('TRUNCATE TABLE tasks');
  await pool.query('TRUNCATE TABLE users');
  await pool.query('SET FOREIGN_KEY_CHECKS = 1');

  // 3. Seed Pengguna (Users)
  console.log('\n👤 3. Melakukan seeding pengguna (Users)...');
  const adminHash = await bcrypt.hash('Admin123', 10);
  const userHash = await bcrypt.hash('User123', 10);

  const users = [
    {
      id: 1,
      full_name: 'Super Admin',
      email: 'admin@demo.com',
      password_hash: adminHash,
      department: 'Administrasi',
      job_title: 'Administrator sistem',
      role: 'admin',
      status: 'active',
      avatar_initials: 'SA',
      last_activity_at: toSqlDateTime(addHours(now, -1)),
    },
    {
      id: 2,
      full_name: 'Aditya Pratama',
      email: 'user@demo.com',
      password_hash: userHash,
      department: 'Operasional',
      job_title: 'Koordinator',
      role: 'user',
      status: 'active',
      avatar_initials: 'AP',
      last_activity_at: toSqlDateTime(addHours(now, -2)),
    },
    {
      id: 3,
      full_name: 'Nadia Putri',
      email: 'nadia@example.com',
      password_hash: userHash,
      department: 'Administrasi',
      job_title: 'Spesialis Administrasi',
      role: 'user',
      status: 'active',
      avatar_initials: 'NP',
      last_activity_at: toSqlDateTime(addHours(now, -3)),
    },
    {
      id: 4,
      full_name: 'Rizky Saputra',
      email: 'rizky@example.com',
      password_hash: userHash,
      department: 'Proyek',
      job_title: 'Staf Proyek',
      role: 'user',
      status: 'active',
      avatar_initials: 'RS',
      last_activity_at: toSqlDateTime(addHours(now, -5)),
    },
    {
      id: 5,
      full_name: 'Sarah Amelia',
      email: 'sarah@example.com',
      password_hash: userHash,
      department: 'Operasional',
      job_title: 'Spesialis Operasional',
      role: 'user',
      status: 'active',
      avatar_initials: 'SA',
      last_activity_at: toSqlDateTime(addHours(now, -4)),
    },
    {
      id: 6,
      full_name: 'Budi Santoso',
      email: 'budi@example.com',
      password_hash: userHash,
      department: 'TI',
      job_title: 'Lead Developer',
      role: 'user',
      status: 'active',
      avatar_initials: 'BS',
      last_activity_at: toSqlDateTime(addHours(now, -2)),
    },
    {
      id: 7,
      full_name: 'Dewi Lestari',
      email: 'dewi@example.com',
      password_hash: userHash,
      department: 'Keuangan',
      job_title: 'Staf Keuangan',
      role: 'user',
      status: 'active',
      avatar_initials: 'DL',
      last_activity_at: toSqlDateTime(addHours(now, -6)),
    },
    {
      id: 8,
      full_name: 'Hendra Wijaya',
      email: 'hendra@example.com',
      password_hash: userHash,
      department: 'Proyek',
      job_title: 'Manajer Proyek',
      role: 'user',
      status: 'pending',
      avatar_initials: 'HW',
      last_activity_at: null,
    },
  ];

  for (const u of users) {
    await pool.query(
      `INSERT INTO users (id, full_name, email, password_hash, department, job_title, role, status, avatar_initials, last_activity_at, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        u.id,
        u.full_name,
        u.email,
        u.password_hash,
        u.department,
        u.job_title,
        u.role,
        u.status,
        u.avatar_initials,
        u.last_activity_at,
        toSqlDateTime(addDays(now, -30)),
      ]
    );
  }
  console.log(`  ✓ Berhasil membuat ${users.length} pengguna.`);

  // 4. Seed Dynamic Tasks
  console.log('\n📋 4. Melakukan seeding pekerjaan dinamis (Tasks)...');

  interface TaskSeed {
    id: number;
    code: string;
    title: string;
    description: string;
    category: string;
    priority: string;
    status: string;
    owner_id: number;
    deadline: Date;
    started_at: Date | null;
    completed_at: Date | null;
    evidence_url: string | null;
    pending_reason: string | null;
    pending_approved: number;
    is_demo_eval: number;
    created_at: Date;
  }

  const tasks: TaskSeed[] = [];
  let taskId = 1;

  // A. Tren 7 Hari Terakhir (Past 7 Days - Mengisi Grafik Dashboard)
  for (let i = 6; i >= 0; i--) {
    const targetDate = addDays(now, -i);

    tasks.push({
      id: taskId++,
      code: `MM-${String(taskId).padStart(4, '0')}`,
      title: `Penyusunan Log Aktivitas H-${i}`,
      description: `Rekapitulasi log aktivitas harian tim operasional dan verifikasi catatan kerja.`,
      category: i % 2 === 0 ? 'Operasional' : 'Administrasi',
      priority: i % 3 === 0 ? 'Tinggi' : 'Menengah',
      status: 'Selesai',
      owner_id: (i % 5) + 2,
      deadline: addHours(targetDate, 17),
      started_at: addHours(targetDate, 8),
      completed_at: addHours(targetDate, 15),
      evidence_url: `https://drive.google.com/file/d/demo-evidence-day-${i}`,
      pending_reason: null,
      pending_approved: 0,
      is_demo_eval: 0,
      created_at: addHours(targetDate, 7),
    });

    tasks.push({
      id: taskId++,
      code: `MM-${String(taskId).padStart(4, '0')}`,
      title: `Validasi Transaksi & Dokumen H-${i}`,
      description: `Pemeriksaan invoice dan sinkronisasi laporan keuangan per divisi.`,
      category: i % 2 === 0 ? 'Keuangan' : 'TI',
      priority: 'Menengah',
      status: 'Selesai',
      owner_id: (i % 4) + 3,
      deadline: addHours(targetDate, 16),
      started_at: addHours(targetDate, 9),
      completed_at: addHours(targetDate, 14),
      evidence_url: `https://drive.google.com/file/d/demo-transaksi-${i}`,
      pending_reason: null,
      pending_approved: 0,
      is_demo_eval: 0,
      created_at: addHours(targetDate, 8),
    });
  }

  // B. Pekerjaan Aktif Hari Ini & Mendatang (Dashboard, Kalender & Monitoring)
  tasks.push({
    id: taskId++,
    code: `MM-${String(taskId).padStart(4, '0')}`,
    title: 'Review Anggaran Operasional Q4',
    description: 'Pengecekan alokasi anggaran belanja departemen operasional menjelang akhir tahun.',
    category: 'Keuangan',
    priority: 'Kritis',
    status: 'Dalam Proses',
    owner_id: 7, // Dewi Lestari
    deadline: addHours(now, 5),
    started_at: addHours(now, -3),
    completed_at: null,
    evidence_url: null,
    pending_reason: null,
    pending_approved: 0,
    is_demo_eval: 0,
    created_at: addHours(now, -6),
  });

  tasks.push({
    id: taskId++,
    code: `MM-${String(taskId).padStart(4, '0')}`,
    title: 'Optimasi Query Database & Caching',
    description: 'Peningkatan kecepatan respon endpoint laporan dan indeks tabel besar.',
    category: 'TI',
    priority: 'Tinggi',
    status: 'Dalam Proses',
    owner_id: 6, // Budi Santoso
    deadline: addHours(now, 6),
    started_at: addHours(now, -2),
    completed_at: null,
    evidence_url: null,
    pending_reason: null,
    pending_approved: 0,
    is_demo_eval: 0,
    created_at: addHours(now, -8),
  });

  tasks.push({
    id: taskId++,
    code: `MM-${String(taskId).padStart(4, '0')}`,
    title: 'Pengadaan Server Backup Cloud',
    description: 'Menunggu konfirmasi approval termin pembayaran dari pihak vendor penyedia.',
    category: 'TI',
    priority: 'Tinggi',
    status: 'Pending',
    owner_id: 6, // Budi Santoso
    deadline: addDays(now, 2),
    started_at: addDays(now, -1),
    completed_at: null,
    evidence_url: null,
    pending_reason: 'Menunggu konfirmasi invoice resmi dan persetujuan termin 2 dari vendor.',
    pending_approved: 0,
    is_demo_eval: 0,
    created_at: addDays(now, -1),
  });

  tasks.push({
    id: taskId++,
    code: `MM-${String(taskId).padStart(4, '0')}`,
    title: 'Persiapan Dokumen Uji Lapangan',
    description: 'Koordinasi perizinan akses lokasi dengan pengelola kawasan.',
    category: 'Proyek',
    priority: 'Menengah',
    status: 'Pending',
    owner_id: 4, // Rizky
    deadline: addDays(now, 3),
    started_at: addDays(now, -2),
    completed_at: null,
    evidence_url: null,
    pending_reason: 'Surat izin akses gedung baru akan diterbitkan dinas esok hari.',
    pending_approved: 0,
    is_demo_eval: 0,
    created_at: addDays(now, -2),
  });

  tasks.push({
    id: taskId++,
    code: `MM-${String(taskId).padStart(4, '0')}`,
    title: 'Rekonsiliasi Faktur Pajak Masukan',
    description: 'Validasi faktur pajak dari supplier barang operasional periode bulan lalu.',
    category: 'Keuangan',
    priority: 'Kritis',
    status: 'Terlambat',
    owner_id: 7, // Dewi Lestari
    deadline: addDays(now, -1),
    started_at: addDays(now, -3),
    completed_at: null,
    evidence_url: null,
    pending_reason: null,
    pending_approved: 0,
    is_demo_eval: 0,
    created_at: addDays(now, -4),
  });

  const upcomingDefs = [
    { title: 'Penyusunan Rencana Kerja Mingguan', cat: 'Operasional', prio: 'Menengah', user: 2, days: 1 },
    { title: 'Audit Internal Dokumen SOP', cat: 'Administrasi', prio: 'Tinggi', user: 3, days: 2 },
    { title: 'Sprint Review & Demo Modul KPI', cat: 'TI', prio: 'Tinggi', user: 6, days: 4 },
    { title: 'Monitoring Progres Konstruksi Tahap 3', cat: 'Proyek', prio: 'Kritis', user: 4, days: 7 },
    { title: 'Kompilasi Laporan Bulanan Direksi', cat: 'Administrasi', prio: 'Menengah', user: 5, days: 12 },
  ];

  for (const up of upcomingDefs) {
    tasks.push({
      id: taskId++,
      code: `MM-${String(taskId).padStart(4, '0')}`,
      title: up.title,
      description: `Deskripsi tugas operasional standar untuk ${up.title}.`,
      category: up.cat,
      priority: up.prio,
      status: 'Belum Mulai',
      owner_id: up.user,
      deadline: addDays(now, up.days),
      started_at: null,
      completed_at: null,
      evidence_url: null,
      pending_reason: null,
      pending_approved: 0,
      is_demo_eval: 0,
      created_at: addDays(now, -1),
    });
  }

  // C. Evaluasi & Ranking Data Komprehensif (is_demo_eval = 1)
  console.log('   Menghasilkan data evaluasi komprehensif (Current & Previous Periods)...');
  const evalUsers = [2, 3, 4, 5, 6, 7];

  for (const uid of evalUsers) {
    const userRoleCat =
      uid === 2 ? 'Operasional' :
      uid === 3 ? 'Administrasi' :
      uid === 4 ? 'Proyek' :
      uid === 5 ? 'Operasional' :
      uid === 6 ? 'TI' : 'Keuangan';

    // Current month tasks
    for (let k = 1; k <= 5; k++) {
      const taskDayOffset = -((k * 3) % 20);
      const taskDeadline = addDays(now, taskDayOffset);
      const isLate = k === 4 && uid === 4;
      const isPending = k === 5 && uid === 3;

      tasks.push({
        id: taskId++,
        code: `EV-${String(taskId).padStart(4, '0')}`,
        title: `Tugas Evaluasi Kinerja #${k} (${userRoleCat})`,
        description: `Pekerjaan terukur untuk evaluasi akuntabilitas dan pencapaian target.`,
        category: userRoleCat,
        priority: 'Menengah',
        status: isPending ? 'Dalam Proses' : 'Selesai',
        owner_id: uid,
        deadline: taskDeadline,
        started_at: addHours(taskDeadline, -48),
        completed_at: isPending ? null : addHours(taskDeadline, isLate ? 4 : -2),
        evidence_url: isPending ? null : `https://drive.google.com/file/d/eval-proof-${taskId}`,
        pending_reason: null,
        pending_approved: 0,
        is_demo_eval: 1,
        created_at: addHours(taskDeadline, -72),
      });
    }

    // Previous month tasks
    for (let k = 1; k <= 5; k++) {
      const prevMonthDeadline = addDays(now, -35 - (k * 4));
      tasks.push({
        id: taskId++,
        code: `EV-${String(taskId).padStart(4, '0')}`,
        title: `Evaluasi Bulan Lalu #${k} (${userRoleCat})`,
        description: `Rekapitulasi pencapaian kerja bulan lalu.`,
        category: userRoleCat,
        priority: 'Menengah',
        status: 'Selesai',
        owner_id: uid,
        deadline: prevMonthDeadline,
        started_at: addHours(prevMonthDeadline, -48),
        completed_at: addHours(prevMonthDeadline, -3),
        evidence_url: `https://drive.google.com/file/d/eval-prev-${taskId}`,
        pending_reason: null,
        pending_approved: 0,
        is_demo_eval: 1,
        created_at: addHours(prevMonthDeadline, -72),
      });
    }
  }

  for (const t of tasks) {
    await pool.query(
      `INSERT INTO tasks (
        id, code, title, description, category, priority, status,
        owner_id, deadline, started_at, completed_at, evidence_url,
        pending_reason, pending_approved, is_demo_eval, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        t.id,
        t.code,
        t.title,
        t.description,
        t.category,
        t.priority,
        t.status,
        t.owner_id,
        toSqlDateTime(t.deadline),
        t.started_at ? toSqlDateTime(t.started_at) : null,
        t.completed_at ? toSqlDateTime(t.completed_at) : null,
        t.evidence_url,
        t.pending_reason,
        t.pending_approved,
        t.is_demo_eval,
        toSqlDateTime(t.created_at),
      ]
    );
  }
  console.log(`  ✓ Berhasil memasukkan ${tasks.length} pekerjaan dinamis.`);

  // 5. Seed Comments
  console.log('\n💬 5. Melakukan seeding komentar diskusi...');
  const comments = [
    {
      id: 1,
      task_id: 15,
      user_id: 7,
      parent_id: null,
      text: 'Rincian anggaran telah saya sinkronkan dengan divisi operasional. Menunggu validasi akhir.',
      created_at: toSqlDateTime(addHours(now, -2)),
    },
    {
      id: 2,
      task_id: 15,
      user_id: 1,
      parent_id: 1,
      text: 'Bagus Dewi, tolong pastikan pos pengeluaran darurat dialokasikan minimal 10%.',
      created_at: toSqlDateTime(addHours(now, -1)),
    },
    {
      id: 3,
      task_id: 17,
      user_id: 6,
      parent_id: null,
      text: 'Vendor telah mengirimkan invoice termin 2 via email, mohon persetujuan perubahan status ke Pending.',
      created_at: toSqlDateTime(addHours(now, -5)),
    },
    {
      id: 4,
      task_id: 17,
      user_id: 1,
      parent_id: 3,
      text: 'Dokumen sedang kami verifikasi bersama bagian pengadaan.',
      created_at: toSqlDateTime(addHours(now, -3)),
    },
  ];

  for (const c of comments) {
    await pool.query(
      `INSERT INTO comments (id, task_id, user_id, parent_id, text, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [c.id, c.task_id, c.user_id, c.parent_id, c.text, c.created_at]
    );
  }
  console.log(`  ✓ Berhasil membuat ${comments.length} komentar.`);

  // 6. Seed Actions
  console.log('\n⚡ 6. Melakukan seeding persetujuan / Perlu Tindakan (Actions)...');
  const actions = [
    {
      id: 1,
      task_id: 17,
      user_id: 6,
      level: 'Penting',
      type: 'pending_request',
      title: 'Permintaan Status Pending: Pengadaan Server Backup',
      body: 'Budi Santoso mengajukan status Pending karena menunggu invoice resmi termin 2 dari vendor.',
      previous_status: 'Dalam Proses',
      status: 'pending',
      created_at: toSqlDateTime(addHours(now, -2)),
    },
    {
      id: 2,
      task_id: 18,
      user_id: 4,
      level: 'Penting',
      type: 'pending_request',
      title: 'Permintaan Status Pending: Persiapan Dokumen Uji Lapangan',
      body: 'Rizky Saputra mengajukan status Pending karena perizinan akses gedung baru diterbitkan esok hari.',
      previous_status: 'Dalam Proses',
      status: 'pending',
      created_at: toSqlDateTime(addHours(now, -4)),
    },
    {
      id: 3,
      task_id: 16,
      user_id: 6,
      level: 'Informasi',
      type: 'deadline_change',
      title: 'Pembaruan Estimasi Waktu Selesai',
      body: 'Budi Santoso memperbarui estimasi pengerjaan optimasi query database.',
      previous_status: null,
      status: 'approved',
      created_at: toSqlDateTime(addDays(now, -1)),
    },
  ];

  for (const a of actions) {
    await pool.query(
      `INSERT INTO actions (id, task_id, user_id, level, type, title, body, previous_status, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [a.id, a.task_id, a.user_id, a.level, a.type, a.title, a.body, a.previous_status, a.status, a.created_at]
    );
  }
  console.log(`  ✓ Berhasil membuat ${actions.length} permintaan tindakan (Actions).`);

  // 7. Seed Notifications
  console.log('\n🔔 7. Melakukan seeding notifikasi dinamis (Notifications)...');
  const notifications = [
    {
      id: 1,
      user_id: null,
      level: 'Kritis',
      title: 'Pekerjaan Melewati Tenggat Waktu',
      body: 'Terdapat 1 pekerjaan berstatus Terlambat yang memerlukan penanganan segera.',
      task_id: 19,
      is_read: 0,
      created_at: toSqlDateTime(addHours(now, -1)),
    },
    {
      id: 2,
      user_id: 1,
      level: 'Penting',
      title: 'Permintaan Persetujuan Pending Baru',
      body: 'Budi Santoso mengajukan status Pending untuk tugas Pengadaan Server Backup Cloud.',
      task_id: 17,
      is_read: 0,
      created_at: toSqlDateTime(addHours(now, -2)),
    },
    {
      id: 3,
      user_id: null,
      level: 'Informasi',
      title: 'Pembaruan Progres Mingguan',
      body: 'Tren penyelesaian tugas 7 hari terakhir menunjukkan produktivitas stabil di atas 90%.',
      task_id: null,
      is_read: 0,
      created_at: toSqlDateTime(addHours(now, -5)),
    },
    {
      id: 4,
      user_id: 2,
      level: 'Informasi',
      title: 'Tugas Selesai Terverifikasi',
      body: 'Bukti pekerjaan log aktivitas harian Anda telah diverifikasi oleh koordinator.',
      task_id: 1,
      is_read: 1,
      created_at: toSqlDateTime(addDays(now, -1)),
    },
  ];

  for (const n of notifications) {
    await pool.query(
      `INSERT INTO notifications (id, user_id, level, title, body, task_id, is_read, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [n.id, n.user_id, n.level, n.title, n.body, n.task_id, n.is_read, n.created_at]
    );
  }
  console.log(`  ✓ Berhasil membuat ${notifications.length} notifikasi.`);

  // 8. Seed Settings
  console.log('\n⚙️ 8. Melakukan konfigurasi pengaturan sistem (Settings)...');
  const settings = [
    ['workspace_name', 'Management Monitor Enterprise', 'Nama workspace aplikasi'],
    ['departments', 'Operasional, Administrasi, Proyek, TI, Keuangan', 'Daftar departemen organisasi'],
    ['job_titles', 'Koordinator, Spesialis, Staf, Lead Developer, Manajer Proyek, Administrator sistem', 'Daftar jabatan organisasi'],
    ['theme', 'light', 'Tema aktif workspace'],
    ['reminder_deadline', 'true', 'Pengingat deadline otomatis'],
    ['app_notifications', 'true', 'Notifikasi dalam aplikasi'],
    ['compact_mode', 'false', 'Mode tampilan ringkas'],
    ['weekly_summary', 'true', 'Ringkasan mingguan otomatis'],
  ];

  for (const [k, v, desc] of settings) {
    await pool.query(
      `INSERT INTO settings (key_name, key_value, description)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE key_value = VALUES(key_value), description = VALUES(description)`,
      [k, v, desc]
    );
  }
  console.log(`  ✓ Berhasil menyimpan pengaturan sistem.`);

  return {
    success: true,
    usersCount: users.length,
    tasksCount: tasks.length,
    commentsCount: comments.length,
    actionsCount: actions.length,
    notificationsCount: notifications.length,
  };
}
