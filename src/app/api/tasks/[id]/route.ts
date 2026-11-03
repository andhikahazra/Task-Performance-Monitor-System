import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { queryOne, execute, transaction } from '@/lib/db';
import { Task, TaskRestartHistoryItem } from '@/types/database';

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(request);
    if (auth.error) {
      return auth.error;
    }

    const { id } = await context.params;
    const taskId = Number(id);

    if (isNaN(taskId)) {
      return NextResponse.json(
        {
          success: false,
          message: 'ID pekerjaan tidak valid.',
        },
        { status: 400 }
      );
    }

    const task = await queryOne<Task>(
      `SELECT 
        t.*,
        u.full_name AS owner_name,
        u.email AS owner_email,
        u.department AS owner_department,
        u.job_title AS owner_job_title,
        u.avatar_initials AS owner_avatar,
        (SELECT COUNT(*) FROM comments c WHERE c.task_id = t.id) AS comment_count
      FROM tasks t
      LEFT JOIN users u ON t.owner_id = u.id
      WHERE t.id = ?`,
      [taskId]
    );

    if (!task) {
      return NextResponse.json(
        {
          success: false,
          message: 'Pekerjaan tidak ditemukan.',
        },
        { status: 404 }
      );
    }

    // Pembatasan akses jika role user biasa
    if (auth.user.role === 'user' && task.owner_id !== auth.user.id) {
      return NextResponse.json(
        {
          success: false,
          message: 'Akses ditolak. Anda hanya dapat melihat rincian pekerjaan milik sendiri.',
        },
        { status: 403 }
      );
    }

    let parsedHistory = task.restart_history;
    if (typeof task.restart_history === 'string') {
      try {
        parsedHistory = JSON.parse(task.restart_history);
      } catch {
        parsedHistory = [];
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Detail pekerjaan berhasil dimuat.',
      data: {
        ...task,
        restart_history: parsedHistory || [],
        pending_approved: Boolean(task.pending_approved),
        is_demo_eval: Boolean(task.is_demo_eval),
      },
    });
  } catch (error) {
    console.error('Error saat mengambil detail pekerjaan:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Terjadi kesalahan pada server saat memuat rincian pekerjaan.',
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(request);
    if (auth.error) {
      return auth.error;
    }

    const { id } = await context.params;
    const taskId = Number(id);

    if (isNaN(taskId)) {
      return NextResponse.json(
        {
          success: false,
          message: 'ID pekerjaan tidak valid.',
        },
        { status: 400 }
      );
    }

    const currentTask = await queryOne<Task>('SELECT * FROM tasks WHERE id = ?', [taskId]);
    if (!currentTask) {
      return NextResponse.json(
        {
          success: false,
          message: 'Pekerjaan tidak ditemukan.',
        },
        { status: 404 }
      );
    }

    // Validasi izin edit: user biasa hanya boleh mengedit miliknya
    if (auth.user.role === 'user' && currentTask.owner_id !== auth.user.id) {
      return NextResponse.json(
        {
          success: false,
          message: 'Akses ditolak. Anda hanya dapat memperbarui pekerjaan milik sendiri.',
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      title,
      description,
      category,
      priority,
      status: nextStatus,
      deadline,
      evidence_url,
      evidence_photo_name,
      pending_reason,
      owner_id,
    } = body;

    if (deadline && isNaN(new Date(deadline).getTime())) {
      return NextResponse.json(
        {
          success: false,
          message: 'Format tenggat waktu (deadline) tidak valid.',
        },
        { status: 400 }
      );
    }

    let targetStatus = nextStatus || currentTask.status;
    let targetDeadline =
      auth.user.role === 'admin' && deadline ? deadline : currentTask.deadline;
    let targetEvidenceUrl = evidence_url !== undefined ? evidence_url : currentTask.evidence_url;
    let targetEvidencePhoto =
      evidence_photo_name !== undefined ? evidence_photo_name : currentTask.evidence_photo_name;
    let targetPendingReason =
      pending_reason !== undefined ? pending_reason : currentTask.pending_reason;
    let startedAt = currentTask.started_at;
    let completedAt = currentTask.completed_at;
    let pendingApproved = currentTask.pending_approved;
    let pendingRequestedAt = currentTask.pending_requested_at;

    let existingHistory: TaskRestartHistoryItem[] = [];
    if (currentTask.restart_history) {
      if (typeof currentTask.restart_history === 'string') {
        try {
          existingHistory = JSON.parse(currentTask.restart_history);
        } catch {
          existingHistory = [];
        }
      } else if (Array.isArray(currentTask.restart_history)) {
        existingHistory = currentTask.restart_history;
      }
    }

    // Aturan Alur Status:
    // 1. Selesai: Wajib ada tautan atau foto bukti
    if (targetStatus === 'Selesai') {
      const hasUrl = targetEvidenceUrl && String(targetEvidenceUrl).trim().length > 0;
      const hasPhoto = targetEvidencePhoto && String(targetEvidencePhoto).trim().length > 0;
      if (!hasUrl && !hasPhoto) {
        return NextResponse.json(
          {
            success: false,
            message: 'Pekerjaan tidak dapat diselesaikan sebelum bukti berupa tautan atau foto ditambahkan.',
          },
          { status: 400 }
        );
      }
      completedAt = new Date();
    } else if (currentTask.status === 'Selesai' && targetStatus !== 'Selesai') {
      completedAt = null;
    }

    // 2. Pending: jika diajukan oleh User biasa, buat Action dan Notifikasi untuk Super Admin
    let actionCreated = false;
    if (targetStatus === 'Pending') {
      if (!targetPendingReason || !String(targetPendingReason).trim()) {
        return NextResponse.json(
          {
            success: false,
            message: 'Alasan pengajuan status Pending wajib diisi.',
          },
          { status: 400 }
        );
      }

      pendingRequestedAt = new Date();
      if (auth.user.role === 'user') {
        pendingApproved = 0;
        actionCreated = true;
        // Status tetap pada status saat ini sampai disetujui Super Admin
        targetStatus = currentTask.status;
      } else {
        pendingApproved = 1;
      }
    }

    // 3. Mulai Ulang / Kembali ke Dalam Proses dari Pending, Selesai, atau Terlambat
    if (
      targetStatus === 'Dalam Proses' &&
      ['Pending', 'Selesai', 'Terlambat'].includes(currentTask.status)
    ) {
      existingHistory.push({
        previousStatus: currentTask.status,
        at: new Date().toISOString(),
        newDeadline: targetDeadline ? String(targetDeadline) : undefined,
        note: `Status diaktifkan kembali dari ${currentTask.status}`,
      });
      targetPendingReason = null;
      pendingApproved = 0;
      pendingRequestedAt = null;
    }

    if (targetStatus === 'Dalam Proses' && !startedAt) {
      startedAt = new Date();
    }

    // Jalankan pembaruan data dalam transaksi
    await transaction(async (conn) => {
      await conn.execute(
        `UPDATE tasks SET
          title = COALESCE(?, title),
          description = ?,
          category = COALESCE(?, category),
          priority = COALESCE(?, priority),
          status = ?,
          owner_id = COALESCE(?, owner_id),
          deadline = ?,
          started_at = ?,
          completed_at = ?,
          evidence_url = ?,
          evidence_photo_name = ?,
          pending_reason = ?,
          pending_requested_at = ?,
          pending_approved = ?,
          restart_history = ?,
          updated_at = NOW()
        WHERE id = ?`,
        [
          auth.user.role === 'admin' ? title || null : null,
          auth.user.role === 'admin' && description !== undefined
            ? (description || null)
            : currentTask.description,
          auth.user.role === 'admin' ? category || null : null,
          auth.user.role === 'admin' ? priority || null : null,
          targetStatus,
          auth.user.role === 'admin' && owner_id ? Number(owner_id) : null,
          targetDeadline,
          startedAt,
          completedAt,
          targetEvidenceUrl,
          targetEvidencePhoto,
          targetPendingReason,
          pendingRequestedAt,
          pendingApproved ? 1 : 0,
          JSON.stringify(existingHistory),
          taskId,
        ]
      );

      // Jika ada pengajuan Pending oleh User, catat ke tabel actions dan kirim notifikasi
      if (actionCreated) {
        await conn.execute(
          `INSERT INTO actions (task_id, user_id, level, type, title, body, previous_status, status, created_at)
           VALUES (?, ?, 'Penting', 'pending_request', ?, ?, ?, 'pending', NOW())`,
          [
            taskId,
            auth.user.id,
            `Permintaan Pending: ${currentTask.title}`,
            `Alasan: ${targetPendingReason}`,
            currentTask.status,
          ]
        );

        await conn.execute(
          `INSERT INTO notifications (user_id, level, title, body, task_id, is_read, created_at)
           VALUES (NULL, 'Penting', 'Permintaan Pending menunggu persetujuan', ?, ?, 0, NOW())`,
          [`${auth.user.full_name} mengajukan status Pending untuk "${currentTask.title}": ${targetPendingReason}`, taskId]
        );
      } else if (targetStatus !== currentTask.status) {
        // Notifikasi pembaruan status
        await conn.execute(
          `INSERT INTO notifications (user_id, level, title, body, task_id, is_read, created_at)
           VALUES (NULL, 'Informasi', 'Status pekerjaan diperbarui', ?, ?, 0, NOW())`,
          [`${currentTask.title} berubah status menjadi "${targetStatus}".`, taskId]
        );
      }
    });

    const updated = await queryOne<Task>(
      `SELECT t.*, u.full_name AS owner_name, u.email AS owner_email, u.department AS owner_department
       FROM tasks t
       LEFT JOIN users u ON t.owner_id = u.id
       WHERE t.id = ?`,
      [taskId]
    );

    return NextResponse.json({
      success: true,
      message:
        targetStatus === 'Pending' && auth.user.role === 'user'
          ? 'Permintaan status Pending berhasil dikirim dan menunggu persetujuan Super Admin.'
          : targetStatus === 'Selesai'
          ? 'Pekerjaan berhasil diselesaikan dan bukti tercatat.'
          : 'Pekerjaan berhasil diperbarui.',
      data: updated,
    });
  } catch (error) {
    console.error('Error saat memperbarui pekerjaan:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Terjadi kesalahan pada server saat memperbarui pekerjaan.',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(request);
    if (auth.error) {
      return auth.error;
    }

    const { id } = await context.params;
    const taskId = Number(id);

    if (isNaN(taskId)) {
      return NextResponse.json(
        {
          success: false,
          message: 'ID pekerjaan tidak valid.',
        },
        { status: 400 }
      );
    }

    const task = await queryOne<Task>('SELECT id, title, owner_id FROM tasks WHERE id = ?', [taskId]);
    if (!task) {
      return NextResponse.json(
        {
          success: false,
          message: 'Pekerjaan tidak ditemukan.',
        },
        { status: 404 }
      );
    }

    // Hanya Super Admin atau pemilik tugas yang boleh menghapus
    if (auth.user.role !== 'admin' && task.owner_id !== auth.user.id) {
      return NextResponse.json(
        {
          success: false,
          message: 'Akses ditolak. Anda tidak memiliki izin untuk menghapus pekerjaan ini.',
        },
        { status: 403 }
      );
    }

    await execute('DELETE FROM tasks WHERE id = ?', [taskId]);

    return NextResponse.json({
      success: true,
      message: 'Pekerjaan berhasil dihapus dari sistem.',
    });
  } catch (error) {
    console.error('Error saat menghapus pekerjaan:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Terjadi kesalahan pada server saat menghapus pekerjaan.',
      },
      { status: 500 }
    );
  }
}
