#!/usr/bin/env node
// Spec dos endpoints da Website V2 consumidos por esta POC.
// Objetivo: validar continuamente que a API entrega o que um site público precisa.
// Uso: npm run spec   (ou: NODE_TLS_REJECT_UNAUTHORIZED=0 node scripts/spec-endpoints.mjs)
// Configurável por env: API_BASE, TENANT.
// Saída: relatório PASS/FAIL + exit code 1 se houver falha.

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE || process.env.API_BASE || 'https://localhost:8001').replace(/\/$/, '');
const TENANT = process.env.NEXT_PUBLIC_TENANT || process.env.TENANT || 'localhost';
const V2 = `${API_BASE}/api/website/v2`;
const H = { 'Uloc-Mi': TENANT, Accept: 'application/json' };

let pass = 0, fail = 0;
const linhas = [];
function check(nome, ok, info = '') {
  (ok ? pass++ : fail++);
  linhas.push(`${ok ? '✅' : '❌'} ${nome}${info ? ` — ${info}` : ''}`);
}

async function jget(path) {
  const res = await fetch(`${V2}${path}`, { headers: H });
  let body = null;
  try { body = await res.json(); } catch {}
  return { status: res.status, body };
}
async function jpost(path, payload) {
  const res = await fetch(`${V2}${path}`, { method: 'POST', headers: { ...H, 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  let body = null;
  try { body = await res.json(); } catch {}
  return { status: res.status, body };
}

async function run() {
  console.log(`\nSpec Website V2 — ${V2} (tenant: ${TENANT})\n`);

  // Shell do site
  let r = await jget('/site/config');
  check('GET /site/config', r.status === 200 && r.body?.cores && r.body?.contato, `cores=${!!r.body?.cores}`);
  r = await jget('/site/leiloeiro');
  check('GET /site/leiloeiro', r.status === 200);
  r = await jget('/site/menus');
  check('GET /site/menus', r.status === 200 && Array.isArray(r.body?.result));
  r = await jget('/site/banners?secao=home');
  check('GET /site/banners?secao=home', r.status === 200 && 'total' in (r.body || {}), `total=${r.body?.total}`);
  r = await jget('/site/banners?secao=popup');
  check('GET /site/banners?secao=popup (popup)', r.status === 200, `total=${r.body?.total}`);

  // Busca / filtros
  r = await jget('/buscador/filtros');
  const f = r.body || {};
  check('GET /buscador/filtros', r.status === 200 && 'categorias' in f && 'ufs' in f, `categorias=${f.categorias?.length ?? '?'}`);

  // Leilões
  r = await jget('/leiloes?limit=3');
  const temLeiloes = r.status === 200 && Array.isArray(r.body?.result) && 'total' in r.body;
  check('GET /leiloes (envelope)', temLeiloes, `total=${r.body?.total}`);
  const leilao = r.body?.result?.[0];
  if (leilao) {
    const r2 = await jget(`/leiloes/${leilao.slug || leilao.id}`);
    check('GET /leiloes/{idOrSlug}', r2.status === 200 && r2.body?.id, `id=${r2.body?.id}`);
    check('  leilão tem campos essenciais', !!(leilao.titulo !== undefined && leilao.statusLabel && '_urls' in (r2.body || {})));
  } else check('GET /leiloes/{idOrSlug}', false, 'sem leilões pra testar');

  // Lotes
  r = await jget('/lotes?limit=3');
  const lote = r.body?.result?.[0];
  check('GET /lotes (envelope)', r.status === 200 && Array.isArray(r.body?.result), `total=${r.body?.total}`);
  if (lote) {
    const r3 = await jget(`/lotes/${lote.slug || lote.id}`);
    check('GET /lotes/{idOrSlug}', r3.status === 200 && r3.body?.id, `bem=${!!r3.body?.bem}`);
    const r4 = await jget(`/lotes/${lote.id}/lances-publicos`);
    check('GET /lotes/{id}/lances-publicos', r4.status === 200 && 'result' in (r4.body || {}));
  } else check('GET /lotes/{idOrSlug}', false, 'sem lotes pra testar');

  // Filtros de lote (HTTP 200)
  for (const q of ['ano_min=2010&ano_max=2025', 'km_max=200000', 'marca=ford', 'area_edificada_min=10', 'bbox=-34,-74,5,-34', 'lat=-23.5&lng=-46.6&raio=50', 'uf=PR', 'categoria=1']) {
    const rr = await jget(`/lotes?${q}&limit=1`);
    check(`GET /lotes?${q}`, rr.status === 200, `total=${rr.body?.total}`);
  }

  // Agenda / comitentes
  r = await jget('/agenda/proximos?limit=3');
  check('GET /agenda/proximos', r.status === 200 && Array.isArray(r.body?.result));
  r = await jget('/comitentes?limit=3');
  check('GET /comitentes', r.status === 200 && Array.isArray(r.body?.result));

  // Formulários
  r = await jget('/contato/setores');
  check('GET /contato/setores', r.status === 200 && 'assuntos' in (r.body || {}) && 'departamentos' in (r.body || {}));
  r = await jpost('/contato', { nome: 'Spec', email: 'spec@example.com' }); // falta mensagem → 400
  check('POST /contato (validação 400)', r.status === 400 && r.body?.code === 'validation');
  r = await jpost('/newsletter', { email: 'invalido' });
  check('POST /newsletter (email inválido 400)', r.status === 400);

  // Venda Direta (WebsiteV2_VendaDireta) — vocabulário próprio, sem termos de leilão
  const PROIBIDO = /lei[lã]|lote|lance|arrematant/i;
  r = await jget('/venda-direta/eventos?limit=3');
  const evOk = r.status === 200 && Array.isArray(r.body?.result);
  check('GET /venda-direta/eventos (envelope)', evOk, `total=${r.body?.total}`);
  const ev = r.body?.result?.[0];
  if (ev) {
    check('  evento tem modos + statusLabel', !!(ev.modos && ev.statusLabel && 'dataLimitePropostas' in ev));
    check('  evento sem vocabulário de leilão', !PROIBIDO.test(JSON.stringify({ s: ev.statusLabel, t: Object.keys(ev) })));
    const rev = await jget(`/venda-direta/eventos/${ev.slug || ev.id}`);
    check('GET /venda-direta/eventos/{idOrSlug}', rev.status === 200 && rev.body?.id === ev.id);
    const ra = await jget(`/venda-direta/anuncios?evento=${ev.id}&limit=3`);
    check('GET /venda-direta/anuncios?evento=', ra.status === 200 && Array.isArray(ra.body?.result), `total=${ra.body?.total}`);
    const an = ra.body?.result?.[0];
    if (an) {
      check('  anúncio tem precoMinimo+modos+incremento', 'precoMinimo' in an && !!an.modos && 'incremento' in an);
      const ras = await jget(`/venda-direta/anuncios/${an.slug || an.id}`);
      check('GET /venda-direta/anuncios/{idOrSlug}', ras.status === 200 && ras.body?.id === an.id);
      const rof = await jget(`/venda-direta/anuncios/${an.id}/ofertas-publicas`);
      check('GET /venda-direta/anuncios/{id}/ofertas-publicas', rof.status === 200 && 'result' in (rof.body || {}));
    }
  }
  r = await jget('/venda-direta/buscador/filtros');
  check('GET /venda-direta/buscador/filtros', r.status === 200 && 'categorias' in (r.body || {}) && 'comitentes' in (r.body || {}));
  // Escrita exige Bearer → sem token deve negar (401/403)
  r = await jpost('/venda-direta/anuncios/1/oferta', { valor: 1 });
  check('POST /venda-direta/.../oferta sem auth (nega)', r.status === 401 || r.status === 403, `status=${r.status}`);

  // Relatório
  console.log(linhas.join('\n'));
  console.log(`\n${pass} passou, ${fail} falhou.\n`);
  process.exit(fail > 0 ? 1 : 0);
}

run().catch((e) => { console.error('Erro fatal no spec:', e.message); process.exit(2); });
