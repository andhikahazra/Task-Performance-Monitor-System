import { NextResponse } from 'next/server';
import { requireAuth, requireAdmin } from '@/lib/auth';
import { query, execute, transaction } from '@/lib/db';
import { Setting } from '@/types/database';

export async function GET(request: Request) {
  try {
    const auth = await requireAuth(request);
    if (auth.error) {
      return auth.error;
    }

    const settingsList = await query<Setting>('SELECT key_name, key_value, description, updated_at FROM settings');

    // Buat format key-value map untuk kemudahan akses frontend
    const settingsMap: Record<string, string> = {};
    settingsList.forEach((s) => {
      settingsMap[s.key_name] = s.key_value;
    });

    return NextResponse.json({
      success: true,
      message: 'Pengaturan sistem berhasil dimuat.',
      data: {
        settings: settingsMap,
        list: settingsList,
      },
    });
  } catch (error) {
    console.error('Error saat mengambil pengaturan sistem:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Terjadi kesalahan pada server saat memuat pengaturan sistem.',
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  return PUT(request);
}

export async function PUT(request: Request) {
  try {
    const adminAuth = await requireAdmin(request);
    if (adminAuth.error) {
      return adminAuth.error;
    }

    const body = await request.json();

    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        {
          success: false,
          message: 'Format data pengaturan tidak valid.',
        },
        { status: 400 }
      );
    }

    await transaction(async (conn) => {
      // Menangani jika body berbentuk array objek [{ key_name, key_value }] atau object dictionary { key: value }
      if (Array.isArray(body)) {
        for (const item of body) {
          if (item.key_name && item.key_value !== undefined) {
            await conn.execute(
              `INSERT INTO settings (key_name, key_value, description, updated_at)
               VALUES (?, ?, ?, NOW())
               ON DUPLICATE KEY UPDATE key_value = VALUES(key_value), description = COALESCE(VALUES(description), description), updated_at = NOW()`,
              [String(item.key_name), String(item.key_value), item.description || null]
            );
          }
        }
      } else {
        for (const [key, value] of Object.entries(body)) {
          if (typeof key === 'string' && value !== undefined && value !== null) {
            await conn.execute(
              `INSERT INTO settings (key_name, key_value, updated_at)
               VALUES (?, ?, NOW())
               ON DUPLICATE KEY UPDATE key_value = VALUES(key_value), updated_at = NOW()`,
              [key, String(value)]
            );
          }
        }
      }
    });

    const updatedList = await query<Setting>('SELECT key_name, key_value, description, updated_at FROM settings');
    const settingsMap: Record<string, string> = {};
    updatedList.forEach((s) => {
      settingsMap[s.key_name] = s.key_value;
    });

    return NextResponse.json({
      success: true,
      message: 'Pengaturan sistem berhasil diperbarui.',
      data: {
        settings: settingsMap,
        list: updatedList,
      },
    });
  } catch (error) {
    console.error('Error saat memperbarui pengaturan sistem:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Terjadi kesalahan pada server saat memperbarui pengaturan.',
      },
      { status: 500 }
    );
  }
}
