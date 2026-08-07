import Link from 'next/link';
import SeloSL from '@/components/SeloSL';
import PreferenciasCookies from '@/components/PreferenciasCookies';
import type { SiteConfig } from '@/lib/types';

/**
 * Rodapé do site.
 *
 * Dois itens são OBRIGATÓRIOS em qualquer site feito sobre este template
 * (ver `README.md §16`):
 *  - **Selo da Suporte Leilões** (`<SeloSL />`) — identidade da plataforma.
 *  - **Links legais** (privacidade, cookies, termos) + "Preferências de cookies",
 *    que é como o visitante revoga o consentimento (LGPD, art. 8º, §5º).
 */
export default function Footer({ config }: { config: SiteConfig | null }) {
  const c = config?.contato;
  return (
    <footer className="mt-10 border-t border-gray-200 bg-white">
      <div className="container-page grid grid-cols-1 gap-6 py-8 text-sm text-gray-600 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="font-semibold text-gray-800">{config?.siteName || 'Leilões'}</p>
          <p className="mt-2">POC de site público consumindo a API Website V2.</p>
        </div>
        <div>
          <p className="font-semibold text-gray-800">Navegação</p>
          <ul className="mt-2 space-y-1">
            <li><Link href="/" className="hover:text-marca">Início</Link></li>
            <li><Link href="/leiloes" className="hover:text-marca">Leilões</Link></li>
            <li><Link href="/quero-vender" className="hover:text-marca">Quero vender</Link></li>
            <li><Link href="/contato" className="hover:text-marca">Contato</Link></li>
            <li><Link href="/conta" className="hover:text-marca">Minha conta</Link></li>
          </ul>
        </div>
        <div>
          <p className="font-semibold text-gray-800">Transparência</p>
          <ul className="mt-2 space-y-1">
            <li><Link href="/politica-de-privacidade" className="hover:text-marca">Política de privacidade</Link></li>
            <li><Link href="/aviso-de-cookies" className="hover:text-marca">Aviso de cookies</Link></li>
            <li><Link href="/termos-de-uso" className="hover:text-marca">Termos de uso</Link></li>
            <li><PreferenciasCookies /></li>
          </ul>
        </div>
        <div>
          <p className="font-semibold text-gray-800">Contato</p>
          <ul className="mt-2 space-y-1">
            {c?.telefone && <li>Tel: {c.telefone}</li>}
            {c?.whatsapp && <li>WhatsApp: {c.whatsapp}</li>}
            {c?.email && <li>E-mail: {c.email}</li>}
            {c?.horario && <li>{c.horario}</li>}
          </ul>
          {/* Selo da plataforma: última coluna, abaixo dos dados do leiloeiro. */}
          <SeloSL className="mt-4" />
        </div>
      </div>
      <div className="border-t border-gray-100 py-3 text-center text-xs text-gray-400">
        Gerado pela POC Website V2 · dados via API <code>/api/website/v2</code>
      </div>
    </footer>
  );
}
