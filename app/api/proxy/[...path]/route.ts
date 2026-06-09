import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { API_BASE, TENANT, TENANT_HEADER, JWT_COOKIE } from '@/lib/config';

// Proxy autenticado: /api/proxy/<rest> → ${API_BASE}/api/<rest>, anexando o JWT do cookie.
// Usado pela área logada / lance / habilitação / favoritos a partir do browser,
// SEM expor o token. Endpoints da Website V2 também passam por aqui quando o client
// precisa de no-cache (ex.: lances-publicos) — basta usar /api/proxy/website/v2/...
async function handle(req: NextRequest, path: string[]) {
  const jwt = cookies().get(JWT_COOKIE)?.value;
  const search = req.nextUrl.search || '';
  const url = `${API_BASE}/api/${path.join('/')}${search}`;

  const headers = new Headers();
  headers.set(TENANT_HEADER, TENANT);
  headers.set('Accept', 'application/json');
  if (jwt) headers.set('Authorization', `Bearer ${jwt}`);

  const init: RequestInit = { method: req.method, headers, cache: 'no-store' };
  if (!['GET', 'HEAD'].includes(req.method)) {
    const ct = req.headers.get('content-type');
    if (ct) headers.set('Content-Type', ct);
    init.body = await req.text();
  }

  const res = await fetch(url, init);
  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: { 'Content-Type': res.headers.get('content-type') || 'application/json' },
  });
}

export async function GET(req: NextRequest, { params }: { params: { path: string[] } }) { return handle(req, params.path); }
export async function POST(req: NextRequest, { params }: { params: { path: string[] } }) { return handle(req, params.path); }
export async function PUT(req: NextRequest, { params }: { params: { path: string[] } }) { return handle(req, params.path); }
export async function PATCH(req: NextRequest, { params }: { params: { path: string[] } }) { return handle(req, params.path); }
export async function DELETE(req: NextRequest, { params }: { params: { path: string[] } }) { return handle(req, params.path); }
