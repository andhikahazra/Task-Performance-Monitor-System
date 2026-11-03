import { NextResponse } from 'next/server';
import { requireAuth, requireAdmin, hashPassword, createAvatarInitials } from '@/lib/auth';
import { query, queryOne, execute, transaction } from '@/lib/db';
import { SafeUser, User, UserRole, UserStatus } from '@/types/database';

export async function GET(request: Request) {
  try {
    const auth = await requireAuth(request);
    if (auth.error) {
      return auth.error;
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.trim().toLowerCase() || '';
    const department = searchParams.get('department') || 'all';
    const role = searchParams.get('role') || 'all';
    const status = searchParams.get('status') || (auth.user.role === 'admin' ? 'all' : 'active');

    const conditions: string[] = [];
    const params: any[] = [];

    // Jika pengguna bukan admin, batasi hanya melihat pengguna yang aktif
    if (auth.user.role !== 'admin') {
      conditions.push("u.status = 'active'");
    } else if (status !== 'all') {
      conditions.push('u.status = ?');
      params.push(status);
    }

    if (department !== 'all') {
      conditions.push('u.department = ?');
      params.push(department);
    }

    if (role !== 'all') {
      conditions.push('u.role = ?');
      params.push(role);
    }

    if (search) {
      conditions.push('(LOWER(u.full_name) LIKE ? OR LOWER(u.email) LIKE ? OR LOWER(u.department) LIKE ?)');
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const users = await query<SafeUser>(
      `SELECT 
        u.id, u.full_name, u.email, u.department, u.job_title, u.role, u.status,
        u.avatar_initials, u.last_activity_at, u.created_at, u.updated_at,
        (SELECT COUNT(*) FROM tasks t WHERE t.owner_id = u.id AND t.is_demo_eval = 0) AS total_tasks,
        (SELECT COUNT(*) FROM tasks t WHERE t.owner_id = u.id AND t.status = 'Selesai' AND t.is_demo_eval = 0) AS completed_tasks
      FROM users u
      ${whereClause}
      ORDER BY 
        CASE WHEN u.status = 'pending' THEN 1 ELSE 2 END,
        u.full_name ASC`,
      params
    );

    return NextResponse.json({
      success: true,
      message: 'Daftar pengguna berhasil dimuat.',
      data: users,
    });
  } catch (error) {
    console.error('Error saat mengambil daftar pengguna:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Terjadi kesalahan pada server saat memuat data pengguna.',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const adminAuth = await requireAdmin(request);
    if (adminAuth.error) {
      return adminAuth.error;
    }

    const body = await request.json();
    const { full_name, email, password, department, job_title, role, status } = body;

    if (!full_name || !email || !password) {
      return NextResponse.json(
        {
          success: false,
          message: 'Nama lengkap, email, dan password wajib diisi.',
        },
        { status: 400 }
      );
    }

    if (String(password).length < 6) {
      return NextResponse.json(
        {
          success: false,
          message: 'Password baru minimal harus terdiri dari 6 karakter.',
        },
        { status: 400 }
      );
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const existing = await queryOne<User>('SELECT id FROM users WHERE email = ?', [cleanEmail]);
    if (existing) {
      return NextResponse.json(
        {
          success: false,
          message: 'Alamat email sudah digunakan oleh pengguna lain.',
        },
        { status: 409 }
      );
    }

    const cleanName = String(full_name).trim();
    const cleanDept = (department && String(department).trim()) || 'Operasional';
    const cleanTitle = (job_title && String(job_title).trim()) || 'Staf';
    const cleanRole: UserRole = role === 'admin' ? 'admin' : 'user';
    const cleanStatus: UserStatus = ['active', 'pending', 'rejected'].includes(status) ? status : 'active';
    const initials = createAvatarInitials(cleanName);
    const passwordHash = await hashPassword(String(password));

    const insertResult = await execute(
      `INSERT INTO users (full_name, email, password_hash, department, job_title, role, status, avatar_initials, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [cleanName, cleanEmail, passwordHash, cleanDept, cleanTitle, cleanRole, cleanStatus, initials]
    );

    const newUser = await queryOne<SafeUser>(
      `SELECT id, full_name, email, department, job_title, role, status, avatar_initials, last_activity_at, created_at, updated_at
       FROM users WHERE id = ?`,
      [insertResult.insertId]
    );

    return NextResponse.json(
      {
        success: true,
        message: 'Pengguna baru berhasil ditambahkan.',
        data: newUser,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error saat membuat pengguna baru:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Terjadi kesalahan pada server saat menambahkan pengguna baru.',
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
    const targetUserId = Number(body.id || auth.user.id);

    // Pengguna biasa hanya boleh memperbarui data dirinya sendiri dan tidak boleh mengganti role/status
    if (auth.user.role !== 'admin' && targetUserId !== auth.user.id) {
      return NextResponse.json(
        {
          success: false,
          message: 'Akses ditolak. Anda hanya dapat memperbarui data profil sendiri.',
        },
        { status: 403 }
      );
    }

    const currentUser = await queryOne<User>('SELECT * FROM users WHERE id = ?', [targetUserId]);
    if (!currentUser) {
      return NextResponse.json(
        {
          success: false,
          message: 'Pengguna tidak ditemukan dalam sistem.',
        },
        { status: 404 }
      );
    }

    const { full_name, department, job_title, role, status, password } = body;

    const newName = full_name ? String(full_name).trim() : currentUser.full_name;
    const newDept = department ? String(department).trim() : currentUser.department;
    const newTitle = job_title ? String(job_title).trim() : currentUser.job_title;
    const newInitials = full_name ? createAvatarInitials(newName) : currentUser.avatar_initials;

    let newRole = currentUser.role;
    let newStatus = currentUser.status;

    // Hanya Super Admin yang berhak mengubah role atau status pengguna
    if (auth.user.role === 'admin') {
      if (role && (role === 'admin' || role === 'user')) {
        newRole = role;
      }
      if (status && ['active', 'pending', 'rejected'].includes(status)) {
        newStatus = status;
      }
    }

    let passwordHash = currentUser.password_hash;
    if (password !== undefined && password !== null) {
      if (typeof password !== 'string' || password.trim().length < 6) {
        return NextResponse.json(
          {
            success: false,
            message: 'Password baru minimal harus terdiri dari 6 karakter.',
          },
          { status: 400 }
        );
      }
      passwordHash = await hashPassword(password.trim());
    }

    await transaction(async (conn) => {
      await conn.execute(
        `UPDATE users SET
          full_name = ?,
          department = ?,
          job_title = ?,
          role = ?,
          status = ?,
          avatar_initials = ?,
          password_hash = ?,
          updated_at = NOW()
        WHERE id = ?`,
        [newName, newDept, newTitle, newRole, newStatus, newInitials, passwordHash, targetUserId]
      );

      // Jika Super Admin menyetujui atau menolak akun yang pending, selesaikan permintaan persetujuan terkait
      if (auth.user.role === 'admin' && status && status !== currentUser.status) {
        const actionDecision = newStatus === 'active' ? 'approved' : newStatus === 'rejected' ? 'rejected' : 'pending';
        await conn.execute(
          `UPDATE actions SET status = ?, resolved_at = NOW()
           WHERE user_id = ? AND type = 'registration_approval' AND status = 'pending'`,
          [actionDecision, targetUserId]
        );

        const statusMessage =
          newStatus === 'active'
            ? 'Akun Anda telah disetujui dan aktif. Anda kini dapat menggunakan seluruh fitur aplikasi.'
            : newStatus === 'rejected'
            ? 'Mohon maaf, permohonan pendaftaran akun Anda tidak disetujui oleh Super Admin.'
            : 'Status akun Anda telah diperbarui.';

        await conn.execute(
          `INSERT INTO notifications (user_id, level, title, body, is_read, created_at)
           VALUES (?, 'Informasi', 'Pembaruan status akun', ?, 0, NOW())`,
          [targetUserId, statusMessage]
        );
      }
    });

    const updatedUser = await queryOne<SafeUser>(
      `SELECT id, full_name, email, department, job_title, role, status, avatar_initials, last_activity_at, created_at, updated_at
       FROM users WHERE id = ?`,
      [targetUserId]
    );

    return NextResponse.json({
      success: true,
      message: 'Data pengguna berhasil diperbarui.',
      data: updatedUser,
    });
  } catch (error) {
    console.error('Error saat memperbarui data pengguna:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Terjadi kesalahan pada server saat memperbarui data pengguna.',
      },
      { status: 500 }
    );
  }
}
