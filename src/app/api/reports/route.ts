import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { query } from '@/lib/db';
import { ReportResponse, ReportSummaryStatusCount, Task, TaskStatus } from '@/types/database';

export async function GET(request: Request) {
  try {
    const auth = await requireAuth(request);
    if (auth.error) {
      return auth.error;
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'all'; // 'all' atau '2026-10' atau 'Oktober 2026'
    const statusFilter = searchParams.get('status') || 'all';
    const ownerIdParam = searchParams.get('owner_id');

    const conditions: string[] = ['t.is_demo_eval = 0'];
    const params: any[] = [];

    // Filter akses berdasarkan peran: User biasa hanya melihat pekerjaannya sendiri
    if (auth.user.role === 'user') {
      conditions.push('t.owner_id = ?');
      params.push(auth.user.id);
    } else if (ownerIdParam && ownerIdParam !== 'all') {
      conditions.push('t.owner_id = ?');
      params.push(Number(ownerIdParam));
    }

    // Filter periode (jika format YYYY-MM)
    if (period !== 'all') {
      if (/^\d{4}-\d{2}$/.test(period)) {
        const [y, m] = period.split('-').map(Number);
        conditions.push('YEAR(t.deadline) = ? AND MONTH(t.deadline) = ?');
        params.push(y, m);
      } else {
        // Cek jika format teks seperti "Oktober 2026"
        const monthNames = [
          'januari',
          'februari',
          'maret',
          'april',
          'mei',
          'juni',
          'juli',
          'agustus',
          'september',
          'oktober',
          'november',
          'desember',
        ];
        const parts = period.toLowerCase().split(' ');
        if (parts.length === 2) {
          const mIdx = monthNames.indexOf(parts[0]);
          const yearNum = Number(parts[1]);
          if (mIdx !== -1 && !isNaN(yearNum)) {
            conditions.push('YEAR(t.deadline) = ? AND MONTH(t.deadline) = ?');
            params.push(yearNum, mIdx + 1);
          }
        }
      }
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const sql = `
      SELECT 
        t.id, t.code, t.title, t.description, t.category, t.priority, t.status,
        t.owner_id, t.deadline, t.started_at, t.completed_at, t.evidence_url,
        t.evidence_photo_name, t.pending_reason, t.pending_approved,
        t.created_at, t.updated_at,
        u.full_name AS owner_name,
        u.email AS owner_email,
        u.department AS owner_department
      FROM tasks t
      LEFT JOIN users u ON t.owner_id = u.id
      ${whereClause}
      ORDER BY t.deadline DESC
    `;

    const allTasks = await query<Task>(sql, params);
    const totalCount = allTasks.length;

    // Hitung status breakdown
    const statusMap: Record<TaskStatus, { count: number; desc: string }> = {
      Selesai: { count: 0, desc: 'Memenuhi kriteria penyelesaian' },
      'Dalam Proses': { count: 0, desc: 'Sedang dikerjakan' },
      Pending: { count: 0, desc: 'Dijeda sementara menunggu persetujuan/kendala' },
      'Belum Mulai': { count: 0, desc: 'Belum dikerjakan' },
      Terlambat: { count: 0, desc: 'Melewati tenggat waktu' },
    };

    allTasks.forEach((t) => {
      if (statusMap[t.status]) {
        statusMap[t.status].count++;
      }
    });

    const statusBreakdown: ReportSummaryStatusCount[] = (
      ['Selesai', 'Dalam Proses', 'Pending', 'Belum Mulai', 'Terlambat'] as TaskStatus[]
    ).map((status) => {
      const c = statusMap[status].count;
      return {
        status,
        count: c,
        percentage: totalCount > 0 ? Number(((c / totalCount) * 100).toFixed(1)) : 0,
        description: statusMap[status].desc,
      };
    });

    // Hitung rata-rata durasi penyelesaian (dalam hari)
    const completedTasks = allTasks.filter(
      (t) => t.status === 'Selesai' && t.started_at && t.completed_at
    );
    let avgDurationDays: number | null = null;

    if (completedTasks.length > 0) {
      const totalDays = completedTasks.reduce((acc, t) => {
        const start = new Date(t.started_at!).getTime();
        const end = new Date(t.completed_at!).getTime();
        const days = Math.max(0, (end - start) / (1000 * 60 * 60 * 24));
        return acc + days;
      }, 0);
      avgDurationDays = Number((totalDays / completedTasks.length).toFixed(1));
    }

    const lateCount = statusMap['Terlambat'].count;
    const latePercentage =
      totalCount > 0 ? Number(((lateCount / totalCount) * 100).toFixed(1)) : 0;

    // Filter daftar tasks sesuai statusFilter jika ada
    const filteredTasks =
      statusFilter !== 'all' ? allTasks.filter((t) => t.status === statusFilter) : allTasks;

    const responsePayload: ReportResponse = {
      kpis: {
        totalTasks: totalCount,
        averageDurationDays: avgDurationDays,
        latePercentage,
        lateTasksCount: lateCount,
      },
      statusBreakdown,
      tasks: filteredTasks,
    };

    return NextResponse.json({
      success: true,
      message: 'Laporan ringkasan dan rincian pekerjaan berhasil dimuat.',
      data: responsePayload,
    });
  } catch (error) {
    console.error('Error saat membuat laporan:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Terjadi kesalahan pada server saat membuat laporan.',
      },
      { status: 500 }
    );
  }
}
