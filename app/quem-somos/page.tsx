import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getSiteConfig } from '@/lib/api';
import { sanitizeHtml } from '@/lib/sanitize';
import { MODO_EXEMPLO } from '@/lib/config';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Quem somos',
  description: 'Conheça o leiloeiro público oficial e nosso compromisso com transparência e segurança jurídica.',
  alternates: { canonical: '/quem-somos' },
};

// Página institucional. O conteúdo (HTML) vem do ERP (config.paginas.quemSomos).
// Sem conteúdo → 404 (o link de nav também some), então clientes que não preencheram não têm página vazia.
export default async function QuemSomosPage() {
  const config = await getSiteConfig().catch(() => null);
  const html = MODO_EXEMPLO ? null : (config?.paginas?.quemSomos || null);
  if (!html) notFound();

  return (
    <main>
      <section className="lei-page-hero">
        <div className="lei-page-hero__glow" />
        <div className="lei-page-hero__in">
          <div className="lei-page-hero__crumb"><Link href="/">Início</Link> › Quem somos</div>
          <div className="lei-page-hero__row">
            <div>
              <h1 className="lei-page-hero__title">Quem somos</h1>
              <p className="lei-page-hero__lead">O leiloeiro público oficial e nosso compromisso com transparência e segurança jurídica.</p>
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
