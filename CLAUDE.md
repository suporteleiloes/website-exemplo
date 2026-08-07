# exemplo-site — site público OFICIAL de exemplo (API Website V2)

> Este é o **exemplo oficial** de site público de leiloeiro consumindo a **API Website V2** do SL ERP.
> Repositório público: **https://github.com/suporteleiloes/website-exemplo**.
> Next.js 14 (App Router) + TypeScript + Tailwind. Tenant de referência: `leiloeiroexemplo`/`localhost`.

## ⛔ Regra Nº 1 — evolução sincronizada (API ↔ front ↔ doc ↔ este exemplo)

**Toda melhoria ou mudança que envolva uma característica do site DEVE, no mesmo ciclo:**

1. **Ser implementada/ajustada na API** (`../api-v2`, Website V2) quando o backend for afetado.
2. **Ser refletida na documentação oficial da API** (`../api-v2/docs/openapi/*` — OpenAPI regenerado, GUIA, README, CLAUDE.md) — REGRA Nº 1 da Website V2.
3. **Ser implementada AQUI, neste website-exemplo** (a feature tem que aparecer e funcionar no exemplo).
4. **Ser TESTADA** — build verde + `npm run spec` (contrato dos endpoints) + teste via browser (Playwright) da feature.
5. **Ser enviada ao git público** (`origin` = `git@github.com:suporteleiloes/website-exemplo.git`) com commit descritivo, **somente após autorização explícita do usuário** para o push.

> O exemplo-site é a vitrine viva da API: se uma capacidade existe na Website V2, ela deve ser
> demonstrável aqui. Cada evolução da API que toca o site evolui o exemplo junto, testada e publicada.

## Funcionalidades demonstradas

Catálogo (leilões, lotes, detalhe, busca, filtros, agenda, comitentes), **venda direta**
(eventos/anúncios/oferta/compre-já/proposta — `app/venda-direta/`, `components/vd/`), área logada
do arrematante (`/conta`, login, lance, habilitação via `/me/*`), **popup** promocional,
**atendimento** (chat nativo via `POST /api/public/inbound/webchat` + WhatsApp FAB —
`components/Atendimento.tsx`), **mapa de bens** (Leaflet + `/mapa` — `components/MapaBens.tsx`),
**contato** (`/contato`), **cadastro completo** de arrematante (`/cadastro` + BFF
`app/api/auth/cadastro`).

## ⛔ Três regras do catálogo (não regredir) — detalhe no `README.md §5.1`

1. **URL de leilão/lote SEMPRE com ID** (`/leilao/352-slug`, `/lote/12345-slug`): o slug é
   derivado do título, muda quando o leiloeiro edita o título no ERP e quebraria todo link já
   divulgado. Gerar só via `lib/rota.ts` (`hrefLeilao`/`hrefLote`) e resolver a rota dinâmica
   com `resolverPorIdOuSlug` (aceita `{id}-{slug}`, `{id}` e `{slug}` puro — compatibilidade).
2. **O status manda, a data não**: "encerrado" é SÓ `status === 99`. Jamais derivar de data
   vencida — leilão aberto com data prevista no passado segue ABERTO; onde haveria contador
   com data vencida, mostrar a data prevista. Helpers em `lib/format.ts`.
3. **Leilão de parceria** (`leilao.urlExterna`, PUBLIC): card de leilão e de lote não abrem a
   página interna — modal de aviso e, ao confirmar, navegação pra URL externa na mesma aba.
   Nas páginas de detalhe, faixa de aviso + habilitação/auditório/lance escondidos.
   `lib/externo.ts` + `components/RedirecionamentoExterno.tsx`.

## ⛔ Sessão única site ↔ painel — nenhum link pro painel escrito à mão

O painel do arrematante (app-cliente) vive em **outro domínio** (`app.<tenant>`) e cookie não atravessa
domínio: linkar `${PAINEL_URL}/rota` direto no JSX faz o visitante **logado no site** chegar **deslogado**
no painel (era o caso do botão "Auditório Virtual"). A ponte é o **handoff SSO**
(`app/api/sso/handoff/route.ts` → `/api/sso/exchange` na API → `/api/auth/sso/redeem` no painel).

Duas camadas, ambas obrigatórias: **no login/cadastro** o navegador passa pelo handoff com `?voltar=` (já
deixa o painel logado) e **em todo link** o destino passa por **`hrefPainel()`** (`lib/painel.ts`) — porque
a sessão do painel expira em momento diferente da do site e sem essa camada o problema volta sozinho.
`hrefPainel(rota, { publico: true })` → `?anon=1` para destinos públicos do painel (auditório).
`?voltar=` só aceita URL do mesmo domínio-raiz (anti open-redirect) — não relaxar.

**Detalhe completo, com os porquês e os cuidados de portabilidade: `README.md §8.1`.**

## ⛔ Selo da SL + LGPD — não remover ao copiar o template

Todo site nascido daqui carrega duas camadas obrigatórias (**detalhe e porquês: `README.md §16`**):

1. **Selo da Suporte Leilões** no rodapé — `components/SeloSL.tsx` (arte em
   `static.suporteleiloes.com.br/selo.png`, link em nova aba, `width`/`height` explícitos).
2. **LGPD**: banner de consentimento (`components/BannerCookies.tsx` + gate em
   `lib/consentimento.ts`), link "Preferências de cookies" no rodapé (revogar tem de ser tão fácil
   quanto aceitar) e as páginas `/politica-de-privacidade`, `/aviso-de-cookies`, `/termos-de-uso` —
   conteúdo do **CMS** do tenant (`GET /pages/{slug}`) com texto **MODELO** parametrizado por
   `/site/config` no fallback.

**`lib/consentimento.ts` é o CONTRATO CANÔNICO da plataforma** — todo site novo copia este shape:
`localStorage["consentimento_cookies_v2"] = { versao: 2, decididoEm, categorias: { necessarios,
preferencias, medicao, marketing } }`. Banner binário, registro granular (dá para evoluir para tela
de categorias sem trocar o formato). ⚠️ Mudou categoria/escopo/formato ⇒ **sobe a versão da chave
(`_v3`)** + `VERSAO_CONSENTIMENTO` + `/aviso-de-cookies`, no mesmo commit. Estado da convergência dos
sites de cliente: tabela no README §16.2 (vix/taba/gustavo já em `_v2`; `lancevip` não deve ser
mexido — tem infra própria e o repo é editado pelo cliente).

> **Contrato:** ⛔ nenhum script não-essencial carrega antes do consentimento — use
> `quandoAutorizado(categoria, fn)`/`permite(categoria)`, nunca `<script>` de terceiro solto no
> layout. **Aviso:** o texto legal MODELO **exige revisão jurídica do leiloeiro antes do go-live** —
> o caminho certo é o cliente cadastrar o documento dele no CMS.

## Arquitetura (resumo)

- **BFF auth**: JWT/refresh em cookies httpOnly (`app/api/auth/*`), proxy autenticado
  (`app/api/proxy/[...path]`) anexa Bearer + header `Uloc-Mi`. O browser nunca vê o token.
- **lib/**: `config` (env), `api` (fetch V2 tipado), `vd` (venda direta), `auth`, `realtime`,
  `format`, `img`, `cookies`, `rota` (URL canônica), `externo` (leilão de parceria),
  `painel` (links pro painel do arrematante — SEMPRE via handoff SSO).
  Tipos reais em `lib/types.ts`.
- **Spec = contrato vivo**: `npm run spec` (`scripts/spec-endpoints.mjs`) — rodar a cada mudança.

## Como rodar

```bash
npm install
cp .env.local.example .env.local        # ajuste NEXT_PUBLIC_* se necessário
npm run dev                              # http://localhost:3100 (seta NODE_TLS_REJECT_UNAUTHORIZED=0 p/ cert dev)
npm run spec                             # valida os endpoints da Website V2
npm run build                            # build de produção
```

> **Gotcha dev:** não intercale `npm run build` com `npm run dev` no mesmo `.next` (corrompe o
> manifesto de chunks → CSS/JS 404). Use um ou outro; se quebrar, `rm -rf .next` e reinicie.

## Pré-requisitos no tenant (para todas as features funcionarem)

- Branding/banners: comando `app:website:seed-demo` na API.
- Atendimento: `crm_widget_config` (slug = `NEXT_PUBLIC_WIDGET_SLUG`, `bot_ativo=1`, `ativo=1`,
  `deleted=0`) + `app_global_config site.features.chat=1` + `ANTHROPIC_API_KEY` na API.
