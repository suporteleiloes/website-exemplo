import type { Metadata } from 'next';
import './globals.css';
import './theme.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Messenger from '@/components/Messenger';
import WhatsAppFloat from '@/components/WhatsAppFloat';
import { WIDGET_SLUG, SITE_URL, MODO_EXEMPLO } from '@/lib/config';
import { getSiteConfig, getMenus, getLeiloeiro } from '@/lib/api';
import { getSessionUser } from '@/lib/auth';
import type { SiteConfig, MenuGrupo, Leiloeiro } from '@/lib/types';

// Metadata base do site (título com template por página, Open Graph, robots). O nome/descrição
// vêm do ERP (config do site); no MODO_EXEMPLO usa a identidade neutra do template.
export async function generateMetadata(): Promise<Metadata> {
  const config = await getSiteConfig().catch(() => null);
  const nome = MODO_EXEMPLO ? 'Leiloeiro Modelo' : (config?.siteName || 'Leilões');
  const desc = (config as { descricao?: string | null } | null)?.descricao || 'Leilões judiciais e extrajudiciais de imóveis, veículos e máquinas. Participe online.';
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: `${nome} — Leilões online de imóveis, veículos e mais`, template: `%s · ${nome}` },
    description: desc,
    applicationName: nome,
    alternates: { canonical: '/' },
    openGraph: { siteName: nome, type: 'website', locale: 'pt_BR', title: nome, description: desc, url: SITE_URL },
    twitter: { card: 'summary_large_image', title: nome, description: desc },
    robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large' } },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Shell carregado uma vez: branding + menus + sessão. Degrada se a API falhar.
  let config: SiteConfig | null = null;
  let menus: MenuGrupo[] = [];
  let leiloeiro: Leiloeiro | null = null;
  try { config = await getSiteConfig(); } catch { /* usa defaults */ }
  try { menus = (await getMenus()).result; } catch { menus = []; }
  try { leiloeiro = await getLeiloeiro(); } catch { /* opcional */ }
  const user = await getSessionUser().catch(() => null);
  const leiloeiros = leiloeiro?.nome ? [leiloeiro] : [];

  const cores = config?.cores;
  // TEMA: por padrão o site usa a identidade do template (navy/dourado do theme.css). O tenant
  // de exemplo devolve uma cor padrão que NÃO é escolha real do cliente — por isso não sobrescreve.
  // Quando o cliente definir a cor no ERP, a branch dele liga NEXT_PUBLIC_THEME_FROM_CONFIG=true
  // e aí injetamos --brand-primary/secondary (e o accent, se THEME_ACCENT_FROM_CONFIG=true).
  const usarCoresConfig = process.env.NEXT_PUBLIC_THEME_FROM_CONFIG === 'true';
  const accentFromConfig = process.env.NEXT_PUBLIC_THEME_ACCENT_FROM_CONFIG === 'true';
  const cssVars = cores && usarCoresConfig
    ? `:root{--cor-primaria:${cores.primaria};--cor-secundaria:${cores.secundaria};--cor-destaque:${cores.destaque};`
      + `--brand-primary:${cores.primaria};--brand-secondary:${cores.secundaria};`
      + (accentFromConfig ? `--brand-accent:${cores.destaque};` : '')
      + `}`
    : '';

  return (
    <html lang="pt-br">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Sora:wght@500;600;700&display=swap" />
        {cssVars ? <style dangerouslySetInnerHTML={{ __html: cssVars }} /> : null}
      </head>
      <body>
        <Header config={config} menus={menus} user={user} />
        <main className="min-h-[60vh]">{children}</main>
        <Footer config={config} leiloeiros={leiloeiros} />
        <WhatsAppFloat config={config} />
        {config?.features?.permitirChat !== false && <Messenger slug={WIDGET_SLUG} />}
      </body>
    </html>
  );
}
