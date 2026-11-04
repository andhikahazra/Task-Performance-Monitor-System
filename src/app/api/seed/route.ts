import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { runSeeder } from '@/lib/seeder';

export async function POST(request: Request) {
  try {
    const auth = await requireAdmin(request);
    if (auth.error) {
      return auth.error;
    }

    const stats = await runSeeder();

    return NextResponse.json({
      success: true,
      message: 'Database berhasil di-seed ulang dengan data dinamis dan optimasi indeks performa.',
      data: stats,
    });
  } catch (error: any) {
    console.error('Error during database seeding:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Gagal menjalankan seeder: ' + (error?.message || 'Unknown error'),
      },
      { status: 500 }
    );
  }
}
