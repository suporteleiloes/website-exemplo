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

// FAQ padrão — mostrado quando o ERP ainda não tem artigos publicados (fallback neutro,
// respostas inline via <details>, sem página de detalhe).
const FAQ_PADRAO: { icone: string; pergunta: string; resposta: string }[] = [
  { icone: '🚀', pergunta: 'Como faço meu cadastro?', resposta: 'Clique em "Cadastre-se" no topo do site, preencha seus dados (pessoa física ou jurídica) e confirme pelo e-mail que você receber. O cadastro é gratuito.' },
  { icone: '✅', pergunta: 'Como me habilito para participar de um leilão?', resposta: 'Depois de cadastrado, abra a página do leilão desejado e clique em "Habilitar". Envie os documentos pedidos no edital e aguarde a aprovação do leiloeiro.' },
  { icone: '🔨', pergunta: 'Como dou um lance?', resposta: 'Estando habilitado e logado, entre na página do lote, informe um valor igual ou acima do próximo lance e confirme. Você é avisado caso alguém supere o seu lance.' },
  { icone: '💳', pergunta: 'Quais são as formas de pagamento?', resposta: 'As condições (à vista ou parcelado, comissão do leiloeiro e prazos) constam no edital de cada leilão. Leia o edital com atenção antes de dar lances.' },
  { icone: '📦', pergunta: 'Como retiro o bem que arrematei?', resposta: 'Após a homologação do leilão e a confirmação do pagamento, siga as instruções de retirada informadas no edital e enviadas por e-mail.' },
];

export default async function AjudaPage(props: { searchParams: Promise<{ busca?: string }> }) {
  const searchParams = await props.searchParams;
  const busca = (searchParams?.busca || '').trim();
  const { colecoes, artigos } = await getAjudaServer(WIDGET_SLUG, busca).catch(() => ({ colecoes: [], artigos: [] }));

  return (
    <div className="-mt-6">
      {/* Hero */}
      <section
        className="relative overflow-hidden px-4 py-14 text-center sm:py-16"
        style={{ background: 'var(--brand-primary)' }}
      >
        <div className="pointer-events-none absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'radial-gradient(circle at 20% 20%, #fff 1px, transparent 1px)', backgroundSize: '22px 22px' }} />
        <div className="relative mx-auto max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/70">Central de Ajuda</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">Como podemos ajudar?</h1>
          <p className="mt-2 text-[15px] text-white/75">Respostas sobre habilitação, lances, pagamento e retirada.</p>
          <AjudaBusca initial={busca} />
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-6 py-10">
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

            {/* Artigos populares (ou FAQ padrão quando o ERP não tem artigos) */}
            <section>
              <h2 className="mb-4 text-lg font-bold text-gray-800">{artigos.length === 0 ? 'Perguntas frequentes' : 'Artigos populares'}</h2>
              {artigos.length === 0 ? (
                <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
                  {FAQ_PADRAO.map((f, i) => (
                    <details key={i} className="group border-b border-gray-100 last:border-b-0">
                      <summary className="flex cursor-pointer list-none items-center gap-3 px-5 py-4 font-semibold text-gray-800 [&::-webkit-details-marker]:hidden">
                        <span className="text-lg">{f.icone}</span>
                        <span>{f.pergunta}</span>
                        <svg className="ml-auto h-4 w-4 shrink-0 text-gray-400 transition-transform group-open:rotate-90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
                      </summary>
                      <p className="px-5 pb-4 pl-[52px] text-sm leading-relaxed text-gray-600">{f.resposta}</p>
                    </details>
                  ))}
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
