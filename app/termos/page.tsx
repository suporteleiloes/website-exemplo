import Link from 'next/link';
import { getSiteConfig } from '@/lib/api';
import { sanitizeHtml } from '@/lib/sanitize';
import { MODO_EXEMPLO } from '@/lib/config';
import { TERMOS_PADRAO } from '@/lib/legal';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Termos de uso',
  description: 'Condições de uso do site e de participação nos leilões.',
  alternates: { canonical: '/termos' },
};

// Termos de uso. Renderiza o HTML do ERP (config.paginas.termos) quando o leiloeiro
// preenche; caso contrário, exibe o texto-base genérico. NUNCA dá 404 — é link legal do rodapé.
export default async function TermosPage() {
  const config = await getSiteConfig().catch(() => null);
  const htmlErp = MODO_EXEMPLO ? null : (config?.paginas?.termos || null);
  const html = htmlErp || TERMOS_PADRAO;

  return (
    <main>
      <section className="lei-page-hero">
        <div className="lei-page-hero__glow" />
        <div className="lei-page-hero__in">
          <div className="lei-page-hero__crumb"><Link href="/">Início</Link> › Termos de uso</div>
          <div className="lei-page-hero__row">
            <div>
              <h1 className="lei-page-hero__title">Termos de uso</h1>
              <p className="lei-page-hero__lead">Condições de uso do site e de participação nos leilões.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="lei-wrap" style={{ padding: '38px 24px 64px' }}>
        <article className="lei-prose" dangerouslySetInnerHTML={{ __html: sanitizeHtml(html) }} />
      </section>
    </main>
  );
}
