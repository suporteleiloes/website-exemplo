// Sessão do arrematante (BFF). O JWT vive num cookie httpOnly — o browser NUNCA o vê.
// Server Components e Route Handlers leem o cookie e falam com a API com Bearer.
// Endpoints autenticados NÃO são da Website V2 — são os já existentes (/api/auth, /api/arrematantes/*, /api/lotes/{id}/lance).
import 'server-only';
import { cookies } from 'next/headers';
import { API_BASE, TENANT, TENANT_HEADER, JWT_COOKIE } from './config';
import type { SessionUser } from './types';

export function getJwt(): string | undefined {
  return cookies().get(JWT_COOKIE)?.value;
}

/** fetch server-side autenticado contra a API (base completa, não só V2). */
export async function authFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const jwt = getJwt();
  const headers = new Headers(init.headers);
  headers.set(TENANT_HEADER, TENANT);
  headers.set('Accept', 'application/json');
  if (jwt) headers.set('Authorization', `Bearer ${jwt}`);
  return fetch(`${API_BASE}${path}`, { ...init, headers, cache: 'no-store' });
}

/** Reidrata o usuário logado a partir do JWT (GET /api/userCredentials). null se não logado/expirado. */
export async function getSessionUser(): Promise<SessionUser | null> {
  if (!getJwt()) return null;
  try {
    const res = await authFetch('/api/userCredentials');
    if (!res.ok) return null;
    const data = await res.json();
    // O envelope pode variar; normalizamos os campos mais usados.
    const u = data?.user ?? data;
    if (!u || !u.id) return null;
    return { id: u.id, username: u.username, name: u.name, loginHash: u.loginHash, roles: u.roles, papeis: u.papeis };
  } catch {
    return null;
  }
}
