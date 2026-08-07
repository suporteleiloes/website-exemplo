import type { Metadata } from 'next';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Messenger from '@/components/Messenger';
import BannerCookies from '@/components/BannerCookies';
import { WIDGET_SLUG } from '@/lib/config';
import { getSiteConfig, getMenus } from '@/lib/api';
import { getSessionUser } from '@/lib/auth';
import type { SiteConfig, MenuGrupo } from '@/lib/types';

export const metadata: Metadata = {
  title: 'Leilões — POC Website V2',
  description: 'Site público de leiloeiro consumindo a API Website V2.',
};

/**
 * Monta as variáveis CSS da marca, deixando passar só o que é plausivelmente uma
 * cor CSS (`#1a4db3`, `rgb(…)`, `navy`). Os valores vêm da API e entram num
 * `dangerouslySetInnerHTML` — sem esta peneira, um `</style><script>` cadastrado
 * no branding do tenant viraria XSS em todo o site. Cor inválida é OMITIDA: vale
 * o default de `globals.css`, que é melhor do que um valor quebrado.
 */
function varsDeCor(cores: SiteConfig['cores'] | undefined): string | null {
  if (!cores) return null;
  const valida = (v: string | undefined) => (v && /^[#a-zA-Z0-9(),.%\s-]{1,64}$/.test(v) ? v : null);
  const decls = ([['primaria', cores.primaria], ['secundaria', cores.secundaria], ['destaque', cores.destaque]] as const)
    .map(([nome, valor]) => (valida(valor) ? `--cor-${nome}:${valor};` : ''))
    .join('');
  return decls ? `:root{${decls}}` : null;
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Shell carregado uma vez: branding + menus + sessão. Degrada se a API falhar.
  let config: SiteConfig | null = null;
  let menus: MenuGrupo[] = [];
  try { config = await getSiteConfig(); } catch { /* usa defaults */ }
  try { menus = (await getMenus()).result; } catch { menus = []; }
  const user = await getSessionUser().catch(() => null);

  const cssVars = varsDeCor(config?.cores);

  return (
    <html lang="pt-br">
      <body>
        {/*
          Cores da marca vindas da API. Renderizado com `href` + `precedence`:
          o React 19 IÇA (hoist) esta tag para dentro do <head> e a deduplica —
          é o jeito suportado de injetar CSS no head pelo App Router.

          ⛔ NUNCA envolver isto (nem nada) num <head> escrito à mão no layout.
          O <head> do App Router é hidratado em modo "singleton": qualquer filho
          inesperado — inclusive o nó de TEXTO VAZIO que `{stringVazia && <x/>}`
          produz quando a string é '' — falha a hidratação (React #418), o React
          descarta a árvore do <head> e leva junto o <link> de CSS que o Next
          injetou. Resultado: SITE INTEIRO SEM ESTILO, e só no build de produção
          (em `next dev` o CSS vem por outro caminho e o defeito não aparece).
          Por isso o teste aqui é ternário com `null`, nunca `&&` sobre string.
        */}
        {cssVars ? (
          <style href="sl-cores-da-marca" precedence="high" dangerouslySetInnerHTML={{ __html: cssVars }} />
        ) : null}
        <Header config={config} menus={menus} user={user} />
        <main className="min-h-[60vh] py-6">{children}</main>
        <Footer config={config} />
        <Messenger slug={WIDGET_SLUG} />
        {/*
          Banner de consentimento (LGPD). Fica no shell para valer em todas as
          rotas. ⛔ Todo script não essencial (analytics, pixel, mapa de calor)
          tem de passar por `quandoAutorizado()` de `lib/consentimento.ts` —
          carregar antes da escolha do visitante é tratamento sem base legal.
        */}
        <BannerCookies />
      </body>
    </html>
  );
}
