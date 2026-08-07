'use client';

/**
 * Banner de consentimento de cookies (LGPD).
 *
 * ── Por que existe ───────────────────────────────────────────────────────────
 * Sem manifestação do titular, carregar qualquer coisa não essencial (analytics,
 * pixel, remarketing) é tratamento sem base legal. O banner é o ponto onde o
 * consentimento é COLETADO; o gate que o RESPEITA está em `lib/consentimento.ts`
 * (`quandoAutorizado`/`permite`). Um sem o outro não vale nada: banner
 * decorativo com script carregando antes da escolha é pior do que não ter banner
 * — declara uma prática que o site não cumpre.
 *
 * ── Decisões que NÃO devem ser revertidas ao adaptar para um cliente ─────────
 * - **Sem dark pattern.** "Aceitar todos" e "Apenas essenciais" têm o mesmo
 *   peso visual (mesmo tamanho, mesma área de clique, ambos legíveis). Esconder
 *   a recusa atrás de "gerenciar preferências", ou deixá-la cinza-claro, invalida
 *   o consentimento — ele deixa de ser livre.
 * - **Fechar sem escolher = apenas essenciais.** `Esc` e o "×" registram recusa
 *   dos opcionais quando ainda não há decisão. Silêncio não é consentimento.
 *   (Numa REABERTURA pelo rodapé, fechar apenas mantém o que já valia — aí já
 *   existe uma decisão registrada.)
 * - **Sem layout shift.** `position: fixed` — o banner nunca empurra o conteúdo.
 * - **Nunca renderiza no HTML do servidor.** A página é cacheada (ISR); marcar
 *   "mostrar" no SSR faria o banner piscar para quem já decidiu. Ver
 *   `bannerNoServidor()`.
 */

import { useCallback, useEffect, useRef, useSyncExternalStore } from 'react';
import Link from 'next/link';
import {
  aceitarTodos,
  assinarConsentimento,
  bannerNoServidor,
  consentimentoAtual,
  deveMostrarBanner,
  fecharPreferenciasCookies,
  revogarConsentimento,
} from '@/lib/consentimento';

export default function BannerCookies() {
  const visivel = useSyncExternalStore(assinarConsentimento, deveMostrarBanner, bannerNoServidor);

  const caixaRef = useRef<HTMLDivElement>(null);
  // Quem tinha o foco antes do banner aparecer — devolvemos ao fechar.
  const focoAnterior = useRef<HTMLElement | null>(null);

  // Foco: leva para a caixa quando ela aparece, devolve para a origem ao sair.
  useEffect(() => {
    if (!visivel) return;
    focoAnterior.current = (document.activeElement as HTMLElement) ?? null;
    caixaRef.current?.focus();
  }, [visivel]);

  const devolverFoco = () => focoAnterior.current?.focus?.();

  const aceitar = useCallback(() => { aceitarTodos(); devolverFoco(); }, []);
  const essenciais = useCallback(() => { revogarConsentimento(); devolverFoco(); }, []);

  /** `Esc`/"×": sem decisão prévia vira recusa; em reabertura, mantém o que valia. */
  const fechar = useCallback(() => {
    if (consentimentoAtual() === null) revogarConsentimento();
    else fecharPreferenciasCookies();
    devolverFoco();
  }, []);

  useEffect(() => {
    if (!visivel) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') fechar(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [visivel, fechar]);

  if (!visivel) return null;

  return (
    <div
      ref={caixaRef}
      tabIndex={-1}
      role="dialog"
      aria-label="Aviso de cookies e privacidade"
      aria-describedby="banner-cookies-texto"
      className="fixed inset-x-0 bottom-0 z-[100] border-t border-gray-200 bg-white shadow-[0_-4px_20px_rgba(0,0,0,.10)] focus:outline-none"
    >
      <div className="container-page flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:py-5">
        <p id="banner-cookies-texto" className="max-w-3xl pr-8 text-sm leading-relaxed text-gray-700 sm:pr-0">
          Usamos cookies necessários para o site funcionar (sessão, segurança e preferências) e,
          com a sua autorização, cookies opcionais de preferências, medição e marketing. Você
          escolhe — e pode mudar de ideia quando quiser.{' '}
          <Link href="/aviso-de-cookies" className="font-semibold underline hover:text-marca">
            Aviso de cookies
          </Link>{' '}
          ·{' '}
          <Link href="/politica-de-privacidade" className="font-semibold underline hover:text-marca">
            Política de privacidade
          </Link>
        </p>

        {/* Dois botões, mesmo peso visual: a recusa não pode ser mais difícil que o aceite. */}
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
          <button type="button" onClick={essenciais} className="btn-outline w-full sm:w-auto">
            Apenas essenciais
          </button>
          <button type="button" onClick={aceitar} className="btn-primary w-full sm:w-auto">
            Aceitar todos
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={fechar}
        aria-label="Fechar aviso (mantém apenas os cookies essenciais)"
        className="absolute right-3 top-3 rounded p-1 text-xl leading-none text-gray-400 hover:text-gray-700 sm:hidden"
      >
        ×
      </button>
    </div>
  );
}
