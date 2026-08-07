/**
 * Selo da Suporte Leilões — presente no rodapé de TODO site da plataforma.
 *
 * ── Por que existe um componente para uma imagem ─────────────────────────────
 * O selo é identidade da plataforma e vai em todos os sites. Se cada site
 * copiasse a `<img>` no JSX do próprio rodapé, trocar a arte, o link ou o texto
 * alternativo viraria uma varredura em N repositórios. Aqui é um ponto único:
 * o site que copia este template só usa `<SeloSL />` e nunca mais pensa nisso.
 *
 * ── Regras (não regredir) ────────────────────────────────────────────────────
 * - `width`/`height` explícitos e proporcionais à arte original (198×69), para
 *   o navegador reservar o espaço antes do download — sem layout shift (CLS).
 * - `<img>` puro, não `next/image`: é a convenção deste template (imagens da API
 *   e assets externos entram como `<img>`; ver `lib/img.ts`).
 * - `rel="noopener noreferrer"` no link em nova aba (o destino não ganha acesso
 *   à `window.opener` deste site).
 * - `loading="lazy"` — está no rodapé, nunca é conteúdo acima da dobra.
 */

/** Arte oficial. Hospedada por nós; não copiar para o repositório do site. */
export const SELO_URL = 'https://static.suporteleiloes.com.br/selo.png';
/** Destino do selo. */
export const SELO_LINK = 'https://www.suporteleiloes.com.br';

/** Proporção da arte original (198 × 69) — mantém o cálculo de altura honesto. */
const PROPORCAO = 69 / 198;

interface Props {
  /** Largura em px. Default 160 (tamanho de rodapé; discreto e legível). */
  largura?: number;
  /** Classes extras do wrapper (alinhamento/espaçamento no rodapé do site). */
  className?: string;
}

export default function SeloSL({ largura = 160, className = '' }: Props) {
  const altura = Math.round(largura * PROPORCAO);
  return (
    <a
      href={SELO_LINK}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-block opacity-90 transition hover:opacity-100 ${className}`}
      title="Site seguro — desenvolvido por Suporte Leilões"
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- asset externo fixo de 3 KB, fora do fold: `next/image` exigiria `remotePatterns` no config de cada site copiado, sem ganho. */}
      <img
        src={SELO_URL}
        alt="Site seguro, com SSL e monitoramento 24h — desenvolvido por Suporte Leilões"
        width={largura}
        height={altura}
        loading="lazy"
        decoding="async"
        style={{ width: largura, height: altura }}
      />
    </a>
  );
}
