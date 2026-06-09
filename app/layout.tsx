import type { Metadata } from 'next';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Atendimento from '@/components/Atendimento';
import { WIDGET_SLUG } from '@/lib/config';
import { getSiteConfig, getMenus } from '@/lib/api';
import { getSessionUser } from '@/lib/auth';
import type { SiteConfig, MenuGrupo } from '@/lib/types';

export const metadata: Metadata = {
  title: 'Leilões — POC Website V2',
  description: 'Site público de leiloeiro consumindo a API Website V2.',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Shell carregado uma vez: branding + menus + sessão. Degrada se a API falhar.
  let config: SiteConfig | null = null;
  let menus: MenuGrupo[] = [];
  try { config = await getSiteConfig(); } catch { /* usa defaults */ }
  try { menus = (await getMenus()).result; } catch { menus = []; }
  const user = await getSessionUser().catch(() => null);

  const cores = config?.cores;
  const cssVars = cores
    ? `:root{--cor-primaria:${cores.primaria};--cor-secundaria:${cores.secundaria};--cor-destaque:${cores.destaque};}`
    : '';

  return (
    <html lang="pt-br">
      <head>{cssVars && <style dangerouslySetInnerHTML={{ __html: cssVars }} />}</head>
      <body>
        <Header config={config} menus={menus} user={user} />
        <main className="min-h-[60vh] py-6">{children}</main>
        <Footer config={config} />
        <Atendimento
          slug={WIDGET_SLUG}
          whatsapp={config?.contato?.whatsapp ?? null}
          habilitado={!!config?.features?.permitirChat}
        />
      </body>
    </html>
  );
}
