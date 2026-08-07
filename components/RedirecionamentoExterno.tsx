'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { urlExternaValida, nomeDestino } from '@/lib/externo';

/**
 * LEILÃO DE PARCERIA — REDIRECIONAMENTO PARA SITE EXTERNO
 * ────────────────────────────────────────────────────────────────────────────
 * Quando o leilão tem o campo "Leilão divulgação" preenchido no ERP
 * (`extra.urlExterna` → a API expõe `leilao.urlExterna` + `leilao.urlExternaEmpresa`
 * no nível PUBLIC), o pregão é operado por OUTRO leiloeiro/plataforma. Nós apenas
 * DIVULGAMOS o evento. Então o site é obrigado a:
 *
 *   - NÃO abrir a página interna do leilão/lote (estaria vazia e, pior, daria a
 *     entender que o lance é conosco — o visitante perderia o leilão);
 *   - abrir um aviso explicando que ele vai sair do nosso site e que precisa se
 *     cadastrar/habilitar no site de destino;
 *   - ao confirmar, navegar pra URL externa NA MESMA ABA (espelha o comportamento
 *     do ERP/site legado, que os leiloeiros e o público já conhecem).
 *
 * Se um dia a decisão mudar pra nova aba, troque o `<a href>` do "Continuar" por
 * `window.open(url, '_blank', 'noopener,noreferrer')` — em UM lugar só.
 *
 * Onde este componente entra (ver LeilaoCard/LoteCard e as páginas de detalhe):
 *   - `LinkRedirecionamento` (default) → substitui o `<Link>` do card;
 *   - `AvisoLeilaoParceria`           → faixa na página de detalhe, pra quem
 *                                        chegou por link direto/SEO sem passar
 *                                        pelo card.
 */

export interface AvisoProps {
  url: string;
  /** `leilao.urlExternaEmpresa` — 'comprei' | 'outras' | null. */
  plataforma?: string | null;
  aberto: boolean;
  onFechar: () => void;
}

/**
 * Modal de aviso. Renderizado só quando `aberto`.
 *
 * ⚠️ VAI EM PORTAL NO `document.body` — NÃO É OPCIONAL, e não é firula.
 * O gatilho mora DENTRO do card, e card costuma ganhar `transform` no hover
 * (elevação/escala — é o efeito mais comum numa grade de leilões). Qualquer
 * ancestral com `transform` vira containing block: o `position: fixed` do
 * overlay deixa de ser relativo à VIEWPORT e passa a ser relativo AO CARD. O
 * modal aparece espremido dentro do card e "pula" a cada movimento do mouse,
 * porque o hover cria e destrói o transform — bug real reportado por cliente.
 * Renderizando fora da árvore do card, nenhum ancestral pode sequestrar o
 * `fixed`. O mesmo vale pra `filter`, `backdrop-filter`, `perspective`,
 * `contain` e `will-change`: todos criam containing block e quebram igual.
 * Se você copiou este site, NÃO troque o portal por um z-index maior.
 */
export function AvisoRedirecionamento({ url, plataforma, aberto, onFechar }: AvisoProps) {
  const continuarRef = useRef<HTMLAnchorElement>(null);
  // `document` não existe no SSR — o portal só pode montar depois da hidratação.
  const [montado, setMontado] = useState(false);
  useEffect(() => setMontado(true), []);

  useEffect(() => {
    if (!aberto) return;
    // Foco no botão primário + Esc pra fechar + trava do scroll do fundo:
    // o mínimo de acessibilidade pra um diálogo modal.
    continuarRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onFechar(); };
    document.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
    };
  }, [aberto, onFechar]);

  if (!aberto || !montado) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4"
      onClick={onFechar}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-redirecionamento"
        className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
        // Clique DENTRO do diálogo não pode fechar (o overlay é que fecha).
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="titulo-redirecionamento" className="mb-3 text-lg font-bold text-gray-800">
          Redirecionamento de site
        </h2>

        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-red-600">Atenção:</p>

        <p className="mb-2 text-sm text-gray-700">
          Você será redirecionado para o site responsável pelo leilão solicitado{' '}
          (<span className="font-bold">{nomeDestino(url, plataforma)}</span>).
        </p>
        <p className="mb-5 text-sm text-gray-600">
          Sendo assim, para participar deste leilão, será necessário cadastrar-se e
          habilitar-se no site de destino.
        </p>

        <div className="flex items-center justify-end gap-2">
          <button type="button" onClick={onFechar} className="btn-outline">
            Cancelar
          </button>
          {/* Âncora de verdade (não button): "abrir em nova aba" do usuário funciona. */}
          <a href={url} ref={continuarRef} className="btn-primary">
            Continuar
          </a>
        </div>
      </div>
    </div>,
    document.body,
  );
}

/**
 * Faixa de aviso pra PÁGINA DE DETALHE do leilão/lote de parceria — quem chegou
 * por link direto ou pelo Google não passou pelo card, então precisa ver aqui que
 * o pregão é de outro site.
 */
export function AvisoLeilaoParceria({
  url,
  plataforma,
  className = '',
}: {
  url: string;
  plataforma?: string | null;
  className?: string;
}) {
  const [aberto, setAberto] = useState(false);
  const destino = urlExternaValida(url);
  if (!destino) return null;

  return (
    <div className={`rounded-lg border border-amber-300 bg-amber-50 p-4 ${className}`}>
      <p className="text-sm font-bold text-gray-800">Este leilão é realizado em outro site</p>
      <p className="mt-1 text-sm text-gray-600">
        A condução deste leilão é do site{' '}
        <span className="font-semibold text-gray-800">{nomeDestino(destino, plataforma)}</span>. Para
        dar lances é necessário cadastrar-se e habilitar-se por lá.
      </p>
      <button type="button" onClick={() => setAberto(true)} className="btn-primary mt-3">
        Acessar site do leilão →
      </button>
      <AvisoRedirecionamento
        url={destino}
        plataforma={plataforma}
        aberto={aberto}
        onFechar={() => setAberto(false)}
      />
    </div>
  );
}

export interface LinkRedirecionamentoProps {
  url: string;
  plataforma?: string | null;
  className?: string;
  'aria-label'?: string;
  children?: React.ReactNode;
}

/**
 * Substitui o `<Link>` do card quando o leilão é de parceria. Mantém a mesma
 * assinatura visual (className/children) pra troca ser um ternário no card.
 */
export default function LinkRedirecionamento({
  url,
  plataforma,
  className = '',
  children,
  ...rest
}: LinkRedirecionamentoProps) {
  const [aberto, setAberto] = useState(false);
  const destino = urlExternaValida(url);
  const abrir = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setAberto(true);
  }, []);

  if (!destino) return null;

  return (
    <>
      {/* Continua sendo uma âncora de verdade: crawler segue o link e o usuário
          consegue "abrir em nova aba"; só o clique normal é interceptado. */}
      <a href={destino} onClick={abrir} className={className} {...rest}>
        {children}
      </a>
      <AvisoRedirecionamento
        url={destino}
        plataforma={plataforma}
        aberto={aberto}
        onFechar={() => setAberto(false)}
      />
    </>
  );
}
