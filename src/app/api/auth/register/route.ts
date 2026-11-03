import { NextResponse } from 'next/server';
import { queryOne, execute, transaction } from '@/lib/db';
import { hashPassword, createAvatarInitials } from '@/lib/auth';
import { User } from '@/types/database';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { full_name, email, password, department, job_title } = body;

    if (!full_name || typeof full_name !== 'string' || !full_name.trim()) {
      return NextResponse.json(
        {
          success: false,
          message: 'Nama lengkap wajib diisi.',
        },
        { status: 400 }
      );
    }

    if (full_name.trim().length > 100) {
      return NextResponse.json(
        {
          success: false,
          message: 'Nama lengkap tidak boleh lebih dari 100 karakter.',
        },
        { status: 400 }
      );
    }

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        {
          success: false,
          message: 'Format email tidak valid.',
        },
        { status: 400 }
      );
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return NextResponse.json(
        {
          success: false,
          message: 'Password wajib diisi dan memiliki panjang minimal 6 karakter.',
        },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = full_name.trim();
    const cleanDept = (department && String(department).trim()) || 'Operasional';
    const cleanTitle = (job_title && String(job_title).trim()) || 'Staf';

    const existingUser = await queryOne<User>('SELECT id FROM users WHERE email = ?', [cleanEmail]);
    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          message: 'Alamat email sudah terdaftar dalam sistem.',
        },
        { status: 409 }
      );
    }

    const hashedPassword = await hashPassword(password);
    const initials = createAvatarInitials(cleanName);

    // Jalankan dalam transaksi agar user, tindakan persetujuan, dan notifikasi konsisten
    const newUserId = await transaction(async (conn) => {
      const [insertUser] = await conn.execute(
        `INSERT INTO users (full_name, email, password_hash, department, job_title, role, status, avatar_initials, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, 'user', 'pending', ?, NOW(), NOW())`,
        [cleanName, cleanEmail, hashedPassword, cleanDept, cleanTitle, initials]
      ) as any;

      const userId = insertUser.insertId;

      // Buat permintaan persetujuan untuk Super Admin di tabel actions
      await conn.execute(
        `INSERT INTO actions (user_id, level, type, title, body, status, created_at)
         VALUES (?, 'Penting', 'registration_approval', ?, ?, 'pending', NOW())`,
        [
          userId,
          `Persetujuan Pendaftaran: ${cleanName}`,
          `Pengguna baru ${cleanName} (${cleanEmail}) mendaftar untuk departemen ${cleanDept} sebagai ${cleanTitle}.`,
        ]
      );

      // Buat notifikasi siaran untuk Super Admin
      await conn.execute(
        `INSERT INTO notifications (user_id, level, title, body, is_read, created_at)
         VALUES (NULL, 'Penting', 'Pendaftaran akun baru', ?, 0, NOW())`,
        [`${cleanName} mengajukan permohonan akun baru untuk departemen ${cleanDept}.`]
      );

      return userId;
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Pendaftaran berhasil dikirim. Akun Anda sedang menunggu persetujuan dari Super Admin.',
        data: {
          id: newUserId,
          full_name: cleanName,
          email: cleanEmail,
          status: 'pending',
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error saat registrasi:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Terjadi kesalahan pada server saat memproses pendaftaran.',
      },
      { status: 500 }
    );
  }
}
