import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { API_BASE, TENANT, TENANT_HEADER, JWT_COOKIE, REFRESH_COOKIE } from '@/lib/config';
import { maxAgeFromTimestamp } from '@/lib/cookies';

// BFF: renova o access token usando o refresh token (P4), mantendo ambos em cookies httpOnly.
// Chame quando o access expirar (ou ao receber 401). Rotaciona o refresh (uso único).
export async function POST() {
  const refresh = cookies().get(REFRESH_COOKIE)?.value;
  if (!refresh) {
    return NextResponse.json({ error: true, message: 'Sem sessão' }, { status: 401 });
  }

  const res = await fetch(`${API_BASE}/api/auth/refresh`, {
    method: 'POST',
    headers: { [TENANT_HEADER]: TENANT, 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ refreshToken: refresh }),
    cache: 'no-store',
  });
  const data = await res.json().catch(() => ({}));

  if (!res.ok || !data?.token) {
    // Refresh inválido/expirado → encerra a sessão local.
    const dead = NextResponse.json({ error: true, message: 'Sessão expirada' }, { status: 401 });
    dead.cookies.set(JWT_COOKIE, '', { path: '/', maxAge: 0 });
    dead.cookies.set(REFRESH_COOKIE, '', { path: '/', maxAge: 0 });
    return dead;
  }

  const base = { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' as const, path: '/' };
  const out = NextResponse.json({ ok: true });
  out.cookies.set(JWT_COOKIE, data.token, { ...base, maxAge: maxAgeFromTimestamp(data.expires, 60 * 60 * 24) });
  if (data.refreshToken) {
    out.cookies.set(REFRESH_COOKIE, data.refreshToken, { ...base, maxAge: maxAgeFromTimestamp(data.refreshExpires, 60 * 60 * 24 * 30) });
  }
  return out;
}
