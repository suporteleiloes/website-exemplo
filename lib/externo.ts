/**
 * Helpers PUROS do LEILÃO DE PARCERIA (redirecionamento externo).
 *
 * Módulo NEUTRO de propósito: `components/RedirecionamentoExterno.tsx` é
 * `'use client'`, e tudo que um módulo cliente exporta vira "referência de
 * cliente" — não pode ser executado dentro de um Server Component (LeilaoCard,
 * LoteCard, página do leilão, todos server no App Router). Por isso a lógica
 * pura mora aqui e é importada pelos dois lados.
 */

/** Rótulo amigável das plataformas conhecidas (`leilao.urlExternaEmpresa`). */
const PLATAFORMAS: Record<string, string> = {
  comprei: 'Comprei',
  outras: 'site parceiro',
};

/**
 * Só devolve http(s) absoluto. Nada que vira `href` é aceito sem validar.
 * A API já sanitiza (`V2Sanitizer::urlExternaSafe` descarta `javascript:`,
 * `data:` e URL relativa), mas o componente é público: revalidamos aqui porque
 * defesa em profundidade custa 5 linhas e um XSS custa o cliente.
 */
export function urlExternaValida(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    return u.protocol === 'http:' || u.protocol === 'https:' ? u.toString() : null;
  } catch {
    return null;
  }
}

/** Nome do destino pro aviso: plataforma conhecida, senão o domínio da URL. */
export function nomeDestino(url: string, plataforma?: string | null): string {
  const conhecida = plataforma ? PLATAFORMAS[plataforma] : null;
  if (conhecida && plataforma !== 'outras') return conhecida;
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return 'site parceiro';
  }
}
