/**
 * spec-seo — guarda de regressão do `lib/seo.ts`.
 *
 * Existe por causa de um P0 real: a API devolveu `siteUrl: "https://www.127.0.0.1"`
 * e o `new URL(caminho, cfg.siteUrl)` cru dentro do `generateMetadata` derrubou
 * TODAS as páginas de leilão e de lote no error boundary. Ver o cabeçalho de
 * `lib/seo.ts`.
 *
 * Duas asserções, e as duas importam:
 *   1. NENHUMA entrada — por pior que seja — pode lançar.
 *   2. Entrada BOA continua produzindo o canonical absoluto certo (não regride SEO).
 *
 * Rodar: `npm run spec:seo`
 */
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const { baseSite, urlAbsoluta, canonicalDe } = await import(resolve(raiz, 'lib/seo.ts'));

const CAMINHO = '/leilao/1-um-leilao';

/** [entrada de siteUrl, urlAbsoluta esperada] */
const CASOS = [
  // ── devem ser REJEITADAS (degrada, nunca lança) ──
  ['https://www.127.0.0.1', undefined], // o valor que causou o P0
  [null, undefined],
  [undefined, undefined],
  ['', undefined],
  ['   ', undefined],
  ['lixo aleatório', undefined],
  ['http://', undefined],
  ['javascript:alert(1)', undefined],
  ['ftp://site.com.br', undefined],
  ['http://localhost:3000', undefined],
  ['https://127.0.0.1', undefined],
  ['https://intranet', undefined],
  // ── devem ser ACEITAS (SEO preservado) ──
  ['https://site.com.br', `https://site.com.br${CAMINHO}`],
  ['https://www.site.com.br/', `https://www.site.com.br${CAMINHO}`],
  ['  https://www.site.com.br  ', `https://www.site.com.br${CAMINHO}`],
  ['www.site.com.br', `https://www.site.com.br${CAMINHO}`], // sem esquema → recupera
  ['//site.com.br', `https://site.com.br${CAMINHO}`], // protocol-relative → assume https
  ['http://site.com.br', `http://site.com.br${CAMINHO}`],
];

let falhas = 0;
for (const [entrada, esperado] of CASOS) {
  let obtido;
  let erro = null;
  try {
    obtido = urlAbsoluta(CAMINHO, entrada);
  } catch (e) {
    erro = e;
  }
  const ok = !erro && obtido === esperado;
  if (!ok) falhas++;
  const rotulo = String(JSON.stringify(entrada)).padEnd(30);
  const saida = erro ? `LANÇOU ${erro.message}` : JSON.stringify(obtido);
  console.log(`${ok ? '  ok  ' : ' FALHA'} ${rotulo} -> ${saida}${ok ? '' : ` (esperado ${JSON.stringify(esperado)})`}`);
}

// `canonicalDe` precisa devolver `{}` (e não `{ alternates: { canonical: undefined } }`),
// senão o Next serializa um canonical vazio.
const bom = canonicalDe(CAMINHO, 'https://site.com.br');
const ruim = canonicalDe(CAMINHO, 'https://www.127.0.0.1');
if (bom?.alternates?.canonical !== `https://site.com.br${CAMINHO}`) { falhas++; console.log(' FALHA canonicalDe com siteUrl bom'); }
if (Object.keys(ruim).length !== 0) { falhas++; console.log(' FALHA canonicalDe com siteUrl ruim deveria devolver {}'); }
if (baseSite('https://www.site.com.br/qualquer/coisa') !== 'https://www.site.com.br') { falhas++; console.log(' FALHA baseSite deveria devolver só a origem'); }

console.log(falhas === 0 ? `\n✓ spec-seo: ${CASOS.length + 3} asserções OK` : `\n✗ spec-seo: ${falhas} falha(s)`);
process.exit(falhas ? 1 : 0);
