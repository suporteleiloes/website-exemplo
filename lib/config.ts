// Configuração central da POC — lida de variáveis de ambiente.
// Ver .env.local.example.

export const API_BASE = (process.env.NEXT_PUBLIC_API_BASE || 'https://localhost:8001').replace(/\/$/, '');
export const TENANT = process.env.NEXT_PUBLIC_TENANT || 'localhost';
export const REALTIME_URL = process.env.NEXT_PUBLIC_REALTIME_URL || '';

// Prefixo da API pública Website V2.
export const V2 = `${API_BASE}/api/website/v2`;

// Header multi-tenant obrigatório em TODA chamada (resolve o banco do leiloeiro).
export const TENANT_HEADER = 'Uloc-Mi';

// URL do PAINEL do arrematante = aplicativo-cliente NOVO (`app.<dominio>`).
// ⚠️ NUNCA o arrematante LEGADO (`arrematante.<dominio>`) — sites novos não podem
// nem saber que ele existe. O auditório é `/auditorio/{leilaoId}` no painel
// (NÃO usar `leilao._urls.auditorio` da API, que aponta pro legado hash-routing).
// ⛔ NUNCA monte um link com esta constante (`${PAINEL_URL}/rota`): o painel está em
// OUTRO domínio e a sessão não atravessa — todo link vai por `hrefPainel()`
// (`lib/painel.ts`), que passa pelo handoff SSO. Use PAINEL_URL só pra checar se há
// painel configurado. Ver README §8.1.
export const PAINEL_URL = (process.env.NEXT_PUBLIC_PAINEL_URL || '').replace(/\/$/, '');

// Slug do widget de atendimento (crm_widget_config) usado no chat do site.
export const WIDGET_SLUG = process.env.NEXT_PUBLIC_WIDGET_SLUG || 'leiloeiroexemplo';

// Cookies httpOnly do BFF — nunca expostos ao browser.
export const JWT_COOKIE = 'sl_jwt';        // access token (JWT, 24h)
export const REFRESH_COOKIE = 'sl_refresh'; // refresh token (opaco, 30 dias)
