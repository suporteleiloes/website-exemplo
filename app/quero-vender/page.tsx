import QueroVenderForm from '@/components/QueroVenderForm';
import { getSiteConfig } from '@/lib/api';
import type { SiteConfig } from '@/lib/types';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Quero vender',
  description: 'Envie seu bem para avaliação e venda em leilão.',
};

export default async function QueroVenderPage() {
  const safe = async <T,>(p: Promise<T>, fb: T) => { try { return await p; } catch { return fb; } };
  const config = await safe<SiteConfig | null>(getSiteConfig(), null);
  const c = config?.contato;

  return (
    <div className="container-page">
      <h1 className="mb-2 text-2xl font-bold text-gray-800">Quero vender</h1>
      <p className="mb-6 text-sm text-gray-600">
        Tem um imóvel, veículo ou outro bem para vender? Conte os detalhes que nossa equipe avalia
        e retorna com a melhor forma de levá-lo a leilão.
      </p>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <QueroVenderForm />
        </div>
        <aside className="space-y-4">
          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <h2 className="mb-3 font-semibold text-gray-800">Como funciona</h2>
            <ol className="space-y-2 text-sm text-gray-600">
              <li>1. Você envia os dados do bem neste formulário.</li>
              <li>2. Nossa equipe analisa e entra em contato para avaliação.</li>
              <li>3. Acertados os termos, o bem entra no próximo leilão.</li>
            </ol>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <h2 className="mb-3 font-semibold text-gray-800">Prefere falar direto?</h2>
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
