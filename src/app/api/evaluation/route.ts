import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { query } from '@/lib/db';
import {
  EvaluationResponse,
  UserEvaluationResult,
  EvaluationInsight,
  Task,
  User,
} from '@/types/database';

export async function GET(request: Request) {
  try {
    const auth = await requireAuth(request);
    if (auth.error) {
      return auth.error;
    }

    const { searchParams } = new URL(request.url);
    const mode = (searchParams.get('period') as 'week' | 'month') || 'month';

    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const currentYearMonth = `${now.getFullYear()}-${pad(now.getMonth() + 1)}`;

    // Hitung tanggal hari Senin pada pekan berjalan secara dinamis
    const currentMonday = new Date(now);
    const dayOfWeek = currentMonday.getDay();
    const diffToMonday = (dayOfWeek === 0 ? -6 : 1) - dayOfWeek;
    currentMonday.setDate(currentMonday.getDate() + diffToMonday);
    currentMonday.setHours(0, 0, 0, 0);
    const currentWeekMondayStr = `${currentMonday.getFullYear()}-${pad(currentMonday.getMonth() + 1)}-${pad(currentMonday.getDate())}`;

    const dateParam = searchParams.get('date') || (mode === 'month' ? currentYearMonth : currentWeekMondayStr);
    const selectedUserId = searchParams.get('user_id');
    const department = searchParams.get('department')?.trim();

    // 1. Tentukan rentang waktu evaluasi
    let start: Date;
    let end: Date;
    let label = '';

    if (mode === 'month') {
      const parts = dateParam.split('-');
      const y = parseInt(parts[0], 10) || now.getFullYear();
      const m = parseInt(parts[1], 10) || (now.getMonth() + 1);
      start = new Date(y, m - 1, 1, 0, 0, 0);
      end = new Date(y, m, 0, 23, 59, 59, 999);

      const startMonthName = start.toLocaleDateString('id-ID', { month: 'long' });
      const endMonthName = end.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
      label = `${start.getDate()} ${startMonthName} – ${end.getDate()} ${endMonthName}`;
    } else {
      const d = new Date(`${dateParam}T00:00:00`);
      start = isNaN(d.getTime()) ? currentMonday : d;
      end = new Date(start);
      end.setDate(end.getDate() + 6);
      end.setHours(23, 59, 59, 999);

      label = `${start.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
      })} – ${end.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })}`;
    }

    // 2. Ambil data seluruh pengguna (atau pengguna spesifik jika dipilih)
    let userQuery = `SELECT id, full_name, email, department, role FROM users WHERE status = 'active'`;
    const userParams: any[] = [];

    if (department && department !== 'all') {
      userQuery += ' AND department = ?';
      userParams.push(department);
    }

    // Jika filter pengguna spesifik dipilih
    if (selectedUserId && selectedUserId !== 'all') {
      userQuery += ' AND id = ?';
      userParams.push(Number(selectedUserId));
    }

    userQuery += ' ORDER BY full_name ASC';
    const users = await query<User>(userQuery, userParams);

    // 3. Ambil data pekerjaan dalam rentang waktu (termasuk is_demo_eval agar evaluasi komprehensif)
    const tasksSql = `
      SELECT id, code, title, category, priority, status, owner_id, deadline, started_at, completed_at, pending_approved, is_demo_eval
      FROM tasks
      WHERE deadline >= ? AND deadline <= ?
      ORDER BY deadline ASC
    `;
    const formatSql = (d: Date) =>
      `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    const startStr = formatSql(start);
    const endStr = formatSql(end);
    const tasks = await query<Task>(tasksSql, [startStr, endStr]);

    const referenceNow = mode === 'month' && end < new Date() ? end : new Date();

    // 4. Hitung skor untuk tiap pengguna
    const results: UserEvaluationResult[] = users.map((u) => {
      const userTasks = tasks.filter((t) => t.owner_id === u.id);

      // Pekerjaan yang masuk dalam perhitungan jatuh tempo
      const due = userTasks.filter((t) => {
        const d = new Date(t.deadline);
        return t.status !== 'Belum Mulai' || d <= referenceNow;
      });

      const completed = due.filter((t) => t.status === 'Selesai');
      // Hanya pekerjaan selesai yang bukan hasil penundaan persetujuan pending yang dihitung onTime
      const eligibleCompleted = completed.filter((t) => !t.pending_approved);

      const onTime = eligibleCompleted.filter((t) => {
        if (t.completed_at) {
          return new Date(t.completed_at) <= new Date(t.deadline);
        }
        return new Date(t.deadline) >= referenceNow;
      });

      const completionRate = due.length > 0 ? (completed.length / due.length) * 100 : null;
      const timelyRate =
        eligibleCompleted.length > 0 ? (onTime.length / eligibleCompleted.length) * 100 : null;

      const score =
        completionRate !== null && timelyRate !== null
          ? completionRate * 0.5 + timelyRate * 0.5
          : null;

      let category: UserEvaluationResult['category'] = 'Belum dinilai';
      let categoryClass: UserEvaluationResult['categoryClass'] = '';

      if (score !== null) {
        if (score >= 90) {
          category = 'Sangat baik';
          categoryClass = 'score-high';
        } else if (score >= 80) {
          category = 'Baik';
          categoryClass = 'score-high';
        } else if (score >= 70) {
          category = 'Perlu peningkatan';
          categoryClass = 'score-mid';
        } else {
          category = 'Perlu perhatian';
          categoryClass = 'score-low';
        }
      }

      const attentionCount = due.filter((t) => {
        const d = new Date(t.deadline);
        return ['Terlambat', 'Pending', 'Dalam Proses'].includes(t.status) && d < referenceNow;
      }).length;

      return {
        userId: u.id,
        userName: u.full_name,
        department: u.department,
        dueCount: due.length,
        completedCount: completed.length,
        completionRate: completionRate !== null ? Number(completionRate.toFixed(1)) : null,
        timelyRate: timelyRate !== null ? Number(timelyRate.toFixed(1)) : null,
        score: score !== null ? Number(score.toFixed(1)) : null,
        category,
        categoryClass,
        attentionCount,
        tasks: due.map((t) => ({
          id: t.id,
          code: t.code,
          title: t.title,
          status: t.status,
          deadline: t.deadline,
          completed_at: t.completed_at,
          onTime: t.completed_at
            ? new Date(t.completed_at) <= new Date(t.deadline)
            : new Date(t.deadline) >= referenceNow,
        })),
      };
    });

    // Urutkan dari skor tertinggi
    results.sort((a, b) => (b.score ?? -1) - (a.score ?? -1));

    // 5. Hitung ringkasan keseluruhan
    const validScores = results.filter((r) => r.score !== null);
    const avgScore = validScores.length
      ? Number((validScores.reduce((sum, r) => sum + (r.score || 0), 0) / validScores.length).toFixed(1))
      : null;

    const sumDue = results.reduce((sum, r) => sum + r.dueCount, 0);
    const sumDone = results.reduce((sum, r) => sum + r.completedCount, 0);
    const overallCompletionRate = sumDue > 0 ? Number(((sumDone / sumDue) * 100).toFixed(1)) : null;

    const totalEligible = results.reduce(
      (sum, r) => sum + r.tasks.filter((t) => t.status === 'Selesai').length,
      0
    );
    const totalOnTime = results.reduce(
      (sum, r) => sum + r.tasks.filter((t) => t.status === 'Selesai' && t.onTime).length,
      0
    );
    const overallTimelyRate =
      totalEligible > 0 ? Number(((totalOnTime / totalEligible) * 100).toFixed(1)) : null;

    const totalAttention = results.reduce((sum, r) => sum + r.attentionCount, 0);

    // 6. Bentuk wawasan (insights)
    const insights: EvaluationInsight[] = [];
    if (validScores.length > 0) {
      const best = validScores[0];
      const low = validScores[validScores.length - 1];

      insights.push({
        icon: 'trending',
        title: 'Skor tertinggi',
        description: `${best.userName} memperoleh skor ${best.score} dari 100 (${best.category}).`,
      });

      if (low.userId !== best.userId) {
        insights.push({
          icon: 'alert',
          title: 'Prioritas pembinaan',
          description: `${low.userName} memperoleh skor ${low.score} (${low.category}). Periksa pekerjaan terlambat dan kendala operasional.`,
        });
      }
    }

    if (sumDue === 0) {
      insights.push({
        icon: 'info',
        title: 'Belum ada data jatuh tempo',
        description: 'Tidak ada pekerjaan yang jatuh tempo pada periode ini sehingga skor tidak dapat dihitung.',
      });
    } else {
      insights.push({
        icon: 'check',
        title: 'Cakupan penilaian',
        description: `${sumDone} dari ${sumDue} pekerjaan jatuh tempo telah berstatus Selesai (${overallCompletionRate}%).`,
      });
    }

    insights.push({
      icon: 'clock',
      title: 'Pekerjaan perlu perhatian',
      description: `${totalAttention} pekerjaan memerlukan perhatian segera karena berstatus Terlambat atau tertunda.`,
    });

    // 7. Bentuk ringkasan evaluasi operasional & rekomendasi
    let aiSummary = '';
    const aiFindings: Array<{ title: string; description: string }> = [];

    const periodName = mode === 'month' ? 'bulanan' : 'mingguan';
    if (!validScores.length) {
      aiSummary =
        'Belum cukup data untuk menyusun evaluasi kinerja operasional. Pastikan ada pekerjaan yang telah mencapai tenggat waktu dalam periode terpilih.';
      aiFindings.push({
        title: 'Data belum memadai',
        description: 'Skor tidak dihitung apabila tidak terdapat pekerjaan jatuh tempo dalam periode penilaian.',
      });
    } else {
      const best = validScores[0];
      const low = validScores[validScores.length - 1];
      const totalLate = tasks.filter((t) => t.status === 'Terlambat').length;
      const totalPending = tasks.filter((t) => t.status === 'Pending').length;

      const scoreDiff = (best.score || 0) - (low.score || 0);
      const comparisonText =
        scoreDiff < 8
          ? 'Performa tim terpantau seimbang dengan variasi skor yang relatif kecil.'
          : 'Terdapat kesenjangan performa antar anggota yang memerlukan tinjauan distribusi beban kerja.';

      aiSummary = `Evaluasi ${periodName} (${label}) mencakup ${sumDue} pekerjaan jatuh tempo dari ${results.length} pengguna. Rata-rata tingkat penyelesaian tim sebesar ${overallCompletionRate ?? 0}% dengan ketepatan waktu ${overallTimelyRate ?? 0}%. Capaian tertinggi diraih oleh ${best.userName} dengan skor ${best.score}/100. ${comparisonText} Data ini menjadi rujukan audit operasional dan tindak lanjut peningkatan kinerja.`;

      aiFindings.push({
        title: 'Kinerja penyelesaian tertinggi',
        description: `${best.userName} membukukan skor ${best.score}/100 dengan tingkat penyelesaian ${best.completionRate ?? 0}% dan ketepatan waktu ${best.timelyRate ?? 0}%. Alur kerja yang diterapkan dapat dijadikan tolok ukur standar tim.`,
      });

      if (low.userId !== best.userId) {
        aiFindings.push({
          title: 'Prioritas pembinaan & penyesuaian beban',
          description: `${low.userName} mencatat skor ${low.score}/100 (${low.category}). Disarankan evaluasi hambatan teknis dan penyesuaian alokasi pekerjaan sebelum periode berikutnya.`,
        });
      } else {
        aiFindings.push({
          title: 'Rekomendasi pertumbuhan berkala',
          description: `Pertahankan ritme penyelesaian pekerjaan dan pastikan konsistensi pemenuhan bukti selesai tepat waktu.`,
        });
      }

      aiFindings.push({
        title: 'Mitigasi risiko operasional',
        description: `Tercatat ${totalLate} pekerjaan terlambat dan ${totalPending} pekerjaan berstatus Pending dari ${sumDue} pekerjaan jatuh tempo. Perlu penegakan SLA dan verifikasi berkala kendala tugas.`,
      });
    }

    const responsePayload: EvaluationResponse = {
      period: {
        mode,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        label,
      },
      summary: {
        averageScore: avgScore,
        overallCompletionRate,
        overallTimelyRate,
        totalTasksNeedingAttention: totalAttention,
        totalDueTasks: sumDue,
        totalCompletedTasks: sumDone,
      },
      results,
      insights,
      aiReview: {
        summary: aiSummary,
        findings: aiFindings,
      },
    };

    return NextResponse.json({
      success: true,
      message: 'Evaluasi kinerja berhasil dihitung.',
      data: responsePayload,
    });
  } catch (error) {
    console.error('Error saat menghitung evaluasi:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Terjadi kesalahan pada server saat menghitung evaluasi.',
      },
      { status: 500 }
    );
  }
}
