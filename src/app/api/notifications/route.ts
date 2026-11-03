import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { query, queryOne, execute } from '@/lib/db';
import { Notification } from '@/types/database';

export async function GET(request: Request) {
  try {
    const auth = await requireAuth(request);
    if (auth.error) {
      return auth.error;
    }

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter') || 'all';

    const conditions: string[] = [];
    const params: any[] = [];

    // Filter notifikasi sesuai pengguna: notifikasi pribadi atau siaran umum (user_id IS NULL)
    conditions.push('(n.user_id = ? OR n.user_id IS NULL)');
    params.push(auth.user.id);

    if (filter === 'unread') {
      conditions.push('n.is_read = 0');
    } else if (['Kritis', 'Penting', 'Informasi'].includes(filter)) {
      conditions.push('n.level = ?');
      params.push(filter);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    const notifications = await query<Notification>(
      `SELECT n.id, n.user_id, n.level, n.title, n.body, n.task_id, n.is_read, n.created_at
       FROM notifications n
       ${whereClause}
       ORDER BY n.created_at DESC
       LIMIT 50`,
      params
    );

    // Hitung total notifikasi belum dibaca
    const unreadRow = await queryOne<{ unread_count: number }>(
      `SELECT COUNT(*) AS unread_count 
       FROM notifications 
       WHERE (user_id = ? OR user_id IS NULL) AND is_read = 0`,
      [auth.user.id]
    );

    const sanitized = notifications.map((n) => ({
      ...n,
      is_read: Boolean(n.is_read),
    }));

    return NextResponse.json({
      success: true,
      message: 'Notifikasi berhasil dimuat.',
      data: {
        notifications: sanitized,
        unreadCount: unreadRow?.unread_count || 0,
      },
    });
  } catch (error) {
    console.error('Error saat mengambil notifikasi:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Terjadi kesalahan pada server saat memuat notifikasi.',
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = await requireAuth(request);
    if (auth.error) {
      return auth.error;
    }

    const body = await request.json();
    const { id, mark_all_read } = body;

    if (mark_all_read) {
      await execute(
        `UPDATE notifications SET is_read = 1 WHERE (user_id = ? OR user_id IS NULL) AND is_read = 0`,
        [auth.user.id]
      );
      return NextResponse.json({
        success: true,
        message: 'Semua notifikasi berhasil ditandai sebagai telah dibaca.',
      });
    }

    if (id) {
      const notifId = Number(id);
      await execute(
        `UPDATE notifications SET is_read = 1 WHERE id = ? AND (user_id = ? OR user_id IS NULL)`,
        [notifId, auth.user.id]
      );
      return NextResponse.json({
        success: true,
        message: 'Notifikasi berhasil ditandai sebagai telah dibaca.',
      });
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Parameter id atau mark_all_read wajib disertakan.',
      },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error saat memperbarui status notifikasi:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Terjadi kesalahan pada server saat memperbarui notifikasi.',
      },
      { status: 500 }
    );
  }
}
