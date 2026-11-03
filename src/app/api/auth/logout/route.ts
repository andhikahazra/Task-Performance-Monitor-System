import { NextResponse } from 'next/server';
import { clearAuthCookie } from '@/lib/auth';

export async function POST() {
  try {
    const response = NextResponse.json({
      success: true,
      message: 'Berhasil keluar dari sistem.',
    });

    clearAuthCookie(response);
    return response;
  } catch (error) {
    console.error('Error saat logout:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Terjadi kesalahan saat memproses keluar dari sistem.',
      },
      { status: 500 }
    );
  }
}
