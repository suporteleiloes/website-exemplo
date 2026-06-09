import { NextRequest, NextResponse } from 'next/server';
import { API_BASE, TENANT, TENANT_HEADER, JWT_COOKIE } from '@/lib/config';

// BFF: recebe {user, pass}, autentica na API (/api/auth) e guarda o JWT num cookie httpOnly.
// O browser NUNCA vê o token (mitiga XSS — GUIA §13).
export async function POST(req: NextRequest) {
  let body: { user?: string; pass?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: true, message: 'Body inválido' }, { status: 400 }); }
  if (!body.user || !body.pass) return NextResponse.json({ error: true, message: 'Informe usuário e senha' }, { status: 400 });

  const res = await fetch(`${API_BASE}/api/auth`, {
    method: 'POST',
    headers: { [TENANT_HEADER]: TENANT, 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ user: body.user, pass: body.pass }),
    cache: 'no-store',
  });
  const data = await res.json().catch(() => ({}));

  if (!res.ok || !data?.token) {
    return NextResponse.json({ error: true, message: data?.message || 'Credenciais inválidas', status: res.status }, { status: res.status || 401 });
  }

  const out = NextResponse.json({
    ok: true,
    user: { id: data.user?.id, name: data.user?.name, username: data.user?.username, roles: data.user?.roles },
  });
  out.cookies.set(JWT_COOKIE, data.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60, // ~1h (JWT sem refresh — ver PENDENCIAS)
  });
  return out;
}
