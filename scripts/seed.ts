import { runSeeder } from '../src/lib/seeder';
import { pool } from '../src/lib/db';

async function main() {
  const stats = await runSeeder();
  console.log('\n🎉 Dynamic Database Seeder & Performance Optimization Selesai 100%!');
  console.log('------------------------------------------------------------');
  console.log(`Statistik Data:`);
  console.log(`  Pengguna: ${stats.usersCount}`);
  console.log(`  Pekerjaan (Tasks): ${stats.tasksCount}`);
  console.log(`  Komentar: ${stats.commentsCount}`);
  console.log(`  Perlu Tindakan: ${stats.actionsCount}`);
  console.log(`  Notifikasi: ${stats.notificationsCount}`);
  console.log('------------------------------------------------------------');
  console.log('Akun Tersedia:');
  console.log('  👑 Super Admin: admin@demo.com  / Password: Admin123');
  console.log('  👨 Aditya (Ops): user@demo.com   / Password: User123');
  console.log('  👩 Nadia (Adm): nadia@example.com / Password: User123');
  console.log('  💻 Budi (TI):    budi@example.com  / Password: User123');
  console.log('  💰 Dewi (Fin):   dewi@example.com  / Password: User123');
  console.log('------------------------------------------------------------');
}

main()
  .catch((err) => {
    console.error('❌ Terjadi kesalahan pada proses seeder:', err);
    process.exit(1);
  })
  .finally(async () => {
    await pool.end();
    process.exit(0);
  });
