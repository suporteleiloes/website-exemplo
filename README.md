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
│   ├── api/sso/handoff       # BFF: ponte de sessão site → painel do arrematante — ver §8.1
│   └── api/proxy/[...path]   # BFF: proxy autenticado (anexa JWT do cookie)
├── components/               # UI (cards, filtros, galeria, banner, popup, lance, habilitação, auth)
├── lib/                      # config, types, api (fetch V2), auth (sessão), realtime (WS), format, img,
│                             # rota (URL canônica {id}-{slug}), externo (leilão de parceria) — ver §5.1,
│                             # painel (links pro painel do arrematante, SEMPRE via SSO) — ver §8.1
├── scripts/spec-endpoints.mjs# spec dos endpoints (npm run spec)
├── README.md                 # este arquivo
└── PENDENCIAS-API.md         # lacunas/melhorias encontradas na API
```

## 5. Páginas implementadas

| Rota | Conteúdo | Endpoints |
|---|---|---|
| `/` | Banners, popup, categorias, leilões em andamento/próximos, lotes em destaque, chamadas institucionais | `/site/banners`, `/buscador/filtros`, `/leiloes`, `/lotes` |
| `/leiloes` | Lista filtrável (situação, natureza, ano, busca, ordenação) + paginação | `/leiloes` |
| `/leilao/[idOrSlug]` — canônica `{id}-{slug}` (§5.1) | Dados completos, datas, local, modalidade, edital, comitente, visitação/pagamento/retirada, **habilitação**, lotes filtráveis | `/leiloes/{id}`, `/lotes?leilao=`, `/buscador/filtros` |
| `/lote/[idOrSlug]` — canônica `{id}-{slug}` (§5.1) | Galeria, specs, dados do veículo, **lance + histórico + tempo real**, anterior/próximo, relacionados | `/lotes/{id}`, `/lotes/{id}/lances-publicos`, `/lotes?leilao=` |
| `/login` | Login do arrematante | `/api/auth` (via BFF) |
| `/conta` | Meus dados, favoritos, lances, leilões habilitados | endpoints autenticados (via proxy) |
| `/quero-vender` | Formulário de quem quer vender bens (vira lead no CRM + Negócio no funil) | `/quero-vender`, `/site/config` |

### 5.1 ⛔ Três regras do catálogo (obrigatórias em qualquer site sobre a Website V2)

Não são preferências de estilo — cada uma nasceu de um problema real em produção.
Ao copiar este projeto, copie as três.

**1) URL de leilão/lote SEMPRE com ID: `{id}-{slug}`** — `lib/rota.ts`.

O slug é derivado do título e **muda** quando o leiloeiro edita o título no ERP; com URL
só-slug, todo link já divulgado (e-mail, WhatsApp, portal parceiro, anúncio pago, Google)
vira 404. Por isso o ID — imutável — é o prefixo, e o slug fica só como enfeite legível/SEO:

```
/leilao/352-leilao-de-simulacao      /lote/12345-fiat-uno-2010
```

Gere URL **só** por `hrefLeilao()` / `hrefLote()` (nunca `` `/lote/${l.slug}` `` na mão) e
resolva a rota dinâmica com `resolverPorIdOuSlug()`, que aceita `{id}-{slug}`, `{id}` puro e
`{slug}` puro — os links antigos continuam abrindo. Canonical/metadata e sitemap saem na
forma nova. *(Dívida conhecida: as telas de Venda Direta ainda linkam por slug puro.)*

**2) O STATUS MANDA, A DATA NÃO** — `lib/format.ts` (`leilaoEncerrado`, `dataNoPassado`).

Nunca derive "encerrado" de data vencida. Leilão com status ABERTO (3) / AO VIVO (4) e data
prevista no passado continua **aberto** no site — agenda desatualizada é problema do
leiloeiro. Só `status === 99` encerra. A data serve apenas pra formatar texto: onde haveria
contagem regressiva com data já vencida, mostre a **data prevista**.

**3) Leilão de parceria → redirecionamento externo** — `lib/externo.ts` +
`components/RedirecionamentoExterno.tsx`.

Quando a API manda `leilao.urlExterna` (campo "Leilão divulgação" do ERP; `urlExternaEmpresa`
= `comprei` | `outras`), o leilão é **divulgado** por nós mas **operado por outra
plataforma** — e `urlExterna` vem também no leilão aninhado do lote. Comportamento
obrigatório: o card do leilão **e o do lote** não abrem a página interna; abrem um modal de
aviso ("Você será redirecionado… será necessário cadastrar-se e habilitar-se no site de
destino") e, ao confirmar, navegam pra URL externa **na mesma aba**. As páginas de detalhe
(quem chegou por link direto/SEO) mostram a faixa de aviso e escondem o que é nosso —
habilitação, auditório e caixa de lance. Deixar o visitante achar que o lance é conosco faz
ele perder o leilão.

## 6. Componentes principais

`Header`/`Footer` (shell), `Banner` (carrossel) + `Popup` (modal 1x/sessão), `LeilaoCard`/`LoteCard`,
`FiltrosLeiloes`/`FiltrosLotes` (escrevem na URL), `Galeria` (lightbox simples), `LanceBox`
(lance REST + tempo real + histórico), `HabilitacaoBtn`, `Categorias`, `BuscaRapida`, `Estados`
(loading/vazio/erro), `Badge`, `RedirecionamentoExterno` (aviso de leilão de parceria — §5.1),
`auth/LoginForm` + `LogoutButton`.

## 7. Endpoints consumidos

**Públicos (Website V2):** `/site/config`, `/site/menus`, `/site/banners`, `/site/leiloeiro`,
`/buscador/filtros`, `/leiloes`, `/leiloes/{id}`, `/lotes`, `/lotes/{id}`, `/lotes/{id}/lances-publicos`,
`/agenda/proximos`, `/comitentes`, `/contato/setores`, `/contato`, `/newsletter`, `/quero-vender`.

**Autenticados (reuso, via BFF proxy):** `/api/auth`, `/api/auth/refresh`, `/api/auth/logout`, `/api/userCredentials`,
`/api/lotes/{id}/lance`, `/api/public/arrematantes/service/leiloes/{id}/habilitar`,
`/api/arrematantes/meusFavoritos`, `/api/arrematantes/service/historico/lances`,
`/api/arrematantes/service/leiloes`, `/api/public/globalconfigs` (clientId p/ WS),
`/api/sso/exchange` (handoff de sessão pro painel do arrematante — §8.1).

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

## 8.1 ⛔ Sessão única site ↔ painel (SSO) — obrigatório em qualquer site

**O problema.** O painel do arrematante (app-cliente) vive em **outro domínio** (`app.<tenant>`).
Cookie não atravessa domínio: quem estava logado no site chegava **deslogado** no painel. Era o caso do
botão "Auditório Virtual", que apontava direto pra `${PAINEL_URL}/auditorio/{id}` — o arrematante logado
caía numa tela pedindo login, justo na hora do pregão.

**A ponte** já existia na API: o **handoff SSO** — `POST /api/sso/exchange` (site, autenticado) devolve um
**código de troca de uso único (TTL 60s)**; `POST /api/auth/sso/redeem` (painel) troca esse código por uma
sessão. O que faltava era *usar* isso em todo link. Aqui o BFF que orquestra é
**`app/api/sso/handoff/route.ts`**.

### As duas camadas (implemente as duas — uma cobre a outra)

1. **No login (proativo).** Ao logar/cadastrar no site, o navegador passa por
   `/api/sso/handoff?redirect=/&voltar=<destino no site>`: o painel resgata o código, grava a sessão dele e
   **devolve o visitante pro site**. A partir daí o painel já está logado. É navegação de página inteira
   (`window.location`), não `router.push` — o destino é outro domínio.
   Onde: `components/auth/LoginForm.tsx`, `components/CadastroForm.tsx`.
2. **No link (auto-curativo).** Mesmo assim, **todo** link pro painel passa pelo handoff, via
   `hrefPainel()`. Motivo: a sessão do painel expira/é limpa em momento **diferente** da do site (TTLs e
   storages independentes, outro navegador, cache limpo). Sem esta camada, o dia em que a sessão do painel
   cair sozinha o problema volta — e nada se corrige. Custo: um redirect (~centenas de ms). Custo de errar:
   o arrematante não consegue dar lance.

### A regra

> **Nenhum link para o painel é escrito à mão.** Nada de `${PAINEL_URL}/rota` no JSX — sempre
> `hrefPainel()` (`lib/painel.ts`). É o que evita que cada link novo precise "lembrar" do SSO: quem escreve
> o link não precisa nem saber que existe SSO.

```tsx
import { hrefPainel, rotaAuditorio, rotaLotePainel } from '@/lib/painel';

<a href={hrefPainel('/')}>Meu painel</a>
<a href={hrefPainel('/meus-lances')}>Meus lances</a>
<a href={hrefPainel(rotaAuditorio(leilaoId), { publico: true })}>Auditório Virtual</a>
```

`hrefPainel()` devolve `''` quando `NEXT_PUBLIC_PAINEL_URL` não está configurado — o chamador esconde o
link (todos os pontos aqui já checam `PAINEL_URL`).

### Os dois parâmetros do handoff

- **`?anon=1`** (via `hrefPainel(rota, { publico: true })`) — o destino é rota **pública** no painel (hoje:
  o auditório). Visitante **sem** sessão vai direto pro painel em vez de ser mandado pro `/login`; visitante
  logado continua passando pelo handoff e chega logado. **Só** use em rota que o app-cliente declara
  pública — sem a flag, o handoff exige sessão.
- **`?voltar=<url>`** — URL **deste site** pra onde o painel devolve o visitante depois de resgatar o
  código. É o modo "propagar sessão e voltar" da camada 1.
  ⚠️ **Open-redirect:** `voltar` só aceita path interno ou URL absoluta http(s) do **mesmo domínio-raiz**
  (`sanitizarVoltar`/`dominioRaiz` no route handler). Sem essa checagem o parâmetro viraria vetor de
  phishing com o nosso domínio no meio do caminho. Não relaxe a validação ao adaptar pro site do cliente.

### Cuidados ao portar pra um site real

- **Mesmo tenant nos dois lados.** O código é resgatado **no tenant do painel** (DB-per-tenant):
  `NEXT_PUBLIC_TENANT` (site) tem de resolver o mesmo tenant que o `VITE_TENANT`/host do app. Em produção
  `leiloeiro.com.br` e `app.leiloeiro.com.br` são a mesma chave no `clients.php`; em dev, alinhe à mão.
- **Falha do handoff nunca sequestra a navegação:** no modo `voltar` o BFF devolve pro site; nos demais
  abre o painel sem código (ele pede login).
- **Logout é do par:** o redeem vincula as duas sessões pelo `pairId` — sair de um lado derruba o outro,
  preservando outros dispositivos.

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
