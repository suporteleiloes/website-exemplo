import { NextRequest, NextResponse } from 'next/server';
import { API_BASE, TENANT, TENANT_HEADER, SITE_TOKEN } from '@/lib/config';

// BFF: recuperação de senha do arrematante (público, sem auth).
//  - POST  {login}            → solicita o envio do e-mail com o link de redefinição.
//    API: POST /api/public/arrematantes/service/recupera-senha  (resposta genérica anti-enumeração)
//  - PUT   {token, password}  → define a nova senha a partir do token do e-mail.
//    API: PUT  /api/public/arrematantes/service/recupera-senha
//
// Além do tenant (Uloc-Mi), encaminhamos o token do Site (X-AUTH-TOKEN) para que a API
// resolva a URL correta deste site ao montar o link do e-mail (multi-tenant).
const ENDPOINT = `${API_BASE}/api/public/arrematantes/service/recupera-senha`;

function headers(): Record<string, string> {
  const h: Record<string, string> = {
    [TENANT_HEADER]: TENANT,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
  if (SITE_TOKEN) {
    h['X-AUTH-TOKEN'] = SITE_TOKEN;
    h['X-TOKEN'] = SITE_TOKEN;
  }
  return h;
}

export async function POST(req: NextRequest) {
  let body: { login?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: true, message: 'Body inválido' }, { status: 400 }); }
  const login = (body.login || '').trim();
  if (!login) return NextResponse.json({ error: true, message: 'Informe seu e-mail ou usuário.' }, { status: 400 });

  try {
    const res = await fetch(ENDPOINT, { method: 'POST', headers: headers(), body: JSON.stringify({ login }), cache: 'no-store' });
    const data = await res.json().catch(() => ({}));
    if (res.status === 429) {
      return NextResponse.json({ error: true, message: data?.error || 'Muitas tentativas. Aguarde alguns minutos.' }, { status: 429 });
    }
    // A API responde sempre de forma genérica (anti-enumeração) — repassamos a mensagem.
    return NextResponse.json({ ok: true, message: data?.message || 'Se houver uma conta com este login, enviaremos as instruções por e-mail.' });
  } catch {
    return NextResponse.json({ error: true, message: 'Erro de rede. Tente novamente.' }, { status: 502 });
  }
}

export async function PUT(req: NextRequest) {
  let body: { token?: string; password?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: true, message: 'Body inválido' }, { status: 400 }); }
  const token = (body.token || '').trim();
  const password = body.password || '';
  if (!token) return NextResponse.json({ error: true, message: 'Link inválido. Solicite a redefinição novamente.' }, { status: 400 });
  if (password.length < 6) return NextResponse.json({ error: true, message: 'A nova senha deve ter ao menos 6 caracteres.' }, { status: 400 });

  try {
    const res = await fetch(ENDPOINT, { method: 'PUT', headers: headers(), body: JSON.stringify({ token, password }), cache: 'no-store' });
    const data = await res.json().catch(() => ({}));
    if (res.status === 429) {
      return NextResponse.json({ error: true, message: data?.error || 'Muitas tentativas. Aguarde alguns minutos.' }, { status: 429 });
    }
    if (!res.ok || data?.status !== 'OK') {
      // handlerError da API devolve a mensagem de erro (token expirado/inválido etc.).
      const msg = data?.detail || data?.message || data?.error || 'Não foi possível definir a senha. O link pode ter expirado.';
      return NextResponse.json({ error: true, message: msg }, { status: res.status || 400 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: true, message: 'Erro de rede. Tente novamente.' }, { status: 502 });
  }
}
