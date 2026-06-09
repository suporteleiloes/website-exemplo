import { NextRequest, NextResponse } from 'next/server';
import { API_BASE, TENANT, TENANT_HEADER, JWT_COOKIE, REFRESH_COOKIE } from '@/lib/config';
import { maxAgeFromTimestamp } from '@/lib/cookies';

// BFF: cadastro público de arrematante. Repassa o payload pra
// POST /api/public/arrematantes/cadastro (V1). Em caso de sucesso a API devolve
// um JWT (já loga o usuário) — guardamos no cookie httpOnly, igual ao login.
export async function POST(req: NextRequest) {
  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: true, message: 'Body inválido' }, { status: 400 }); }

  const res = await fetch(`${API_BASE}/api/public/arrematantes/cadastro`, {
    method: 'POST',
    headers: { [TENANT_HEADER]: TENANT, 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
    cache: 'no-store',
  });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    // A API V1 costuma devolver { message } ou { error, message }; repassamos.
    return NextResponse.json(
      { error: true, message: data?.message || data?.error || 'Não foi possível concluir o cadastro.', extra: data?.extra },
      { status: res.status || 400 },
    );
  }

  const out = NextResponse.json({
    ok: true,
    user: { id: data.user?.id, name: data.user?.name, username: data.user?.username },
    arrematante: data.arrematante ? { id: data.arrematante?.id } : null,
  });

  if (data?.token) {
    const cookieBase = { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' as const, path: '/' };
    out.cookies.set(JWT_COOKIE, data.token, { ...cookieBase, maxAge: maxAgeFromTimestamp(data.expires, 60 * 60 * 24) });
    if (data.refreshToken) {
      out.cookies.set(REFRESH_COOKIE, data.refreshToken, { ...cookieBase, maxAge: maxAgeFromTimestamp(data.refreshExpires, 60 * 60 * 24 * 30) });
    }
  }
  return out;
}
