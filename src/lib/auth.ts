import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';
import { JWTPayload, UserRole, SafeUser } from '@/types/database';
import { queryOne } from '@/lib/db';

const JWT_SECRET = process.env.JWT_SECRET || 'mm-super-secret-development-jwt-key-32-chars-minimum';
const secretKey = new TextEncoder().encode(JWT_SECRET);
const COOKIE_NAME = 'mm_token';

/**
 * Menghasilkan token JWT dengan masa berlaku 7 hari
 */
export async function signToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): Promise<string> {
  return await new SignJWT({
    id: payload.id,
    email: payload.email,
    role: payload.role,
    full_name: payload.full_name,
    department: payload.department,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secretKey);
}

/**
 * Memverifikasi validitas token JWT
 */
export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey);
    return {
      id: Number(payload.id),
      email: String(payload.email),
      role: payload.role as UserRole,
      full_name: String(payload.full_name),
      department: payload.department ? String(payload.department) : undefined,
      iat: payload.iat,
      exp: payload.exp,
    };
  } catch {
    return null;
  }
}

/**
 * Menghash password menggunakan bcryptjs
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
}

/**
 * Membandingkan plain password dengan hash yang tersimpan
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

/**
 * Mem-parse string header Cookie menjadi objek key-value
 */
function parseCookies(cookieString: string): Record<string, string> {
  const result: Record<string, string> = {};
  cookieString.split(';').forEach((part) => {
    const [rawKey, ...rawVal] = part.split('=');
    if (rawKey) {
      try {
        result[rawKey.trim()] = decodeURIComponent(rawVal.join('=').trim());
      } catch {
        result[rawKey.trim()] = rawVal.join('=').trim();
      }
    }
  });
  return result;
}

/**
 * Mendapatkan user yang sedang login dari request (Bearer Token atau Cookie)
 */
export async function getSessionUser(request?: Request): Promise<JWTPayload | null> {
  let token: string | null = null;

  if (request) {
    // 1. Cek header Authorization: Bearer <token>
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim();
    }

    // 2. Cek Cookie header
    if (!token) {
      const cookieHeader = request.headers.get('cookie');
      if (cookieHeader) {
        const cookies = parseCookies(cookieHeader);
        token = cookies[COOKIE_NAME] || null;
      }
    }
  }

  // 3. Fallback ke next/headers cookies() jika tidak disediakan request
  if (!token) {
    try {
      const { cookies } = await import('next/headers');
      const cookieStore = await cookies();
      token = cookieStore.get(COOKIE_NAME)?.value || null;
    } catch {
      // Berada di luar konteks request Next.js headers
    }
  }

  if (!token) {
    return null;
  }

  return await verifyToken(token);
}

/**
 * Mengambil data SafeUser lengkap dari database berdasarkan sesi yang aktif di Server Component / Request
 */
export async function getCurrentUser(request?: Request): Promise<SafeUser | null> {
  try {
    const session = await getSessionUser(request);
    if (!session || !session.id) {
      return null;
    }

    const user = await queryOne<SafeUser>(
      `SELECT id, full_name, email, department, job_title, role, status, avatar_initials, last_activity_at, created_at, updated_at
       FROM users
       WHERE id = ?`,
      [session.id]
    );

    return user || null;
  } catch (err) {
    console.error('Error saat getCurrentUser:', err);
    return null;
  }
}

/**
 * Memasang HTTP-only cookie pada respons
 */
export function setAuthCookie(response: NextResponse, token: string): void {
  response.cookies.set({
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 hari
  });
}

/**
 * Menghapus HTTP-only cookie pada respons
 */
export function clearAuthCookie(response: NextResponse): void {
  response.cookies.set({
    name: COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}

/**
 * Helper autentikasi wajib untuk API endpoint
 */
export async function requireAuth(
  request: Request
): Promise<{ user: JWTPayload; error?: undefined } | { user?: undefined; error: NextResponse }> {
  const user = await getSessionUser(request);
  if (!user) {
    return {
      error: NextResponse.json(
        {
          success: false,
          message: 'Autentikasi diperlukan. Silakan masuk terlebih dahulu.',
        },
        { status: 401 }
      ),
    };
  }
  return { user };
}

/**
 * Helper autentikasi khusus Super Admin untuk API endpoint
 */
export async function requireAdmin(
  request: Request
): Promise<{ user: JWTPayload; error?: undefined } | { user?: undefined; error: NextResponse }> {
  const auth = await requireAuth(request);
  if (auth.error) {
    return auth;
  }
  if (auth.user.role !== 'admin') {
    return {
      error: NextResponse.json(
        {
          success: false,
          message: 'Akses ditolak. Tindakan ini hanya dapat dilakukan oleh Super Admin.',
        },
        { status: 403 }
      ),
    };
  }
  return { user: auth.user };
}

/**
 * Membuat inisial avatar dari nama lengkap (misal "Aditya Pratama" -> "AP")
 */
export function createAvatarInitials(name: string): string {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
