import { NextRequest, NextResponse } from 'next/server';
import { API_BASE, TENANT, TENANT_HEADER, PAINEL_URL } from '@/lib/config';
import { getJwt } from '@/lib/auth';

/**
 * SSO — leva a sessão do site para o painel do arrematante (app-cliente), já logado.
 *
 * O usuário logado no site clica "Meu painel"/"Auditório" → cai aqui. Com o JWT do cookie
 * httpOnly, pedimos à API um código de troca de uso único (POST /api/sso/exchange) e
 * redirecionamos para `${PAINEL_URL}/sso?sso=<code>&redirect=<destino>`. O app resgata
 * (POST /api/auth/sso/redeem) e entra sem senha. O par site+app fica vinculado (pairId)
 * → logout num lado derruba o outro.
 *
 * ⚠️ NUNCA linkar o painel direto do JSX — use `hrefPainel()` (`lib/painel.ts`). Este BFF
 * só existe porque cookie não atravessa domínio: o site é `<tenant>` e o painel é
 * `app.<tenant>`.
 *
 * ⚠️ O app resgata o código NO TENANT DELE. Em produção site e painel são o mesmo tenant
 * (ex.: `leiloeiro.com.br` e `app.leiloeiro.com.br` → mesma chave no clients.php). Em dev,
 * alinhe os tenants (NEXT_PUBLIC_TENANT do site == VITE_TENANT do app) senão o redeem não
 * acha o código.
 *
 * Sem sessão → manda pro login. Sem PAINEL_URL → manda pra home (não há painel configurado).
 *
 * ── `?anon=1` — destino PÚBLICO no painel ───────────────────────────────────
 * O auditório é rota pública do app: visitante deslogado pode assistir. Se o link
 * do auditório exigisse login, o visitante seria barrado — e se fosse direto pro
 * domínio do app (era o que acontecia), o LOGADO chegava lá deslogado, porque a
 * sessão do site não atravessa domínio sozinha. Com `anon=1` o mesmo link serve
 * aos dois: logado → handoff (entra logado), deslogado → painel direto.
 * Usar SÓ em destinos públicos do painel; sem a flag continua exigindo sessão.
 *
 * ── `?voltar=<url do site>` — propagar sessão e voltar ──────────────────────
 * Usado logo após login/cadastro: o navegador passa pelo painel só pra gravar a
 * sessão de lá e volta pro site. O visitante nem percebe. Só aceita URL do MESMO
 * domínio-raiz (anti open-redirect — ver `sanitizarVoltar`).
 */
export async function GET(req: NextRequest) {
  const destino = sanitizarDestino(req.nextUrl.searchParams.get('redirect'));
  const permiteAnonimo = req.nextUrl.searchParams.get('anon') === '1';
  // `voltar`: URL DESTE site pra onde o painel devolve o visitante depois de
  // resgatar o código. É o modo "propagar sessão e voltar". Ver lib/painel.ts.
  const voltar = sanitizarVoltar(req.nextUrl.searchParams.get('voltar'), req);

  if (!PAINEL_URL) {
    return NextResponse.redirect(voltar ? new URL(voltar) : new URL('/', req.url));
  }

  const jwt = await getJwt();
  if (!jwt) {
    // Sem sessão não há o que propagar: volta pro site em vez de exigir login.
    if (voltar) return NextResponse.redirect(new URL(voltar));
    if (permiteAnonimo) return NextResponse.redirect(destinoPainel(destino, null));
    const url = new URL('/login', req.url);
    url.searchParams.set('redirect', '/conta');
    return NextResponse.redirect(url);
  }

  try {
    const res = await fetch(`${API_BASE}/api/sso/exchange`, {
      method: 'POST',
      headers: {
        [TENANT_HEADER]: TENANT,
        Authorization: `Bearer ${jwt}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ origem: 'site' }),
      cache: 'no-store',
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok || !data?.code) {
      // Handoff falhou (sessão expirada, etc). No modo "voltar" isso não pode
      // sequestrar a navegação do visitante: devolve pro site e segue a vida.
      if (voltar) return NextResponse.redirect(new URL(voltar));
      // Nos demais casos abre o painel mesmo assim; ele pede login.
      return NextResponse.redirect(destinoPainel(destino, null));
    }
    return NextResponse.redirect(destinoPainel(destino, data.code as string, voltar));
  } catch {
    if (voltar) return NextResponse.redirect(new URL(voltar));
    return NextResponse.redirect(destinoPainel(destino, null));
  }
}

/** Monta a URL do painel: /sso?sso=<code>&redirect=<rota> (ou a rota direta se sem código). */
function destinoPainel(destino: string, code: string | null, voltar?: string | null): string {
  const base = PAINEL_URL.replace(/\/$/, '');
  if (!code) return `${base}${destino}`;
  const u = new URL(`${base}/sso`);
  u.searchParams.set('sso', code);
  u.searchParams.set('redirect', destino);
  // Com `voltar`, o painel resgata o código e devolve o visitante pro site.
  if (voltar) u.searchParams.set('voltar', voltar);
  return u.toString();
}

/**
 * URL de retorno permitida: absoluta, http(s) e **do mesmo domínio-raiz do site**.
 * Sem essa checagem o parâmetro viraria open-redirect (phishing com o nosso
 * domínio no meio do caminho). Aceita também path interno, que é convertido em
 * absoluto — o painel está em outro domínio e precisa da URL completa.
 */
function sanitizarVoltar(raw: string | null, req: NextRequest): string | null {
  if (!raw) return null;
  try {
    const atual = new URL(req.url);
    if (raw.startsWith('/') && !raw.startsWith('//')) return new URL(raw, atual.origin).toString();
    const u = new URL(raw);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
    return dominioRaiz(u.hostname) === dominioRaiz(atual.hostname) ? u.toString() : null;
  } catch {
    return null;
  }
}

/** `www.leiloeiro.com.br` / `app.leiloeiro.com.br` → `leiloeiro.com.br`. */
function dominioRaiz(host: string): string {
  const p = host.toLowerCase().split('.');
  // Domínios br usam 3 rótulos finais (com.br, net.br…); os demais, 2.
  const n = p.length > 2 && p[p.length - 1] === 'br' && p[p.length - 2].length <= 3 ? 3 : 2;
  return p.slice(-n).join('.');
}

/** Rota interna do painel para onde ir depois de logar. Evita open-redirect. */
function sanitizarDestino(raw: string | null): string {
  if (raw && raw.startsWith('/') && !raw.startsWith('//')) return raw;
  return '/';
}
