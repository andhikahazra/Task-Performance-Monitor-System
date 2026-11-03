import { NextResponse } from 'next/server';
import { queryOne, execute } from '@/lib/db';
import { comparePassword, signToken, setAuthCookie } from '@/lib/auth';
import { User, SafeUser } from '@/types/database';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          message: 'Email dan password wajib diisi.',
        },
        { status: 400 }
      );
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const user = await queryOne<User>(
      'SELECT id, full_name, email, password_hash, department, job_title, role, status, avatar_initials, last_activity_at, created_at, updated_at FROM users WHERE email = ?',
      [cleanEmail]
    );

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: 'Email atau password tidak sesuai.',
        },
        { status: 401 }
      );
    }

    if (user.status === 'rejected') {
      return NextResponse.json(
        {
          success: false,
          message: 'Akun Anda telah ditolak oleh administrator. Hubungi Super Admin untuk bantuan.',
        },
        { status: 403 }
      );
    }

    if (user.status === 'pending') {
      return NextResponse.json(
        {
          success: false,
          message: 'Akun Anda masih menunggu persetujuan dari Super Admin.',
        },
        { status: 403 }
      );
    }

    const passwordMatches = await comparePassword(String(password), user.password_hash);
    if (!passwordMatches) {
      return NextResponse.json(
        {
          success: false,
          message: 'Email atau password tidak sesuai.',
        },
        { status: 401 }
      );
    }

    // Perbarui waktu aktivitas terakhir
    await execute('UPDATE users SET last_activity_at = NOW() WHERE id = ?', [user.id]);

    const token = await signToken({
      id: user.id,
      email: user.email,
      role: user.role,
      full_name: user.full_name,
      department: user.department,
    });

    const safeUser: SafeUser = {
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      department: user.department,
      job_title: user.job_title,
      role: user.role,
      status: user.status,
      avatar_initials: user.avatar_initials,
      last_activity_at: user.last_activity_at,
      created_at: user.created_at,
      updated_at: user.updated_at,
    };

    const response = NextResponse.json({
      success: true,
      message: 'Berhasil masuk ke sistem.',
      data: {
        user: safeUser,
        token,
      },
    });

    setAuthCookie(response, token);
    return response;
  } catch (error) {
    console.error('Error saat login:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Terjadi kesalahan pada server saat memproses login.',
      },
      { status: 500 }
    );
  }
}
