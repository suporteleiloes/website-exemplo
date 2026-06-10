import Link from 'next/link';
import { getAjudaServer } from '@/lib/widget';
import { WIDGET_SLUG } from '@/lib/config';
import AjudaBusca from '@/components/AjudaBusca';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Central de Ajuda',
  description: 'Tire suas dúvidas sobre habilitação, lances, pagamento e retirada.',
};

// Emoji por coleção (fallback genérico). Identidade leve, sem depender de assets.
const ICONE: Record<string, string> = {
  'Primeiros passos': '🚀', 'Habilitação': '✅', 'habilitacao': '✅',
  'Lances e Arremate': '🔨', 'Pagamento': '💳', 'pagamento': '💳',
  'Retirada': '📦', 'Venda Direta': '🏷️', 'Geral': '💡',
};
function icone(cat: string) { return ICONE[cat] || '📄'; }
function slugCat(cat: string) { return encodeURIComponent(cat); }

export default async function AjudaPage({ searchParams }: { searchParams: { busca?: string } }) {
  const busca = (searchParams?.busca || '').trim();
  const { colecoes, artigos } = await getAjudaServer(WIDGET_SLUG, busca).catch(() => ({ colecoes: [], artigos: [] }));

  return (
    <div className="-mt-6">
      {/* Hero */}
      <section
        className="relative overflow-hidden px-4 py-14 text-center sm:py-16"
        style={{ background: 'linear-gradient(135deg, var(--cor-primaria, #15224B) 0%, #27396E 55%, #C8A24B 160%)' }}
      >
        <div className="pointer-events-none absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'radial-gradient(circle at 20% 20%, #fff 1px, transparent 1px)', backgroundSize: '22px 22px' }} />
        <div className="relative mx-auto max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/70">Central de Ajuda</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">Como podemos ajudar?</h1>
          <p className="mt-2 text-[15px] text-white/75">Respostas sobre habilitação, lances, pagamento e retirada.</p>
          <AjudaBusca initial={busca} />
        </div>
      </section>

      <div className="container-page py-10">
        {/* Resultados de busca */}
        {busca ? (
          <>
            <div className="mb-6 flex items-baseline gap-2">
              <h2 className="text-lg font-bold text-gray-800">Resultados para “{busca}”</h2>
              <span className="text-sm text-gray-400">{artigos.length} {artigos.length === 1 ? 'artigo' : 'artigos'}</span>
              <Link href="/ajuda" className="ml-auto text-sm font-medium text-marca hover:underline">Limpar busca</Link>
            </div>
            {artigos.length === 0 ? (
              <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center">
                <div className="text-3xl">🔍</div>
                <p className="mt-2 font-semibold text-gray-700">Nada encontrado para “{busca}”.</p>
                <p className="mt-1 text-sm text-gray-500">Tente outras palavras ou fale com nosso time pelo chat.</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-200 bg-white">
                {artigos.map((a) => (
                  <li key={a.id}>
                    <Link href={`/ajuda/${a.id}`} className="flex items-start gap-3 px-5 py-4 transition hover:bg-gray-50">
                      <span className="mt-0.5 text-lg">{icone(a.categoria)}</span>
                      <span className="min-w-0">
                        <span className="block font-semibold text-gray-800">{a.titulo}</span>
                        <span className="mt-0.5 block text-sm text-gray-500">{a.resumo}</span>
                      </span>
                      <svg className="ml-auto mt-1 h-4 w-4 shrink-0 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : (
          <>
            {/* Coleções */}
            {colecoes.length > 0 && (
              <section className="mb-10">
                <h2 className="mb-4 text-lg font-bold text-gray-800">Navegue por tópico</h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {colecoes.map((c) => (
                    <Link
                      key={c.categoria}
                      href={`/ajuda?busca=${slugCat(c.categoria)}`}
                      className="group flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-lg hover:shadow-black/5"
                    >
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gray-50 text-2xl ring-1 ring-gray-100">{icone(c.categoria)}</span>
                      <span className="min-w-0">
                        <span className="block font-semibold text-gray-800 group-hover:text-marca">{c.categoria}</span>
                        <span className="text-sm text-gray-400">{c.total} {c.total === 1 ? 'artigo' : 'artigos'}</span>
                      </span>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Artigos populares */}
            <section>
              <h2 className="mb-4 text-lg font-bold text-gray-800">Artigos populares</h2>
              {artigos.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-10 text-center text-gray-500">
                  Ainda não há artigos publicados.
                </div>
              ) : (
                <ul className="divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-200 bg-white">
                  {artigos.slice(0, 12).map((a) => (
                    <li key={a.id}>
                      <Link href={`/ajuda/${a.id}`} className="flex items-start gap-3 px-5 py-4 transition hover:bg-gray-50">
                        <span className="mt-0.5 text-lg">{icone(a.categoria)}</span>
                        <span className="min-w-0">
                          <span className="block font-semibold text-gray-800">{a.titulo}</span>
                          <span className="mt-0.5 block text-sm text-gray-500">{a.resumo}</span>
                        </span>
                        <svg className="ml-auto mt-1 h-4 w-4 shrink-0 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}

        {/* Ainda precisa de ajuda */}
        <div className="mt-10 rounded-2xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-6 text-center">
          <p className="font-semibold text-gray-800">Não encontrou o que procurava?</p>
          <p className="mt-1 text-sm text-gray-500">Nosso time e o CopilotSL respondem pelo chat no canto da tela.</p>
        </div>
      </div>
    </div>
  );
}
