import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { queryOne } from '@/lib/db';
import { SafeUser } from '@/types/database';

export async function GET(request: Request) {
  try {
    const auth = await requireAuth(request);
    if (auth.error) {
      return auth.error;
    }

    const user = await queryOne<SafeUser>(
      `SELECT id, full_name, email, department, job_title, role, status, avatar_initials, last_activity_at, created_at, updated_at
       FROM users
       WHERE id = ?`,
      [auth.user.id]
    );

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: 'Pengguna tidak ditemukan dalam sistem.',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Data sesi pengguna berhasil dimuat.',
      data: {
        user,
      },
    });
  } catch (error) {
    console.error('Error saat mengambil sesi pengguna:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Terjadi kesalahan pada server saat mengambil data pengguna.',
      },
      { status: 500 }
    );
  }
}
