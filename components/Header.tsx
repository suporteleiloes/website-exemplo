import Link from 'next/link';
import { MODO_EXEMPLO } from '@/lib/config';
import type { SiteConfig, MenuGrupo, SessionUser } from '@/lib/types';
import UserMenu from '@/components/auth/UserMenu';
import MobileMenu from '@/components/MobileMenu';

// Ícone de martelo (gavel) — porta o SVG do template (dourado, herda --brand-accent).
function Gavel({ size = 23, color = 'var(--brand-accent)' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden="true">
      <rect x="3" y="19.2" width="12" height="2.4" rx="1.2" />
      <g transform="rotate(45 11.5 8.5)">
        <rect x="7.4" y="3.4" width="8.2" height="4.6" rx="1.3" />
        <rect x="10.7" y="8" width="1.6" height="9" rx=".8" />
      </g>
    </svg>
  );
}

// Header do template de leiloeiro: logo (marca) + navegação plana + Entrar/Cadastre-se.
// A busca não fica aqui (fica no hero da Home), como no design.
export default function Header({ config, menus, user }: { config: SiteConfig | null; menus: MenuGrupo[]; user: SessionUser | null }) {
  // Modo exemplo: ignora logo/nome do cliente e usa a marca neutra do template.
  const logo = MODO_EXEMPLO ? null : (config?.logo?.horizontal || null);
  const nome = MODO_EXEMPLO ? 'WEBSITE EXEMPLO' : (config?.siteName || 'Leilões');
  // Toggle do template: leiloeiro com login online (Entrar/Cadastre-se) OU só "Fale com o leiloeiro".
  const permitirCadastro = config?.features?.permitirCadastro !== false;
  const f = config?.features; // gates de nav (agenda, blog) do ERP
  // Itens extras vindos do menu configurável do ERP (além dos fixos do template).
  const extras = (menus.find((m) => m.slug === 'header' || m.slug === 'default')?.itens || []).slice(0, 2);

  // Nav do site — usado no desktop e no drawer mobile (mesma lista).
  const navItems: { href: string; label: string }[] = [
    { href: '/leiloes', label: 'Leilões' },
    ...(f?.agenda !== false ? [{ href: '/agenda', label: 'Agenda' }] : []),
    { href: '/venda-direta', label: 'Venda Direta' },
    ...(config?.paginas?.quemSomos ? [{ href: '/quem-somos', label: 'Quem somos' }] : []),
    ...(f?.blog ? [{ href: '/blog', label: 'Blog' }] : []),
    { href: '/ajuda', label: 'Como participar' },
    { href: '/contato', label: 'Contato' },
    ...extras.map((it) => ({ href: it.url || '#', label: it.titulo || '' })),
  ];

  return (
    <header className="lei-header">
      <div className="lei-wrap lei-header__inner">
        <Link href="/" className="lei-logo" aria-label={nome}>
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logo} alt={nome} style={{ height: 64, width: 'auto' }} />
          ) : (
            <>
              <span className="lei-logo__mark" style={{ background: 'var(--brand-primary)' }}>
                <Gavel />
              </span>
              <span style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <span className="lei-logo__name">{nome}</span>
                {!MODO_EXEMPLO && <span className="lei-logo__tag">L E I L Õ E S</span>}
              </span>
            </>
          )}
        </Link>

        <div className="lei-header__right">
          <nav className="lei-nav">
            {navItems.map((n) => <Link key={n.label} href={n.href}>{n.label}</Link>)}
          </nav>

          {user ? (
            <div className="lei-header__auth">
              <UserMenu nome={(user.name || user.username || 'Conta').split(' ')[0].split('@')[0]} />
            </div>
          ) : permitirCadastro ? (
            <div className="lei-header__auth">
              <Link href="/login">Entrar</Link>
              <Link href="/cadastro" className="lei-btn lei-btn--primary">Cadastre-se</Link>
            </div>
          ) : (
            <Link href="/contato" className="lei-header__call">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#A8874B" strokeWidth="1.9" aria-hidden="true"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.6a2 2 0 0 1-.5 2.1L8.1 9.7a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.8.3 1.7.6 2.6.7a2 2 0 0 1 1.7 2z" /></svg>
              <span>Fale com o leiloeiro</span>
            </Link>
          )}
        </div>

        <MobileMenu nav={navItems} logado={!!user} permitirCadastro={permitirCadastro} />
      </div>
    </header>
  );
}
