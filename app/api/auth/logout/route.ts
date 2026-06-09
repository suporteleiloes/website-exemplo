import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { API_BASE, TENANT, TENANT_HEADER, JWT_COOKIE, REFRESH_COOKIE } from '@/lib/config';

export async function POST() {
  const jwt = cookies().get(JWT_COOKIE)?.value;
  if (jwt) {
    // Best-effort: revoga a sessão no backend.
    try {
      await fetch(`${API_BASE}/api/auth/logout`, {
        method: 'POST',
        headers: { [TENANT_HEADER]: TENANT, Authorization: `Bearer ${jwt}` },
        cache: 'no-store',
      });
    } catch { /* ignora */ }
  }
  const out = NextResponse.json({ ok: true });
  out.cookies.set(JWT_COOKIE, '', { path: '/', maxAge: 0 });
  out.cookies.set(REFRESH_COOKIE, '', { path: '/', maxAge: 0 });
  return out;
}
