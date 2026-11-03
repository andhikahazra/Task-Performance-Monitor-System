import { NextResponse } from 'next/server';
import { requireAuth, comparePassword, hashPassword } from '@/lib/auth';
import { queryOne, execute } from '@/lib/db';
import { User } from '@/types/database';

export async function POST(request: Request) {
  try {
    const auth = await requireAuth(request);
    if (auth.error) {
      return auth.error;
    }

    const body = await request.json();
    const { current_password, new_password, confirm_password } = body;

    if (!current_password || !new_password) {
      return NextResponse.json(
        {
          success: false,
          message: 'Password saat ini dan password baru wajib diisi.',
        },
        { status: 400 }
      );
    }

    if (String(new_password).length < 6) {
      return NextResponse.json(
        {
          success: false,
          message: 'Password baru minimal harus terdiri dari 6 karakter.',
        },
        { status: 400 }
      );
    }

    if (confirm_password && new_password !== confirm_password) {
      return NextResponse.json(
        {
          success: false,
          message: 'Konfirmasi password baru tidak cocok.',
        },
        { status: 400 }
      );
    }

    const user = await queryOne<User>('SELECT id, password_hash FROM users WHERE id = ?', [auth.user.id]);
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: 'Pengguna tidak ditemukan dalam sistem.',
        },
        { status: 404 }
      );
    }

    const isMatch = await comparePassword(String(current_password), user.password_hash);
    if (!isMatch) {
      return NextResponse.json(
        {
          success: false,
          message: 'Password saat ini tidak sesuai.',
        },
        { status: 400 }
      );
    }

    const newHash = await hashPassword(String(new_password));
    await execute('UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?', [newHash, auth.user.id]);

    return NextResponse.json({
      success: true,
      message: 'Password berhasil diperbarui.',
    });
  } catch (error) {
    console.error('Error saat mengubah password:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Terjadi kesalahan pada server saat memperbarui password.',
      },
      { status: 500 }
    );
  }
}
