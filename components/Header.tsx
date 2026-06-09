import Link from 'next/link';
import BuscaRapida from './BuscaRapida';
import type { SiteConfig, MenuGrupo, SessionUser } from '@/lib/types';

export default function Header({ config, menus, user }: { config: SiteConfig | null; menus: MenuGrupo[]; user: SessionUser | null }) {
  const logo = config?.logo?.horizontal || config?.logo?.square || null;
  const nome = config?.siteName || 'Leilões';
  const headerMenu = menus.find((m) => m.slug === 'header' || m.slug === 'default')?.itens || [];

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="container-page flex flex-wrap items-center gap-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logo} alt={nome} className="h-10 w-auto" />
          ) : (
            <span className="text-lg font-bold text-marca">{nome}</span>
          )}
        </Link>

        <div className="order-3 w-full md:order-2 md:w-auto md:flex-1">
          <BuscaRapida />
        </div>

        <nav className="order-2 ml-auto flex items-center gap-4 text-sm font-medium md:order-3">
          <Link href="/leiloes" className="hover:text-marca">Leilões</Link>
          {headerMenu.slice(0, 4).map((it) => (
            <a key={it.id} href={it.url || '#'} className="hidden hover:text-marca lg:inline">{it.titulo}</a>
          ))}
          {user ? (
            <Link href="/conta" className="btn-outline">Olá, {(user.name || 'Conta').split(' ')[0]}</Link>
          ) : (
            <Link href="/login" className="btn-primary">Entrar</Link>
          )}
        </nav>
      </div>
    </header>
  );
}
