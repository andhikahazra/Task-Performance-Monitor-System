import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { query, queryOne, execute, transaction } from '@/lib/db';
import { Comment, Task } from '@/types/database';

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

    const task = await queryOne<Task>('SELECT id, owner_id FROM tasks WHERE id = ?', [taskId]);
    if (!task) {
      return NextResponse.json(
        {
          success: false,
          message: 'Pekerjaan tidak ditemukan.',
        },
        { status: 404 }
      );
    }

    if (auth.user.role === 'user' && task.owner_id !== auth.user.id) {
      return NextResponse.json(
        {
          success: false,
          message: 'Akses ditolak. Anda hanya dapat melihat diskusi pada pekerjaan milik sendiri.',
        },
        { status: 403 }
      );
    }

    const comments = await query<Comment>(
      `SELECT 
        c.id, c.task_id, c.user_id, c.parent_id, c.text, c.created_at,
        u.full_name AS author_name,
        u.email AS author_email,
        u.role AS author_role,
        u.avatar_initials AS author_avatar
      FROM comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.task_id = ?
      ORDER BY c.created_at ASC`,
      [taskId]
    );

    return NextResponse.json({
      success: true,
      message: 'Komentar berhasil dimuat.',
      data: comments,
    });
  } catch (error) {
    console.error('Error saat mengambil komentar:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Terjadi kesalahan pada server saat memuat komentar.',
      },
      { status: 500 }
    );
  }
}

export async function POST(
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

    if (auth.user.role === 'user' && task.owner_id !== auth.user.id) {
      return NextResponse.json(
        {
          success: false,
          message: 'Akses ditolak. Anda hanya dapat memberi komentar pada pekerjaan milik sendiri.',
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { text, parent_id } = body;

    if (!text || typeof text !== 'string' || !text.trim()) {
      return NextResponse.json(
        {
          success: false,
          message: 'Isi komentar tidak boleh kosong.',
        },
        { status: 400 }
      );
    }

    const cleanText = text.trim();
    const cleanParentId = parent_id ? Number(parent_id) : null;

    if (cleanParentId) {
      const parentComment = await queryOne(
        'SELECT id FROM comments WHERE id = ? AND task_id = ?',
        [cleanParentId, taskId]
      );
      if (!parentComment) {
        return NextResponse.json(
          {
            success: false,
            message: 'Komentar induk tidak ditemukan pada tugas ini.',
          },
          { status: 400 }
        );
      }
    }

    const newCommentId = await transaction(async (conn) => {
      const [insertResult] = (await conn.execute(
        `INSERT INTO comments (task_id, user_id, parent_id, text, created_at)
         VALUES (?, ?, ?, ?, NOW())`,
        [taskId, auth.user.id, cleanParentId, cleanText]
      )) as any;

      const commentId = insertResult.insertId;

      // Notifikasi penerima komentar
      // Jika yang berkomentar adalah admin, beri tahu pemilik tugas
      // Jika yang berkomentar adalah user biasa, beri tahu admin (user_id = NULL)
      const recipientId = auth.user.role === 'admin' ? task.owner_id : null;

      await conn.execute(
        `INSERT INTO notifications (user_id, level, title, body, task_id, is_read, created_at)
         VALUES (?, 'Informasi', 'Komentar baru pada pekerjaan', ?, ?, 0, NOW())`,
        [
          recipientId,
          `${auth.user.full_name}: "${cleanText.slice(0, 80)}${cleanText.length > 80 ? '...' : ''}" pada "${task.title}".`,
          taskId,
        ]
      );

      return commentId;
    });

    const createdComment = await queryOne<Comment>(
      `SELECT 
        c.id, c.task_id, c.user_id, c.parent_id, c.text, c.created_at,
        u.full_name AS author_name,
        u.email AS author_email,
        u.role AS author_role,
        u.avatar_initials AS author_avatar
      FROM comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.id = ?`,
      [newCommentId]
    );

    return NextResponse.json(
      {
        success: true,
        message: 'Komentar berhasil ditambahkan.',
        data: createdComment,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error saat menambahkan komentar:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Terjadi kesalahan pada server saat menambahkan komentar.',
      },
      { status: 500 }
    );
  }
}
