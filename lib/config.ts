// Configuração central da POC — lida de variáveis de ambiente.
// Ver .env.local.example.

export const API_BASE = (process.env.NEXT_PUBLIC_API_BASE || 'https://localhost:8001').replace(/\/$/, '');
export const TENANT = process.env.NEXT_PUBLIC_TENANT || 'localhost';
export const REALTIME_URL = process.env.NEXT_PUBLIC_REALTIME_URL || '';

// Prefixo da API pública Website V2.
export const V2 = `${API_BASE}/api/website/v2`;

// Header multi-tenant obrigatório em TODA chamada (resolve o banco do leiloeiro).
export const TENANT_HEADER = 'Uloc-Mi';

// Token DESTE site (multisite). O ERP dá um token por Site; o site manda no header X-TOKEN e a API
// devolve a config DESTE site (não de outro site do mesmo leiloeiro). Vazio = API usa GlobalConfig.
export const SITE_TOKEN = process.env.NEXT_PUBLIC_SITE_TOKEN || '';
export const SITE_TOKEN_HEADER = 'X-TOKEN';

// URL pública do site (canonical, sitemap, Open Graph). Configure por cliente em NEXT_PUBLIC_SITE_URL.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3200').replace(/\/$/, '');

// Slug do widget de atendimento (crm_widget_config) usado no chat do site.
export const WIDGET_SLUG = process.env.NEXT_PUBLIC_WIDGET_SLUG || 'leiloeiroexemplo';

// MODO EXEMPLO: quando ligado, o site ignora o branding do cliente (logo, banners, nome) e mostra
// a identidade NEUTRA do template — a "cara" do website-exemplo, independente do tenant.
// Cada cliente numa branch deixa isso desligado (default) pra herdar o próprio branding.
export const MODO_EXEMPLO = process.env.NEXT_PUBLIC_MODO_EXEMPLO === 'true';

// Cookies httpOnly do BFF — nunca expostos ao browser.
export const JWT_COOKIE = 'sl_jwt';        // access token (JWT, 24h)
export const REFRESH_COOKIE = 'sl_refresh'; // refresh token (opaco, 30 dias)
