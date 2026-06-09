import Link from 'next/link';
import type { SiteConfig } from '@/lib/types';

export default function Footer({ config }: { config: SiteConfig | null }) {
  const c = config?.contato;
  return (
    <footer className="mt-10 border-t border-gray-200 bg-white">
      <div className="container-page grid grid-cols-1 gap-6 py-8 text-sm text-gray-600 sm:grid-cols-3">
        <div>
          <p className="font-semibold text-gray-800">{config?.siteName || 'Leilões'}</p>
          <p className="mt-2">POC de site público consumindo a API Website V2.</p>
        </div>
        <div>
          <p className="font-semibold text-gray-800">Navegação</p>
          <ul className="mt-2 space-y-1">
            <li><Link href="/" className="hover:text-marca">Início</Link></li>
            <li><Link href="/leiloes" className="hover:text-marca">Leilões</Link></li>
            <li><Link href="/conta" className="hover:text-marca">Minha conta</Link></li>
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
        </div>
      </div>
      <div className="border-t border-gray-100 py-3 text-center text-xs text-gray-400">
        Gerado pela POC Website V2 · dados via API <code>/api/website/v2</code>
      </div>
    </footer>
  );
}
