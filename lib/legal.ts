/**
 * Dados do controlador usados nos textos legais MODELO.
 *
 * ⛔ NADA de nome, CNPJ, endereço ou e-mail de cliente hardcoded aqui. Tudo sai
 * de `GET /site/config` (o que o leiloeiro cadastrou no ERP) — este template é
 * copiado por dezenas de sites e um dado chumbado vaza de um cliente para outro.
 *
 * Quando um campo não está preenchido no ERP, o texto usa uma redação neutra
 * ("o titular deste site", "os canais de atendimento") em vez de inventar.
 */

import type { SiteConfig } from './types';

export interface DadosControlador {
  /** Como o site se identifica no texto legal. */
  nome: string;
  /** E-mail de contato/encarregado, se cadastrado. */
  email: string | null;
  /** Telefone de contato, se cadastrado. */
  telefone: string | null;
  /** Frase pronta com os canais disponíveis (nunca vazia). */
  canais: string;
}

export function dadosControlador(config: SiteConfig | null): DadosControlador {
  const nome = (config?.siteName || '').trim() || 'o titular deste site';
  const email = config?.contato?.email?.trim() || null;
  const telefone = config?.contato?.telefone?.trim() || null;

  const partes: string[] = [];
  if (email) partes.push(`pelo e-mail ${email}`);
  if (telefone) partes.push(`pelo telefone ${telefone}`);
  const canais = partes.length
    ? `${partes.join(' ou ')}, ou pela página de contato deste site`
    : 'pela página de contato deste site';

  return { nome, email, telefone, canais };
}
