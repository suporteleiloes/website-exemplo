import ContatoForm from '@/components/ContatoForm';
import { getContatoSetores, getSiteConfig, type ContatoSetores } from '@/lib/api';
import type { SiteConfig } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function ContatoPage() {
  const safe = async <T,>(p: Promise<T>, fb: T) => { try { return await p; } catch { return fb; } };
  const [setores, config] = await Promise.all([
    safe<ContatoSetores | null>(getContatoSetores(), null),
    safe<SiteConfig | null>(getSiteConfig(), null),
  ]);
  const c = config?.contato;

  return (
    <div className="container-page">
      <h1 className="mb-6 text-2xl font-bold text-gray-800">Fale conosco</h1>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <ContatoForm setores={setores} />
        </div>
        <aside className="space-y-4">
          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <h2 className="mb-3 font-semibold text-gray-800">Contato direto</h2>
            <ul className="space-y-2 text-sm text-gray-600">
              {c?.telefone && <li>📞 <a href={`tel:${c.telefone.replace(/\D/g, '')}`} className="hover:text-marca">{c.telefone}</a></li>}
              {c?.whatsapp && <li>💬 <a href={`https://wa.me/${c.whatsapp}`} target="_blank" className="hover:text-marca">WhatsApp</a></li>}
              {c?.email && <li>✉️ <a href={`mailto:${c.email}`} className="hover:text-marca">{c.email}</a></li>}
              {c?.horario && <li>🕐 {c.horario}</li>}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
