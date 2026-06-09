// Configuração central da POC — lida de variáveis de ambiente.
// Ver .env.local.example.

export const API_BASE = (process.env.NEXT_PUBLIC_API_BASE || 'https://localhost:8001').replace(/\/$/, '');
export const TENANT = process.env.NEXT_PUBLIC_TENANT || 'localhost';
export const REALTIME_URL = process.env.NEXT_PUBLIC_REALTIME_URL || '';

// Prefixo da API pública Website V2.
export const V2 = `${API_BASE}/api/website/v2`;

// Header multi-tenant obrigatório em TODA chamada (resolve o banco do leiloeiro).
export const TENANT_HEADER = 'Uloc-Mi';

// Nome do cookie httpOnly onde guardamos o JWT do arrematante (BFF — nunca exposto ao browser).
export const JWT_COOKIE = 'sl_jwt';
