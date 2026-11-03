import { NextResponse } from 'next/server';
import { requireAuth, requireAdmin } from '@/lib/auth';
import { query, queryOne, execute, transaction } from '@/lib/db';
import { Action, ActionStatus } from '@/types/database';

export async function GET(request: Request) {
  try {
    const auth = await requireAuth(request);
    if (auth.error) {
      return auth.error;
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending';

    const conditions: string[] = [];
    const params: any[] = [];

    // Jika user biasa, hanya tampilkan permohonan yang diajukan oleh user tersebut
    if (auth.user.role === 'user') {
      conditions.push('a.user_id = ?');
      params.push(auth.user.id);
    }

    if (status !== 'all') {
      conditions.push('a.status = ?');
      params.push(status);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const sql = `
      SELECT 
        a.id, a.task_id, a.user_id, a.level, a.type, a.title, a.body,
        a.previous_status, a.status, a.decision_notes, a.created_at, a.resolved_at,
        u.full_name AS user_name,
        u.email AS user_email,
        t.title AS task_title,
        t.code AS task_code
      FROM actions a
      LEFT JOIN users u ON a.user_id = u.id
      LEFT JOIN tasks t ON a.task_id = t.id
      ${whereClause}
      ORDER BY a.created_at DESC
    `;

    const actions = await query<Action>(sql, params);

    return NextResponse.json({
      success: true,
      message: 'Daftar tindakan persetujuan berhasil dimuat.',
      data: actions,
    });
  } catch (error) {
    console.error('Error saat mengambil daftar tindakan:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Terjadi kesalahan pada server saat memuat data tindakan.',
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  return POST(request);
}

export async function POST(request: Request) {
  try {
    const auth = await requireAuth(request);
    if (auth.error) {
      return auth.error;
    }

    const body = await request.json();

    // Skenario 1: Super Admin mengambil keputusan atas suatu tindakan (approve / reject)
    if (body.actionId || (body.id && body.decision)) {
      if (auth.user.role !== 'admin') {
        return NextResponse.json(
          {
            success: false,
            message: 'Akses ditolak. Hanya Super Admin yang berwenang mengambil keputusan.',
          },
          { status: 403 }
        );
      }

      const targetId = Number(body.actionId || body.id);
      const decision: 'approve' | 'reject' = body.decision;
      const notes = body.notes ? String(body.notes).trim() : null;

      if (!['approve', 'reject'].includes(decision)) {
        return NextResponse.json(
          {
            success: false,
            message: 'Keputusan tidak valid. Pilihan yang tersedia adalah setujui (approve) atau tolak (reject).',
          },
          { status: 400 }
        );
      }

      const actionItem = await queryOne<Action>('SELECT * FROM actions WHERE id = ?', [targetId]);
      if (!actionItem) {
        return NextResponse.json(
          {
            success: false,
            message: 'Permintaan tindakan tidak ditemukan.',
          },
          { status: 404 }
        );
      }

      const newStatus: ActionStatus = decision === 'approve' ? 'approved' : 'rejected';
      const decisionText = decision === 'approve' ? 'disetujui' : 'ditolak';

      await transaction(async (conn) => {
        // Update tabel actions
        await conn.execute(
          `UPDATE actions SET status = ?, decision_notes = ?, resolved_at = NOW() WHERE id = ?`,
          [newStatus, notes, targetId]
        );

        // Jika tindakan terkait status Pending pada tugas
        if (actionItem.task_id && actionItem.type === 'pending_request') {
          if (decision === 'approve') {
            await conn.execute(
              `UPDATE tasks SET status = 'Pending', pending_approved = 1, updated_at = NOW() WHERE id = ?`,
              [actionItem.task_id]
            );
          } else {
            const fallbackStatus = actionItem.previous_status || 'Dalam Proses';
            await conn.execute(
              `UPDATE tasks SET status = ?, pending_approved = 0, updated_at = NOW() WHERE id = ?`,
              [fallbackStatus, actionItem.task_id]
            );
          }
        }

        // Jika tindakan terkait pendaftaran pengguna baru
        if (actionItem.user_id && actionItem.type === 'registration_approval') {
          const userStatus = decision === 'approve' ? 'active' : 'rejected';
          await conn.execute(`UPDATE users SET status = ?, updated_at = NOW() WHERE id = ?`, [
            userStatus,
            actionItem.user_id,
          ]);
        }

        // Kirim notifikasi hasil keputusan kepada pengaju
        await conn.execute(
          `INSERT INTO notifications (user_id, level, title, body, task_id, is_read, created_at)
           VALUES (?, 'Informasi', ?, ?, ?, 0, NOW())`,
          [
            actionItem.user_id,
            `Permintaan ${decisionText}`,
            `Permintaan "${actionItem.title}" telah ${decisionText} oleh Super Admin.${notes ? ` Catatan: ${notes}` : ''}`,
            actionItem.task_id,
          ]
        );
      });

      return NextResponse.json({
        success: true,
        message: `Permintaan berhasil ${decisionText}.`,
      });
    }

    // Skenario 2: Mengajukan tindakan baru
    const { task_id, type, title, body: actionBody, level, previous_status } = body;

    if (!title || !actionBody) {
      return NextResponse.json(
        {
          success: false,
          message: 'Judul dan rincian tindakan wajib diisi.',
        },
        { status: 400 }
      );
    }

    const actionType = type || 'general_request';
    const actionLevel = ['Kritis', 'Penting', 'Informasi'].includes(level) ? level : 'Penting';

    const insertResult = await execute(
      `INSERT INTO actions (task_id, user_id, level, type, title, body, previous_status, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', NOW())`,
      [
        task_id ? Number(task_id) : null,
        auth.user.id,
        actionLevel,
        actionType,
        String(title).trim(),
        String(actionBody).trim(),
        previous_status || null,
      ]
    );

    // Notifikasi untuk Super Admin
    await execute(
      `INSERT INTO notifications (user_id, level, title, body, task_id, is_read, created_at)
       VALUES (NULL, ?, 'Permintaan baru butuh keputusan', ?, ?, 0, NOW())`,
      [actionLevel, `${auth.user.full_name}: ${title}`, task_id ? Number(task_id) : null]
    );

    return NextResponse.json(
      {
        success: true,
        message: 'Permintaan tindakan berhasil diajukan.',
        data: { id: insertResult.insertId },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error saat memproses tindakan:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Terjadi kesalahan pada server saat memproses data tindakan.',
      },
      { status: 500 }
    );
  }
}
