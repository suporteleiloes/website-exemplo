# Pendências e melhorias da API Website V2 — encontradas pela POC

Levantadas construindo o `exemplo-site` contra a API real (tenant `lancevip`/`localhost`, 2026-06-09).
Formato: **tela/fluxo · endpoint · o que faltou · resposta ideal · sugestão**.

> Nada aqui **impediu** a POC de funcionar — todos os fluxos públicos estão operacionais. São lacunas
> que tornariam a construção de sites mais simples/completa.

---

## 🔴 Bloqueia funcionalidade pedida

### P1 — ✅ DECIDIDO (Opção B) — `/leiloes` não filtra por localização/categoria/modalidade
> Decisão (2026-06-09): o recorte geográfico/por-bem fica em **`/lotes`** (um leilão tipo Caixa tem lotes de várias cidades, então filtrar o *leilão* por cidade não faz sentido). A POC já faz a busca por lotes em `/lotes`. Nada a implementar.

- **Tela/fluxo:** página de Leilões; chips de categoria na Home.
- **Endpoint:** `GET /api/website/v2/leiloes`.
- **Faltou:** filtrar leilões por `uf`, `cidade`, `categoria`, `comitente`, **modalidade** (`tipo` online/presencial/simultâneo) e `instancia`. Esses recortes só existem em `/lotes` (são atributos do bem/lote, não do leilão).
- **Resposta ideal:** `/leiloes` aceitar `?uf=&cidade=&categoria=&tipo=&instancia=` (derivando dos lotes do leilão ou de metadados agregados), retornando os leilões que possuem lotes correspondentes.
- **Sugestão:** adicionar esses params em `/leiloes` (com `JOIN` em lotes) **ou** documentar oficialmente que o recorte por bem é feito em `/lotes`. *A POC contornou criando a página global `/lotes` (busca por lotes com os filtros ricos).*

### P2 — ✅ RESOLVIDO — Facets de `categorias` com shape inconsistente
> Corrigido: `/buscador/filtros` agora retorna `{id, nome, total}` em todas as facets. Subcategorias trazem o nome do TipoBem (antes só id numérico, sem como exibir). POC já usa o `nome`.

- **Tela/fluxo:** chips de categoria (Home) + select de categoria (filtros de lote).
- **Endpoint:** `GET /api/website/v2/buscador/filtros`.
- **Faltou:** `categorias` retorna `{ id: "Veículos", nome: null, total: 209 }` — o **`id` é o nome-string** e `nome` vem `null`. As demais facets (`ufs`, `comitentes`) devem ser conferidas pelo mesmo padrão.
- **Resposta ideal:** `{ id: <id|slug estável>, nome: "Veículos", total: 209 }` consistente, e o filtro `?categoria=` aceitar esse `id`.
- **Sugestão:** padronizar todas as facets como `{ id, nome, total }`. Hoje o filtro `?categoria=Veículos` funciona por coincidência (casa com `b.tipoPai` string); `?categoria=1` (id numérico) retorna 0.

---

## 🟠 Melhoria importante

### P3 — ✅ RESOLVIDO — Sem endpoint de lote anterior/próximo
> Adicionado `GET /api/website/v2/lotes/{id}/vizinhos` → `{anterior, proximo}` (2 queries). A POC usa no detalhe do lote (não baixa mais 60 lotes).

- **Tela/fluxo:** detalhe do lote (navegação ‹ anterior / próximo ›).
- **Endpoint:** não existe.
- **Faltou:** vizinhos do lote dentro do leilão.
- **Resposta ideal:** `GET /lotes/{id}/vizinhos` → `{ anterior: {id,slug}, proximo: {id,slug} }`.
- **Sugestão:** a POC busca até 60 lotes do leilão e calcula o índice (custoso e impreciso pra leilões grandes). Um endpoint dedicado resolve.

### P4 — ✅ RESOLVIDO — Refresh token
> Implementado. O JWT é **24h** (não 1h — era o cookie da POC que estava 1h, já corrigido pra 24h).
> Login agora devolve `refreshToken` (opaco, 30 dias). `POST /api/auth/refresh { refreshToken }` →
> novo access + novo refresh (rotação de uso único; o anterior → 401). Hash sha256 no servidor,
> revogável no logout, isolado por tenant. A POC guarda os 2 cookies httpOnly + route `/api/auth/refresh`.

### P5 — ✅ RESOLVIDO — Área logada com endpoints heterogêneos
> Criada a fachada **`/api/website/v2/me/*`** (`MeController`) reusando os repositórios existentes (sem duplicar regra, sem mexer nos endpoints antigos): `GET /me`, `/me/favoritos`, `/me/lances`, `/me/habilitacoes`, `/me/propostas`, `/me/documentos`. Escopo derivado do token. A POC `/conta` já consome. Validado E2E (GUILHERME: `/me` → perfil real; `/me/lances` e `/me/habilitacoes` com dados reais).

### P11 — (menor) Shape de imagem do banner difere de leilão/bem
- **Endpoint:** `GET /site/banners`.
- **Faltou:** `banner.image` vem como `{full: {url, resolution}}` (objeto aninhado), enquanto leilão/bem usam `{full: string|null}`. Inconsistência de contrato (a POC trata os dois no `urlImagem`).
- **Sugestão:** normalizar `serializeBanner` pra `{full, thumb, min}` (strings), igual aos demais.

- **Tela/fluxo:** `/conta` (favoritos, lances, habilitações).
- **Endpoints:** `/api/arrematantes/meusFavoritos`, `/api/arrematantes/service/historico/lances`, `/api/arrematantes/service/leiloes`, `/api/public/arrematantes/*` (mistura de prefixos e envelopes).
- **Faltou:** um namespace consolidado e shapes padronizados pra área logada do site.
- **Resposta ideal:** `/api/website/v2/me/{favoritos,lances,habilitacoes,propostas,documentos}` com o envelope padrão da V2.
- **Sugestão:** criar uma fachada `/me/*` reusando os endpoints existentes (sem duplicar regra), com escopo derivado do token.

### P6 — ✅ PARCIALMENTE RESOLVIDO — WebSocket sem URL pública por tenant
> `GET /site/config` agora expõe `realtime: { url, clientId }` (url via GlobalConfig `site.realtime.url`; clientId = domínio do tenant). A POC consome. **Falta** (decisão/infra): preencher a `site.realtime.url` do tenant e ter um gateway WS testável em dev.

- **Tela/fluxo:** lance ao vivo (tempo real).
- **Endpoint:** `GET /api/public/globalconfigs` entrega `clientId`, mas **não** a URL do gateway.
- **Faltou:** `realtimeUrl` por tenant + um ambiente WS testável em dev (em dev a POC cai em polling).
- **Resposta ideal:** `GET /site/config` expor `{ realtime: { url, clientId } }`.
- **Sugestão:** incluir `realtimeUrl` no `site/config`; o protocolo de eventos já está documentado no `GUIA-WEBSITE-V2.md §9`.

---

## ✅ Resolvido na 2ª rodada (E2E do arrematante)

### B1 — BUG corrigido: lance V2 quebrava 100% (`AuditLogSubscriber` cast de `Lote`)
- **Fluxo:** envio de lance autenticado (`POST /api/lotes/{id}/lance`).
- **Sintoma:** todo lance retornava `Object of class App\Entity\Leilao\Lote could not be converted to string`.
- **Causa:** `LanceTransaction` usa o `Lote` como `@Id` (identidade por associação). O `AuditLogSubscriber` (auditoria global) fazia `(string) $id` com `$id` sendo o objeto `Lote`. Bug **latente** — o caminho de lance da V2 nunca tinha sido exercido com a auditoria ativa.
- **Correção (api-v2):** normalizar id-objeto → id escalar em `src/EventListener/AuditLogSubscriber.php`. Cobre qualquer entidade com id por associação.

### P7 — RESOLVIDO: conta de arrematante de teste criada
- Criado o comando **`bin/console app:arrematante:preparar-teste --arrematante=<id> --senha=Teste@123 --status=aprovado|reprovado`** (api-v2) — reaproveita um arrematante real da base, define senha conhecida, habilita e ajusta status.
- **Contas de teste (tenant `localhost`/lancevip, senha `Teste@123`):** `TONINHO1` e `GUILHERME` (aprovados), `LEAO1` (reprovado).
- **Validado E2E pela POC:** login → `/conta` (33 leilões/habilitações reais) → habilitar no leilão 2653 → lance aprovado (id 96335, R$ 310.000); reprovado bloqueado; auto-cobertura de lance bloqueada (regra correta); rate-limit de login ativo.

### P10 — ✅ RESOLVIDO (era artefato de teste) — "Invalid User Client Session"
> Investigado a fundo: o claim `client` do JWT só diverge ("local" vs "localhost") quando login e
> validação usam caminhos de resolução de tenant diferentes. Os caminhos REAIS (header `Uloc-Mi` e
> `Referer`) já produzem o slug canônico e validam cross-path — em produção sempre tem `Uloc-Mi`/Referer,
> então funciona. O único caso "local" era o degenerado SEM nenhum header (default `USER_CLIENT=local`
> do `.env.local`), que eu disparei nos meus próprios testes curl. **Fix = só o default de dev**
> (`.env.local` → `localhost`); o `public/index.php` (entry point multi-tenant) ficou **intocado** →
> zero risco. Para integração server-to-server: sempre enviar `Uloc-Mi`.
> *(O GET de status de habilitação compartilha a mesma causa — resolvido junto.)*
- **Sugestão:** aceitar o mesmo Bearer JWT no GET de status (hoje parece exigir um header/sessão de cliente adicional).

## 🟡 Dados de ambiente (não é bug de API)

### P8 — Branding do site não preenchido no tenant
- **Tela:** shell (cores/logo/nome).
- **Endpoint:** `GET /site/config`.
- **Faltou:** chaves `site.*` preenchidas (cores caem no default `#1A4DB3`; `siteName` null). O **logo funcionou** via fallback `empresa.logomarca`.
- **Sugestão:** preencher as chaves `site.*`/`leiloeiro.*` (já registradas no `ConfigurationSetup`) no admin do tenant.

### P9 — Banners e popup vazios no tenant
- **Tela:** Home (banner/popup).
- **Endpoint:** `GET /site/banners`.
- **Faltou:** banners `secao=home` e `secao=popup` cadastrados (a POC mostra um hero institucional de fallback).
- **Sugestão:** cadastrar banners de exemplo para validar visualmente.

---

## ✅ O que a API entregou perfeitamente (sem pendência)

`/site/config` (com fallbacks), `/site/menus`, `/site/leiloeiro`, `/leiloes` + detalhe (campos ricos:
status, modalidade, datas, leiloeiro, `_urls.edital/auditorio`, comitentes), `/lotes` + detalhe (bem
nested, fotos, veículo com marca/modelo/cor/combustível, placa/chassi mascarados), **`/lotes/{id}/lances-publicos`**
(histórico real com apelido/valor/data — validado no lote 986 com 11 lances), filtros de lote completos
(categoria, uf, cidade, comitente, faixa de valor, **imóvel** área/vagas/ocupado/finalidade, **veículo**
marca/modelo/ano/km/combustível/cor, **geo** bbox/raio), `/buscador/filtros`, `/agenda/proximos`,
`/comitentes`, `/contato` (cria atendimento real) + `/contato/setores` + `/newsletter`, envelope e erros
padronizados. **Spec automatizado: 25/25 passam** (`npm run spec`).
