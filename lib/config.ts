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
// nem saber que ele existe. O auditório é `${PAINEL_URL}/auditorio/{leilaoId}`
// (NÃO usar `leilao._urls.auditorio` da API, que aponta pro legado hash-routing).
export const PAINEL_URL = (process.env.NEXT_PUBLIC_PAINEL_URL || '').replace(/\/$/, '');

// Slug do widget de atendimento (crm_widget_config) usado no chat do site.
export const WIDGET_SLUG = process.env.NEXT_PUBLIC_WIDGET_SLUG || 'leiloeiroexemplo';

// Cookies httpOnly do BFF — nunca expostos ao browser.
export const JWT_COOKIE = 'sl_jwt';        // access token (JWT, 24h)
export const REFRESH_COOKIE = 'sl_refresh'; // refresh token (opaco, 30 dias)
