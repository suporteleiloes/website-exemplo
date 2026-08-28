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
const FAQ_PADRAO: { icone: string; pergunta: string; resposta: string; bullets?: string[] }[] = [
  { icone: '🔨', pergunta: 'Como funcionam os leilões?', resposta: 'O leilão é uma modalidade de venda que permite a disputa de preços entre os interessados: quem oferta o maior lance leva o bem. Pode ocorrer de três formas:', bullets: ['Presencial — realizado em auditório, com a presença do leiloeiro e dos interessados. O leiloeiro anuncia os lotes e o preço mínimo, e os presentes ofertam seus lances.', 'Eletrônico (on-line) — realizado no site do leiloeiro. Para participar, é necessário cadastrar-se e solicitar a habilitação com antecedência.', 'Simultâneo — une o presencial e o eletrônico. Os lances feitos no auditório e os feitos no site são registrados em tempo real, permitindo que todos disputem em igualdade de condições.'] },
  { icone: '📦', pergunta: 'De onde vêm os bens vendidos em leilão?', resposta: '', bullets: ['Leilão Judicial — determinado por um juiz para ressarcimento de dívida em processo judicial.', 'Leilão Extrajudicial — decorrente de alienação fiduciária, quando há inadimplência no financiamento de um imóvel ou veículo, por exemplo.', 'Leilão Particular — quando uma empresa ou pessoa opta por vender, em leilão, bens que não lhe interessam mais.'] },
  { icone: '✅', pergunta: 'Preciso me cadastrar para participar?', resposta: 'Sim. O cadastro é rápido e gratuito. Para ofertar lances, é preciso ainda solicitar a habilitação no leilão desejado, aceitando o edital e enviando a documentação exigida.' },
  { icone: '📄', pergunta: 'O que é o edital e por que devo lê-lo?', resposta: 'O edital é o documento oficial do leilão. Nele estão a descrição dos lotes, o preço mínimo, as condições e prazos de pagamento, a comissão do leiloeiro, as regras de visitação e todas as demais condições da venda. A leitura é essencial antes de dar qualquer lance.' },
  { icone: '💳', pergunta: 'Existe alguma taxa ou comissão?', resposta: 'Sim. Sobre o valor da arrematação incide a comissão do leiloeiro, no percentual definido no edital de cada leilão (usualmente 5%). Eventuais custos adicionais, quando houver, também constam do edital.' },
  { icone: '💳', pergunta: 'Como e quando faço o pagamento?', resposta: 'As formas e os prazos de pagamento são os previstos no edital. Após a confirmação do pagamento, o arrematante recebe a documentação e as orientações para a retirada do bem.' },
  { icone: '📦', pergunta: 'Como retiro o bem arrematado?', resposta: 'A retirada ocorre após a quitação, no local, prazo e condições indicados no edital. O arrematante recebe todas as instruções necessárias.' },
  { icone: '🔒', pergunta: 'O leilão é seguro?', resposta: 'Sim. O leilão público é conduzido por leiloeiro oficial investido de fé pública, com regras claras e previamente publicadas em edital, garantindo transparência e segurança jurídica a todos os participantes.' },
  { icone: '⚖️', pergunta: 'O que é arrematação?', resposta: 'É a aquisição do bem por quem ofertou o maior lance, dentro das condições do edital. Concluída e paga, a arrematação constitui negócio perfeito e acabado.' },
];

// Passos "Como participar" — mostrados junto ao FAQ padrão (sem busca ativa).
const COMO_PARTICIPAR: { n: string; t: string; d: string }[] = [
  { n: '1', t: 'Cadastre-se', d: 'Preencha o cadastro on-line com seus dados. Leva poucos minutos.' },
  { n: '2', t: 'Escolha o leilão', d: 'Navegue pelos leilões abertos e selecione o lote de seu interesse.' },
  { n: '3', t: 'Solicite a habilitação', d: 'Leia e aceite o edital e as condições de venda e envie a documentação solicitada. A habilitação é analisada e liberada com antecedência.' },
  { n: '4', t: 'Dê seu lance', d: 'Já habilitado, acompanhe o leilão em tempo real e oferte seus lances em igualdade de condições com os demais participantes.' },
  { n: '5', t: 'Arremate', d: 'Vencendo a disputa, você recebe as orientações para pagamento e retirada do bem, com toda a segurança jurídica da arrematação.' },
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

            {/* Como participar — passos numerados */}
            <section className="mb-10">
              <h2 className="mb-4 text-lg font-bold text-gray-800">Como participar</h2>
              <ol className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {COMO_PARTICIPAR.map((s) => (
                  <li key={s.n} className="flex gap-4 rounded-2xl border border-gray-200 bg-white p-5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-base font-bold text-white" style={{ background: 'var(--brand-primary)' }}>{s.n}</span>
                    <span className="min-w-0">
                      <span className="block font-semibold text-gray-800">{s.t}</span>
                      <span className="mt-0.5 block text-sm leading-relaxed text-gray-500">{s.d}</span>
                    </span>
                  </li>
                ))}
              </ol>
              <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-relaxed text-amber-900">
                <b>Importante:</b> leia sempre, com atenção, o edital de cada leilão. Nele constam a descrição dos lotes, o preço mínimo, as condições de pagamento, a comissão do leiloeiro e as demais regras da venda.
              </div>
            </section>

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
                      <div className="px-5 pb-4 pl-[52px] text-sm leading-relaxed text-gray-600">
                        {f.resposta && <p>{f.resposta}</p>}
                        {f.bullets && (
                          <ul className={`${f.resposta ? 'mt-2' : ''} list-disc space-y-1.5 pl-5`}>
                            {f.bullets.map((b, j) => (<li key={j}>{b}</li>))}
                          </ul>
                        )}
                      </div>
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
