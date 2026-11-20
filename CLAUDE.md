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

## ⛔ Cache dos dados da API: cache LOCAL da Cloudflare, nunca o cache de dados do Next/R2 (2026-11-20)

`lib/api.ts → apiGet` passa por `lib/api-cache.ts (buscarComCache)`: dados da Website V2 ficam no **Cache API da Cloudflare** (por data center) por `revalidate` segundos; se a API falhar (5xx/timeout), serve a última cópia por até **10 min**; se o próprio cache falhar, busca direto na API. **Não use `next: { revalidate }` nem `fetch` com cache do Next para dados da API.**

**Por quê (incidente de 20/11/2026):** o incremental cache do OpenNext no R2 passou a recusar gravações (`Failed to set to cache` 10043 erro interno / 10058 gravação concorrente no mesmo objeto). Quando a gravação falha, o Next serve a versão antiga **para sempre**: capa e ordem de lote desatualizadas por horas, em vários sites ao mesmo tempo. O Cache API não tem limite de escrita concorrente e falha "aberto". Carga na API: no máximo ~1 chamada por URL a cada `revalidate` s por data center (poucos atendem o Brasil).

**Ao criar ou atualizar um site a partir deste exemplo:** copie `lib/api-cache.ts` e mantenha o `apiGet` usando `buscarComCache`. Conferência: Workers Observability do worker sem `Failed to set to cache`; 2ª carga da página ~ms. Decisão registrada na documentação interna da SL.

## ⛔ Visitas: direto do navegador para a borda, nunca pelo BFF (2026-11-20)

`components/RegistrarVisita.tsx` manda a visita do **navegador** para `${API_BASE}/api/website/v2/visitas/registrar` com `sendBeacon` + `text/plain` (sem preflight) e o tenant no corpo (`mi`). Em produção quem responde é um Worker da Cloudflare (204 na hora, fila, lote para a API): **zero PHP por clique**. Regras:
- **Não passe pelo BFF (`/api/proxy`)**: gastaria uma execução do Worker do site e uma chamada da API por clique.
- **Leilão com `status` 4 (em pregão) não registra visita**: passe `leilaoStatus`.
- Só use `POST /lotes/{id}/visita` se a tela **mostra o número atualizado na hora** (ele lê o total).

Detalhes e limites: GUIA-WEBSITE-V2 → "Visitas".

## Arquitetura (resumo)

- **BFF auth**: JWT/refresh em cookies httpOnly (`app/api/auth/*`), proxy autenticado
  (`app/api/proxy/[...path]`) anexa Bearer + header `Uloc-Mi`. O browser nunca vê o token.
- **lib/**: `config` (env), `api` (fetch V2 tipado), `vd` (venda direta), `auth`, `realtime`,
  `format`, `img`, `cookies`. Tipos reais em `lib/types.ts`.
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
