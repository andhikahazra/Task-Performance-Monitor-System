import mysql, { Pool, PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';

declare global {
  // eslint-disable-next-line no-var
  var mysqlPool: Pool | undefined;
}

const dbHost = process.env.DB_HOST || '127.0.0.1';
const dbPort = Number(process.env.DB_PORT) || 3306;
const dbUser = process.env.DB_USER || 'mm_user';
const dbPassword = process.env.DB_PASSWORD || 'mm_password';
const dbName = process.env.DB_NAME || 'management_monitor';

export const pool: Pool =
  global.mysqlPool ||
  mysql.createPool({
    host: dbHost,
    port: dbPort,
    user: dbUser,
    password: dbPassword,
    database: dbName,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    dateStrings: true,
    timezone: '+07:00', // Waktu Indonesia Barat (WIB)
  });

if (process.env.NODE_ENV !== 'production') {
  global.mysqlPool = pool;
}

/**
 * Menjalankan query SELECT dan mengembalikan array baris
 */
export async function query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  const [rows] = await pool.query<RowDataPacket[] & T[]>(sql, params);
  return rows as T[];
}

/**
 * Menjalankan query SELECT dan mengembalikan 1 baris pertama atau null
 */
export async function queryOne<T = any>(sql: string, params: any[] = []): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

/**
 * Menjalankan perintah INSERT, UPDATE, atau DELETE
 */
export async function execute(sql: string, params: any[] = []): Promise<ResultSetHeader> {
  const [result] = await pool.execute<ResultSetHeader>(sql, params);
  return result;
}

/**
 * Menjalankan operasi dalam transaksi database
 */
export async function transaction<T>(callback: (connection: PoolConnection) => Promise<T>): Promise<T> {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export default pool;
