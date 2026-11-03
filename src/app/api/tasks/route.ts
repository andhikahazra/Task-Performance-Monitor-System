import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { query, queryOne, execute, transaction } from '@/lib/db';
import { Task, TaskPriority, TaskStatus } from '@/types/database';

export async function GET(request: Request) {
  try {
    const auth = await requireAuth(request);
    if (auth.error) {
      return auth.error;
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.trim().toLowerCase() || '';
    const status = searchParams.get('status')?.trim() || 'all';
    const priority = searchParams.get('priority')?.trim() || 'all';
    const category = searchParams.get('category')?.trim() || 'all';
    const ownerIdParam = searchParams.get('owner_id')?.trim();
    const includeDemo = searchParams.get('include_demo') === 'true';
    const month = searchParams.get('month'); // 0-11 or 1-12
    const year = searchParams.get('year');
    const sort = searchParams.get('sort')?.trim() || 'default';

    const conditions: string[] = [];
    const params: any[] = [];

    // Filter akses berdasarkan peran: User biasa hanya melihat pekerjaannya sendiri
    if (auth.user.role === 'user') {
      conditions.push('t.owner_id = ?');
      params.push(auth.user.id);
    } else if (ownerIdParam && ownerIdParam !== 'all') {
      conditions.push('t.owner_id = ?');
      params.push(Number(ownerIdParam));
    }

    if (!includeDemo) {
      conditions.push('t.is_demo_eval = 0');
    }

    if (status !== 'all') {
      conditions.push('t.status = ?');
      params.push(status);
    }

    if (priority !== 'all') {
      conditions.push('t.priority = ?');
      params.push(priority);
    }

    if (category !== 'all') {
      conditions.push('t.category = ?');
      params.push(category);
    }

    if (search) {
      conditions.push('(LOWER(t.title) LIKE ? OR LOWER(t.code) LIKE ? OR LOWER(t.description) LIKE ? OR LOWER(u.full_name) LIKE ?)');
      const term = `%${search}%`;
      params.push(term, term, term, term);
    }

    if (year) {
      conditions.push('YEAR(t.deadline) = ?');
      params.push(Number(year));
    }

    if (month !== null && month !== undefined && month !== '') {
      const mNum = Number(month);
      if (!isNaN(mNum)) {
        // Standardize 1-12 month parameter (1=Jan, 12=Dec), clamp between 1 and 12
        const sqlMonth = Math.min(Math.max(Math.round(mNum), 1), 12);
        conditions.push('MONTH(t.deadline) = ?');
        params.push(sqlMonth);
      }
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    let orderByClause = `
      ORDER BY 
        CASE 
          WHEN t.status = 'Terlambat' THEN 1
          WHEN t.status = 'Dalam Proses' THEN 2
          WHEN t.status = 'Pending' THEN 3
          WHEN t.status = 'Belum Mulai' THEN 4
          WHEN t.status = 'Selesai' THEN 5
          ELSE 6
        END,
        t.deadline ASC
    `;

    if (sort === 'deadline_asc') {
      orderByClause = 'ORDER BY t.deadline ASC';
    } else if (sort === 'deadline_desc') {
      orderByClause = 'ORDER BY t.deadline DESC';
    } else if (sort === 'created_at_desc') {
      orderByClause = 'ORDER BY t.created_at DESC';
    } else if (sort === 'priority_desc') {
      orderByClause = `
        ORDER BY 
          CASE t.priority 
            WHEN 'Kritis' THEN 1 
            WHEN 'Tinggi' THEN 2 
            WHEN 'Menengah' THEN 3 
            WHEN 'Rendah' THEN 4 
            ELSE 5 
          END ASC, 
          t.deadline ASC
      `;
    }

    const sql = `
      SELECT 
        t.id, t.code, t.title, t.description, t.category, t.priority, t.status,
        t.owner_id, t.deadline, t.started_at, t.completed_at, t.evidence_url,
        t.evidence_photo_name, t.pending_reason, t.pending_requested_at,
        t.pending_approved, t.restart_history, t.is_demo_eval, t.created_at, t.updated_at,
        u.full_name AS owner_name,
        u.email AS owner_email,
        u.department AS owner_department,
        u.job_title AS owner_job_title,
        u.avatar_initials AS owner_avatar,
        (SELECT COUNT(*) FROM comments c WHERE c.task_id = t.id) AS comment_count
      FROM tasks t
      LEFT JOIN users u ON t.owner_id = u.id
      ${whereClause}
      ${orderByClause}
    `;

    const tasks = await query<Task>(sql, params);

    // Parse JSON restart_history jika berupa string
    const sanitizedTasks = tasks.map((task) => {
      let parsedHistory = task.restart_history;
      if (typeof task.restart_history === 'string') {
        try {
          parsedHistory = JSON.parse(task.restart_history);
        } catch {
          parsedHistory = [];
        }
      }
      return {
        ...task,
        restart_history: parsedHistory || [],
        pending_approved: Boolean(task.pending_approved),
        is_demo_eval: Boolean(task.is_demo_eval),
      };
    });

    return NextResponse.json({
      success: true,
      message: 'Daftar pekerjaan berhasil dimuat.',
      data: sanitizedTasks,
    });
  } catch (error) {
    console.error('Error saat mengambil daftar pekerjaan:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Terjadi kesalahan pada server saat mengambil data pekerjaan.',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAuth(request);
    if (auth.error) {
      return auth.error;
    }

    const body = await request.json();
    const { title, description, category, priority, deadline, status, owner_id } = body;

    if (!title || typeof title !== 'string' || !title.trim()) {
      return NextResponse.json(
        {
          success: false,
          message: 'Judul pekerjaan wajib diisi.',
        },
        { status: 400 }
      );
    }

    if (!deadline || isNaN(new Date(deadline).getTime())) {
      return NextResponse.json(
        {
          success: false,
          message: 'Tenggat waktu (deadline) pekerjaan wajib ditentukan dengan format valid.',
        },
        { status: 400 }
      );
    }

    const cleanTitle = title.trim();
    const cleanDesc = description ? String(description).trim() : null;
    const cleanCat = (category && String(category).trim()) || 'Operasional';
    const cleanPriority: TaskPriority = ['Kritis', 'Tinggi', 'Menengah', 'Rendah'].includes(priority)
      ? priority
      : 'Menengah';
    const cleanStatus: TaskStatus = ['Belum Mulai', 'Dalam Proses', 'Pending', 'Selesai', 'Terlambat'].includes(status)
      ? status
      : 'Belum Mulai';

    // Penentuan owner: jika user biasa, selalu tetapkan ke id user tersebut.
    // Jika admin, bisa memilih owner_id lain atau default dirinya.
    let targetOwnerId = auth.user.id;
    if (auth.user.role === 'admin' && owner_id) {
      const ownerExists = await queryOne('SELECT id FROM users WHERE id = ?', [Number(owner_id)]);
      if (ownerExists) {
        targetOwnerId = Number(owner_id);
      }
    }

    const startedAt = cleanStatus === 'Dalam Proses' ? new Date() : null;

    const result = await transaction(async (conn) => {
      // Cari kode pekerjaan tertinggi untuk penomoran otomatis yang berurutan
      const [maxCodeRow] = (await conn.query(
        "SELECT code FROM tasks WHERE code LIKE 'MM-%' ORDER BY LENGTH(code) DESC, code DESC LIMIT 1 FOR UPDATE"
      )) as any;

      let nextNumber = 1;
      if (maxCodeRow && maxCodeRow[0]?.code) {
        const match = String(maxCodeRow[0].code).match(/MM-(\d+)/);
        if (match) {
          nextNumber = parseInt(match[1], 10) + 1;
        }
      }
      const code = `MM-${String(nextNumber).padStart(4, '0')}`;

      const [insertResult] = (await conn.execute(
        `INSERT INTO tasks (code, title, description, category, priority, status, owner_id, deadline, started_at, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [code, cleanTitle, cleanDesc, cleanCat, cleanPriority, cleanStatus, targetOwnerId, deadline, startedAt]
      )) as any;

      const taskId = insertResult.insertId;

      // Buat notifikasi bahwa pekerjaan baru telah dibuat
      await conn.execute(
        `INSERT INTO notifications (user_id, level, title, body, task_id, is_read, created_at)
         VALUES (NULL, 'Informasi', 'Pekerjaan baru dibuat', ?, ?, 0, NOW())`,
        [`${auth.user.full_name} membuat pekerjaan baru: "${cleanTitle}".`, taskId]
      );

      return { taskId, code };
    });

    const createdTask = await queryOne<Task>(
      `SELECT t.*, u.full_name as owner_name, u.email as owner_email, u.department as owner_department
       FROM tasks t
       LEFT JOIN users u ON t.owner_id = u.id
       WHERE t.id = ?`,
      [result.taskId]
    );

    return NextResponse.json(
      {
        success: true,
        message: 'Pekerjaan baru berhasil dibuat.',
        data: createdTask,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error saat membuat pekerjaan:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Terjadi kesalahan pada server saat membuat pekerjaan.',
      },
      { status: 500 }
    );
  }
}
