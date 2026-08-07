import Link from 'next/link';
import { notFound } from 'next/navigation';
import Galeria from '@/components/Galeria';
import LanceBox from '@/components/LanceBox';
import BotaoAuditorio from '@/components/BotaoAuditorio';
import LoteCard from '@/components/LoteCard';
import { BadgeLote } from '@/components/Badge';
import { AvisoLeilaoParceria } from '@/components/RedirecionamentoExterno';
import { getLote, getLotes, getLoteVizinhos, getSiteConfig, ApiException } from '@/lib/api';
import { getSessionUser } from '@/lib/auth';
import { moeda } from '@/lib/format';
import { urlExternaValida } from '@/lib/externo';
import { hrefLeilao, hrefLote, resolverPorIdOuSlug } from '@/lib/rota';
import type { Lote } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function LotePage(props: { params: Promise<{ idOrSlug: string }> }) {
  const params = await props.params;

  // Aceita `{id}-{slug}` (canônico), `{id}` puro e `{slug}` puro — os links já
  // divulgados continuam abrindo. Ver `lib/rota.ts`. O 404 vira `null` DENTRO do
  // resolvedor pra ele poder tentar a próxima forma; erro de infra sobe pro
  // error.tsx.
  const lote: Lote | null = await resolverPorIdOuSlug<Lote>(params.idOrSlug, (chave) =>
    getLote(chave).catch((e) => {
      if (e instanceof ApiException && e.status === 404) return null;
      throw e;
    }),
  );
  if (!lote) notFound();

  const bem = lote.bem;
  const leilao: any = lote.leilao;
  const leilaoId = leilao?.id;

  // LEILÃO DE PARCERIA: o pregão é de outra plataforma. A página abre (o lote é
  // divulgado por nós), mas sem caixa de lance — quem dá lance é o site de
  // destino. Ver `components/RedirecionamentoExterno.tsx`.
  const externa = urlExternaValida(leilao?.urlExterna);

  const safe = async <T,>(p: Promise<T>, fb: T) => { try { return await p; } catch { return fb; } };
  const [vizinhos, relacionadosData, user, config] = await Promise.all([
    // P3: endpoint dedicado de vizinhos (não baixa a lista inteira de lotes).
    safe(getLoteVizinhos(lote.id), { anterior: null, proximo: null }),
    leilaoId ? safe(getLotes({ leilao: leilaoId, limit: 5 }), { result: [] as Lote[] } as any) : Promise.resolve({ result: [] as Lote[] }),
    getSessionUser().catch(() => null),
    safe(getSiteConfig(), null as any),
  ]);

  const anterior = vizinhos.anterior;
  const proximo = vizinhos.proximo;
  const relacionados = (relacionadosData.result as Lote[]).filter((l) => l.id !== lote.id).slice(0, 4);
  // P6: realtime (url + clientId) vem do /site/config.
  const realtime = (config?.realtime ?? { url: null, clientId: null }) as { url: string | null; clientId: string | null };

  // aberto / em pregão — e nunca em leilão de parceria (o lance é lá fora).
  const podeLance = (lote.status === 1 || lote.status === 2) && !externa;
  const titulo = bem?.siteTitulo || lote.descricao || `Lote ${lote.numeroString || lote.numero}`;
  const loc = bem?.localizacao;

  const specs: { k: string; v: string }[] = [
    { k: 'Avaliação', v: moeda(lote.valorAvaliacao) },
    { k: 'Lance inicial', v: moeda(lote.valorInicial) },
    { k: 'Incremento', v: moeda(lote.valorIncremento) },
    { k: 'Status', v: lote.statusLabel },
  ];
  if (loc) specs.push({ k: 'Localização', v: [loc.cidade, loc.uf].filter(Boolean).join('/') || '—' });

  const veic = bem?.veiculo;

  return (
    <div className="container-page">
      {/* Breadcrumb + prev/next — todos os links na forma canônica `{id}-{slug}`. */}
      <div className="mb-3 flex items-center justify-between text-sm">
        <div className="text-gray-500">
          {leilaoId && (
            <Link href={hrefLeilao({ id: leilaoId, slug: leilao?.slug })} className="hover:text-marca">
              ← {leilao?.titulo || 'Voltar ao leilão'}
            </Link>
          )}
        </div>
        <div className="flex gap-2">
          {anterior && <Link href={hrefLote(anterior)} className="btn-outline">‹ Anterior</Link>}
          {proximo && <Link href={hrefLote(proximo)} className="btn-outline">Próximo ›</Link>}
        </div>
      </div>

      {/* Leilão de parceria: aviso antes de qualquer coisa — o visitante precisa
          saber que o lance deste lote não acontece aqui. */}
      {externa && (
        <AvisoLeilaoParceria url={externa} plataforma={leilao?.urlExternaEmpresa} className="mb-4" />
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div>
          <Galeria fotos={bem?.fotos || []} alt={titulo} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <BadgeLote status={lote.status} label={lote.statusLabel} />
            <span className="text-sm text-gray-500">Lote {lote.numeroString || lote.numero}</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold text-gray-800">{titulo}</h1>
          {bem?.siteSubtitulo && <p className="text-gray-600">{bem.siteSubtitulo}</p>}

          <div className="mt-4">
            <LanceBox
              loteId={lote.id}
              leilaoId={leilaoId}
              valorInicial={lote.valorInicial}
              valorIncremento={lote.valorIncremento}
              valorLanceAtual={lote.valorLanceAtual}
              totalLances={lote.totalLances}
              podeLance={podeLance}
              logado={!!user}
              loginHash={user?.loginHash}
              clientId={realtime.clientId ?? undefined}
              realtimeUrl={realtime.url ?? undefined}
            />
          </div>

          {/* Auditório virtual — CTA sutil abaixo do painel de lance (convenção de
              layout). Não aparece no leilão de parceria: o auditório é do site que
              conduz o pregão, não o nosso. */}
          {!externa && (
            <div className="mt-3">
              <BotaoAuditorio leilaoId={leilaoId} status={leilao?.status} aoVivo={leilao?.status === 4} variant="sutil" className="w-full" />
            </div>
          )}

          {/* Especificações */}
          <div className="mt-4 grid grid-cols-2 gap-2">
            {specs.map((s) => (
              <div key={s.k} className="rounded border border-gray-100 bg-white p-2">
                <p className="text-xs text-gray-400">{s.k}</p>
                <p className="text-sm font-semibold text-gray-800">{s.v}</p>
              </div>
            ))}
          </div>

          {/* Dados do veículo */}
          {veic && (
            <div className="mt-4 rounded-lg border border-gray-200 bg-white p-3">
              <p className="mb-2 text-sm font-semibold text-gray-700">Dados do veículo</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {veic.marca && <Spec k="Marca" v={veic.marca.nome} />}
                {veic.modelo && <Spec k="Modelo" v={veic.modelo.nome} />}
                {veic.anoFabricacao && <Spec k="Ano fab/mod" v={`${veic.anoFabricacao}/${veic.anoModelo || ''}`} />}
                {veic.cor && <Spec k="Cor" v={veic.cor.nome} />}
                {veic.combustivel && <Spec k="Combustível" v={veic.combustivel.nome} />}
                {veic.km != null && <Spec k="KM" v={String(veic.km)} />}
                {veic.placa && <Spec k="Placa" v={veic.placa} />}
                {veic.chassi && <Spec k="Chassi" v={veic.chassi} />}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Descrição / regras / taxas */}
      {(bem?.siteDescricao || lote.observacao || lote.textoTaxas) && (
        <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
          {bem?.siteDescricao && <Bloco titulo="Descrição" html={bem.siteDescricao} />}
          {bem?.siteObservacao && <Bloco titulo="Observações" html={bem.siteObservacao} />}
          {lote.textoTaxas && <Bloco titulo="Taxas e condições" html={lote.textoTaxas} />}
          {lote.observacao && <Bloco titulo="Observações do lote" html={lote.observacao} />}
        </div>
      )}

      {/* Relacionados */}
      {relacionados.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 text-xl font-bold text-gray-800">Outros lotes deste leilão</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {relacionados.map((l) => <LoteCard key={l.id} lote={l} />)}
          </div>
        </section>
      )}
    </div>
  );
}

function Spec({ k, v }: { k: string; v: string }) {
  return <div><span className="text-gray-400">{k}: </span><span className="font-medium text-gray-800">{v}</span></div>;
}
function Bloco({ titulo, html }: { titulo: string; html: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <p className="mb-2 text-sm font-semibold text-gray-700">{titulo}</p>
      <div className="prose prose-sm max-w-none text-sm text-gray-600" dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}
