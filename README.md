# exemplo-site — POC de site público de leiloeiro (API Website V2)

Prova de conceito **funcional** de um site público de leilões consumindo a **API Website V2** do SL ERP.
Serve como: exemplo técnico de consumo, base para novos sites, validação da documentação da API e
identificação de lacunas. Construído em **Next.js 14 (App Router) + TypeScript + Tailwind**.

> Status: **funcional ponta a ponta contra a API real** (build verde; spec 25/25; páginas renderizam dados reais do tenant `leiloeiroexemplo`/`localhost`). Lacunas encontradas em [`PENDENCIAS-API.md`](./PENDENCIAS-API.md).

---

## 1. Como instalar

```bash
cd /Users/tiagofelipe/src/sl/v5/exemplo-site
npm install
cp .env.local.example .env.local   # ajuste se necessário
```

Requisitos: Node 18+. A API Website V2 precisa estar no ar (dev local: `https://localhost:8001`).

## 2. Como configurar a URL da API

Edite `.env.local`:

| Variável | Default | O quê |
|---|---|---|
| `NEXT_PUBLIC_API_BASE` | `https://localhost:8001` | URL base da API (sem `/` no fim) |
| `NEXT_PUBLIC_TENANT` | `localhost` | Slug do leiloeiro (header `Uloc-Mi`) |
| `NEXT_PUBLIC_REALTIME_URL` | *(vazio)* | Gateway WebSocket (`wss://realtime.suporteleiloes.com.br:8446`). Vazio = polling |

> A API dev usa certificado **self-signed**. Os scripts `dev`/`spec` já setam `NODE_TLS_REJECT_UNAUTHORIZED=0`. **Nunca** use isso em produção.

## 3. Como rodar localmente

```bash
npm run dev      # http://localhost:3100
npm run build    # build de produção
npm start        # serve o build
npm run spec     # valida os endpoints da API (spec — ver item 12)
```

## 3.1 Testar o fluxo do arrematante (E2E)

Prepare suas próprias contas de teste na base local a partir de arrematantes existentes, com o
comando da API (na pasta `../api-v2`). Use um apelido **aprovado** e um **reprovado** para cobrir
os dois caminhos:

```bash
# aprovado → login + habilitação + lance OK
php -d memory_limit=1G bin/console app:arrematante:preparar-teste --arrematante=<id> --senha=<senha> --status=aprovado
# reprovado → login OK, lance bloqueado ("não está apto")
php -d memory_limit=1G bin/console app:arrematante:preparar-teste --arrematante=<id> --senha=<senha> --status=reprovado
```

Roteiro: abrir `http://localhost:3100/login` → entrar com o apelido/senha preparados → `/conta`
mostra dados/lances/habilitações reais → abrir um lote de um leilão **aberto** → **Habilitar-se**
→ **Dar lance**. Ou criar uma conta do zero em `/cadastro`.

> Login tem rate-limit (10 tentativas/5min por IP) — se bloquear, aguarde alguns minutos.

## 4. Estrutura de pastas

```
exemplo-site/
├── app/                      # rotas (App Router)
│   ├── layout.tsx            # shell: header (site/config + menus) + footer + sessão
│   ├── page.tsx              # HOME (banners, popup, destaques, andamento, próximos, categorias)
│   ├── leiloes/page.tsx      # lista de leilões + filtros + paginação
│   ├── leilao/[idOrSlug]/    # detalhe do leilão + lotes + habilitação
│   ├── lote/[idOrSlug]/      # detalhe do lote + galeria + lance + histórico + relacionados
│   ├── login/page.tsx        # login
│   ├── conta/page.tsx        # área logada (dados, favoritos, lances, habilitados)
│   ├── api/auth/login        # BFF: autentica e seta cookies httpOnly (access + refresh)
│   ├── api/auth/refresh      # BFF: troca o refresh token por um novo par (rotação de uso único)
│   ├── api/auth/logout       # BFF: revoga sessão + limpa cookies
│   └── api/proxy/[...path]   # BFF: proxy autenticado (anexa JWT do cookie)
├── components/               # UI (cards, filtros, galeria, banner, popup, lance, habilitação, auth)
├── lib/                      # config, types, api (fetch V2), auth (sessão), realtime (WS), format, img
├── scripts/spec-endpoints.mjs# spec dos endpoints (npm run spec)
├── README.md                 # este arquivo
└── PENDENCIAS-API.md         # lacunas/melhorias encontradas na API
```

## 5. Páginas implementadas

| Rota | Conteúdo | Endpoints |
|---|---|---|
| `/` | Banners, popup, categorias, leilões em andamento/próximos, lotes em destaque, chamadas institucionais | `/site/banners`, `/buscador/filtros`, `/leiloes`, `/lotes` |
| `/leiloes` | Lista filtrável (situação, natureza, ano, busca, ordenação) + paginação | `/leiloes` |
| `/leilao/[idOrSlug]` | Dados completos, datas, local, modalidade, edital, comitente, visitação/pagamento/retirada, **habilitação**, lotes filtráveis | `/leiloes/{id}`, `/lotes?leilao=`, `/buscador/filtros` |
| `/lote/[idOrSlug]` | Galeria, specs, dados do veículo, **lance + histórico + tempo real**, anterior/próximo, relacionados | `/lotes/{id}`, `/lotes/{id}/lances-publicos`, `/lotes?leilao=` |
| `/login` | Login do arrematante | `/api/auth` (via BFF) |
| `/conta` | Meus dados, favoritos, lances, leilões habilitados | endpoints autenticados (via proxy) |
| `/quero-vender` | Formulário de quem quer vender bens (vira lead no CRM + Negócio no funil) | `/quero-vender`, `/site/config` |

## 6. Componentes principais

`Header`/`Footer` (shell), `Banner` (carrossel) + `Popup` (modal 1x/sessão), `LeilaoCard`/`LoteCard`,
`FiltrosLeiloes`/`FiltrosLotes` (escrevem na URL), `Galeria` (lightbox simples), `LanceBox`
(lance REST + tempo real + histórico), `HabilitacaoBtn`, `Categorias`, `BuscaRapida`, `Estados`
(loading/vazio/erro), `Badge`, `auth/LoginForm` + `LogoutButton`.

## 7. Endpoints consumidos

**Públicos (Website V2):** `/site/config`, `/site/menus`, `/site/banners`, `/site/leiloeiro`,
`/buscador/filtros`, `/leiloes`, `/leiloes/{id}`, `/lotes`, `/lotes/{id}`, `/lotes/{id}/lances-publicos`,
`/agenda/proximos`, `/comitentes`, `/contato/setores`, `/contato`, `/newsletter`, `/quero-vender`.

**Autenticados (reuso, via BFF proxy):** `/api/auth`, `/api/auth/refresh`, `/api/auth/logout`, `/api/userCredentials`,
`/api/lotes/{id}/lance`, `/api/public/arrematantes/service/leiloes/{id}/habilitar`,
`/api/arrematantes/meusFavoritos`, `/api/arrematantes/service/historico/lances`,
`/api/arrematantes/service/leiloes`, `/api/public/globalconfigs` (clientId p/ WS).

## 8. Fluxo de autenticação

Padrão **BFF** (o JWT nunca chega ao browser — mitiga XSS):

1. `LoginForm` → `POST /api/auth/login` (route handler) → chama `POST /api/auth` na API.
2. Sucesso → grava o **access JWT** num cookie httpOnly (`sl_jwt`) e o **refresh token** noutro cookie
   httpOnly (`sl_refresh`), e devolve só dados não-sensíveis. O `maxAge` de cada cookie é derivado das
   datas `expires`/`refreshExpires` da resposta (`lib/cookies.ts`) — sem TTL hardcoded no front.
3. Server Components leem o cookie via `lib/auth.ts` (`getSessionUser` → `GET /api/userCredentials`).
4. Chamadas autenticadas do browser passam por `/api/proxy/[...path]`, que anexa o `Bearer` server-side.
5. Renovação → `POST /api/auth/refresh` (route handler) → chama `POST /api/auth/refresh` na API com o
   cookie `sl_refresh`; recebe `{ token, expires, refreshToken, refreshExpires }` e regrava os dois
   cookies. Refresh inválido/expirado → 401 + cookies limpos (sessão encerrada).
6. Logout → `POST /api/auth/logout` revoga a sessão (invalida também o refresh) e limpa os dois cookies.

> **Refresh token existe e a POC já o usa.** Contrato da API (decisão de 2026-06-09): access JWT de
> **24h** + refresh token **opaco de 30 dias, de uso único** (rotacionado a cada troca — o anterior passa
> a dar 401). Endpoint `POST /api/auth/refresh` com body `{ "refreshToken": "..." }`, header `Uloc-Mi`,
> **sem** `Authorization`. TTLs configuráveis por tenant (`auth.access_token.ttl`,
> `auth.refresh_token.ttl`, `auth.refresh_token.enabled`). Detalhes em
> `../api-v2/docs/openapi/GUIA-WEBSITE-V2.md` §2 ("Renovar a sessão").
>
> Escopo do que a POC implementa: login/cadastro guardam o refresh, a rota BFF `/api/auth/refresh` faz a
> troca e o logout limpa tudo. O que **ainda não** está implementado é o *disparo automático* — não há
> retry transparente no `/api/proxy` nem timer de renovação; hoje a renovação precisa ser chamada
> explicitamente (ex.: ao receber 401). Num site real, plugar isso no proxy é o passo seguinte.

## 9. Fluxo de lance

`LanceBox` (`/lote/[id]`): valida logado → mostra lance atual + input (mín. `valorAtual+incremento`) →
`POST /api/proxy/lotes/{id}/lance` → trata sucesso/erro retornado pela API (que valida habilitação/regras) →
atualiza histórico. Se não logado, CTA "Entrar para dar lance".

## 10. Fluxo de habilitação

`HabilitacaoBtn` (`/leilao/[id]`): aceite das condições → `POST /api/proxy/public/arrematantes/service/leiloes/{id}/habilitar`
→ `status:true` = habilitado / `false` = em análise. Se não logado, CTA de login.

## 11. Uso de WebSocket

`lib/realtime.ts` conecta no gateway (`NEXT_PUBLIC_REALTIME_URL?token=<loginHash>&client=<clientId>`),
faz subscribe ao tenant e escuta `lance`/`lancesZerados`/`lanceDeletado` pra atualizar o `LanceBox`.
Sem `REALTIME_URL`, cai em **polling** de `/lances-publicos` a cada 8s. O `clientId` vem de
`/api/public/globalconfigs`. (Ver lacunas de WS em dev no PENDENCIAS.)

## 12. Filtros implementados

- **Leilões** (`/leiloes`): situação (andamento/próximos/encerrados → `status`), natureza
  (judicial/extrajudicial/vendaDireta), ano, busca, ordenação.
- **Lotes** (`/leilao/[id]` e busca): categoria, subcategoria, UF, cidade, comitente, faixa de valor,
  busca, ordenação (número/menor/maior/mais vistos). A API ainda suporta imóvel (área/vagas/ocupado/
  finalidade), veículo (marca/modelo/ano/km/combustível/cor) e geo (bbox, lat+lng+raio) — expostos no
  spec; a UI pode evoluir pra usá-los.

## 13. Pendências encontradas na API

Lista completa e estruturada em [`PENDENCIAS-API.md`](./PENDENCIAS-API.md). Resumo: `/leiloes` não
filtra por UF/cidade/categoria/modalidade; WS sem URL pública por tenant em dev; sem conta de arrematante de teste pra validar a área logada;
ids de `categoria` do buscador podem não bater com o filtro `?categoria=`.

> Já **resolvido** na API (não é mais pendência): **refresh token** (`POST /api/auth/refresh`, access 24h
> + refresh opaco 30 dias com rotação de uso único — P4), `/lotes/{id}/vizinhos` (P3) e a fachada
> `/api/website/v2/me/*` (P5). A POC consome os três.

## 14. Melhorias recomendadas

Ver PENDENCIAS. Destaques: filtros de leilão por localização/modalidade; expor `realtimeUrl`+`clientId`
no `/site/config` (parcial — falta preencher a URL do gateway por tenant). No lado da POC (não da API):
plugar a renovação automática do access token via `/api/auth/refresh` no `/api/proxy` (retry em 401) —
o endpoint e a rota BFF já existem, falta só o disparo automático.

## 15. Como usar como base para um site real

1. `cp -r exemplo-site meu-site && cd meu-site && cp .env.local.example .env.local` (ajuste tenant/URL).
2. Troque branding por `GET /site/config` (já consumido) — preencha as chaves `site.*`/`leiloeiro.*` no admin.
3. Evolua os componentes/estilos (Tailwind + CSS vars já mapeiam as cores do leiloeiro).
4. Rode `npm run spec` sempre que a API mudar — é o **contrato vivo** dos endpoints de site.
5. Ative o WebSocket setando `NEXT_PUBLIC_REALTIME_URL` quando o gateway do tenant estiver disponível.

> A documentação canônica da API está em `../api-v2/docs/openapi/GUIA-WEBSITE-V2.md` e o aprendizado
> desta POC (evolutivo) em `../api-v2/docs/openapi/POC-EXEMPLO-SITE-APRENDIZADO.md`.
