'use client';

/**
 * Injeção de tags de rastreamento (GA4, Google Tag Manager, Meta/Facebook Pixel).
 *
 * ── De onde vêm os IDs ───────────────────────────────────────────────────────
 * Os identificadores NÃO são hardcoded: chegam de `analytics.{ga4,gtm,metaPixel}`
 * do `SiteConfig` do tenant (API Website V2 → `/site/config`, chaves GlobalConfig
 * `site.analytics.*`). O layout (server) lê a config e passa para cá. Chave vazia
 * = provedor simplesmente não carrega — cada leiloeiro liga só o que configurou.
 *
 * ── LGPD: NADA carrega antes do consentimento ────────────────────────────────
 * Este componente é o exemplo canônico do contrato de `lib/consentimento.ts`:
 * todo script de terceiro passa por `permite(categoria)` e só é injetado quando o
 * visitante autorizou. Enquanto não houver decisão (ou se for recusa), nenhuma
 * `<script>`/`<img>` de rastreamento entra no DOM. Revogar depois NÃO desfaz o
 * que um provedor já carregou nesta aba (limitação registrada no gate) — por isso
 * a barreira é ANTES da injeção, não depois.
 *
 * Categorias (as quatro de `/aviso-de-cookies`):
 *  - GA4 → `medicao` (analytics de desempenho/audiência).
 *  - GTM e Meta Pixel → `marketing` (o container do GTM pode disparar tags de
 *    remarketing arbitrárias; o Pixel é remarketing por definição — a categoria
 *    mais restrita protege o titular).
 *
 * ── Pageview em navegação SPA ────────────────────────────────────────────────
 * O App Router troca de rota sem recarregar a página; o pageview automático do
 * gtag/fbq só dispara no primeiro load. Este componente observa `usePathname`/
 * `useSearchParams` e emite o page_view a cada troca — mas só para o provedor que
 * já foi autorizado e injetado.
 */

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { assinarConsentimento, consentimentoAtual, permite } from '@/lib/consentimento';

// Tipos frouxos para os globais que os SDKs de terceiros criam no `window`.
declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    fbq?: ((...args: unknown[]) => void) & { callMethod?: (...args: unknown[]) => void; queue?: unknown[] };
    _fbq?: unknown;
  }
}

type ConfigAnalytics = { ga4?: string | null; gtm?: string | null; metaPixel?: string | null };

/** Cria e injeta um `<script src>` idempotente (marcado por `data-sl-analytics`). */
function injetarScriptSrc(id: string, src: string, async = true): void {
  if (document.querySelector(`script[data-sl-analytics="${id}"]`)) return;
  const s = document.createElement('script');
  s.src = src;
  s.async = async;
  s.setAttribute('data-sl-analytics', id);
  document.head.appendChild(s);
}

/** Injeta um `<script>` inline idempotente (marcado por `data-sl-analytics`). */
function injetarScriptInline(id: string, codigo: string): void {
  if (document.querySelector(`script[data-sl-analytics="${id}"]`)) return;
  const s = document.createElement('script');
  s.setAttribute('data-sl-analytics', id);
  s.innerHTML = codigo;
  document.head.appendChild(s);
}

export default function Analytics({ analytics }: { analytics?: ConfigAnalytics | null }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Normaliza e descarta valores vazios logo de cara — nada a fazer sem ID.
  const ga4 = (analytics?.ga4 || '').trim() || null;
  const gtm = (analytics?.gtm || '').trim() || null;
  const metaPixel = (analytics?.metaPixel || '').trim() || null;

  // Guardas de "já injetei" — sobrevivem a re-render e a mudanças de consentimento.
  const ga4Pronto = useRef(false);
  const gtmPronto = useRef(false);
  const pixelPronto = useRef(false);

  // ── Injeção gated por consentimento ────────────────────────────────────────
  // Roda no mount e a CADA mudança de consentimento (assinatura ao store). Assim,
  // quem aceita depois de já estar navegando também passa a ser rastreado, sem F5.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!ga4 && !gtm && !metaPixel) return; // tenant sem analytics configurado

    const avaliar = () => {
      // GA4 (gtag) — categoria de MEDIÇÃO.
      if (ga4 && !ga4Pronto.current && permite('medicao')) {
        ga4Pronto.current = true;
        window.dataLayer = window.dataLayer || [];
        window.gtag = function gtag() { window.dataLayer!.push(arguments); };
        window.gtag('js', new Date());
        // `send_page_view:false` — o pageview inicial e os de SPA saem pelo efeito
        // dedicado abaixo, evitando contagem dupla na primeira carga.
        window.gtag('config', ga4, { send_page_view: false });
        injetarScriptSrc('ga4', `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(ga4)}`);
      }

      // Google Tag Manager — categoria de MARKETING.
      if (gtm && !gtmPronto.current && permite('marketing')) {
        gtmPronto.current = true;
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
        injetarScriptSrc('gtm', `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(gtm)}`);
      }

      // Meta/Facebook Pixel — categoria de MARKETING.
      if (metaPixel && !pixelPronto.current && permite('marketing')) {
        pixelPronto.current = true;
        // Stub oficial do fbq (fila até o script real carregar).
        injetarScriptInline('meta-pixel', `
          !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
          n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}
          (window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', ${JSON.stringify(metaPixel)}); fbq('track', 'PageView');`);
      }

      const tudoResolvido =
        (!ga4 || ga4Pronto.current) && (!gtm || gtmPronto.current) && (!metaPixel || pixelPronto.current);
      return tudoResolvido;
    };

    if (avaliar()) return; // tudo já autorizado e injetado — não precisa assinar

    // Ainda falta alguma categoria: reavalia quando o consentimento mudar.
    const cancelar = assinarConsentimento(() => {
      if (avaliar()) cancelar();
    });
    return cancelar;
    // `consentimentoAtual()` é lido dentro de `permite`; a assinatura cobre mudanças.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ga4, gtm, metaPixel]);

  // ── Pageview em navegação SPA ───────────────────────────────────────────────
  // Dispara a cada troca de rota, só para o que já está autorizado/injetado.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!consentimentoAtual()) return; // sem decisão → nada a reportar
    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '');

    if (ga4Pronto.current && window.gtag) {
      window.gtag('event', 'page_view', { page_path: url, page_location: window.location.href });
    }
    if (gtmPronto.current && window.dataLayer) {
      window.dataLayer.push({ event: 'pageview', page_path: url });
    }
    if (pixelPronto.current && window.fbq) {
      window.fbq('track', 'PageView');
    }
  }, [pathname, searchParams]);

  return null;
}
