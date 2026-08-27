import Link from 'next/link';
import { MODO_EXEMPLO } from '@/lib/config';
import type { SiteConfig } from '@/lib/types';

// Painel esquerdo (navy) da tela de login — porta o AuthAside do kleiloes, tema do template.
export default function SigninAside({ config }: { config?: SiteConfig | null }) {
  const nome = MODO_EXEMPLO ? 'WEBSITE EXEMPLO' : (config?.siteName || 'Leilões');
  // Fundo navy: usa a logo clara do rodapé se houver; senão mostra o nome (branco, sempre visível).
  const logoLight = MODO_EXEMPLO ? null : (config?.footer?.logo || null);
  return (
    <aside className="lei-signin__aside">
      <Link href="/" className="lei-signin__brand" aria-label={nome}>
        {logoLight ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoLight} alt={nome} style={{ height: 44, width: 'auto', maxWidth: 240, objectFit: 'contain' }} />
        ) : (
          <>
            <span className="lei-signin__brand-mark">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M4 21h9" /><path d="M8.5 17.5 15 11" /><path d="m13.2 5.6 5.2 5.2-2.4 2.4-5.2-5.2z" /><path d="M16.4 2.4 21.6 7.6" /></svg>
            </span>
            <span className="lei-signin__brand-name">{nome}</span>
          </>
        )}
      </Link>

      <div className="lei-signin__grow">
        <span className="lei-signin__pill">Área do arrematante</span>
        <h1 className="lei-signin__headline">Sua conta,<br />pronta para o<br />próximo lance.</h1>
        <p className="lei-signin__lead">Habilite-se nos leilões judiciais e extrajudiciais, acompanhe editais e dispute imóveis e veículos em tempo real.</p>
      </div>

      <div className="lei-signin__foot">Ambiente protegido — seus dados são usados apenas para habilitação em leilões.</div>
    </aside>
  );
}
