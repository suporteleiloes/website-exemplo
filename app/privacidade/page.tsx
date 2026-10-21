import Link from 'next/link';
import { getSiteConfig } from '@/lib/api';
import { sanitizeHtml } from '@/lib/sanitize';
import { MODO_EXEMPLO } from '@/lib/config';
import { PRIVACIDADE_PADRAO } from '@/lib/legal';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Política de privacidade',
  description: 'Como tratamos e protegemos seus dados pessoais, em conformidade com a LGPD.',
  alternates: { canonical: '/privacidade' },
};

// Política de privacidade. Renderiza o HTML do ERP (config.paginas.privacidade) quando o
// leiloeiro preenche; caso contrário, exibe o texto-base genérico (LGPD). NUNCA dá 404.
export default async function PrivacidadePage() {
  const config = await getSiteConfig().catch(() => null);
  const htmlErp = MODO_EXEMPLO ? null : (config?.paginas?.privacidade || null);
  const html = htmlErp || PRIVACIDADE_PADRAO;

  return (
    <main>
      <section className="lei-page-hero">
        <div className="lei-page-hero__glow" />
        <div className="lei-page-hero__in">
          <div className="lei-page-hero__crumb"><Link href="/">Início</Link> › Política de privacidade</div>
          <div className="lei-page-hero__row">
            <div>
              <h1 className="lei-page-hero__title">Política de privacidade</h1>
              <p className="lei-page-hero__lead">Como tratamos e protegemos seus dados pessoais, em conformidade com a LGPD.</p>
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
