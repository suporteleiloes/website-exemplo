import Link from 'next/link';
import type { Leilao } from '@/lib/types';
import { dataHora, prazoLeilao, TIPO_LEILAO } from '@/lib/format';
import { BadgeLeilao } from './Badge';
import { fotoLeilao, PLACEHOLDER } from '@/lib/img';
import { hrefLeilao } from '@/lib/rota';
import LinkRedirecionamento from './RedirecionamentoExterno';
import { urlExternaValida } from '@/lib/externo';

export default function LeilaoCard({ leilao }: { leilao: Leilao }) {
  const tipo = leilao.tipo ? TIPO_LEILAO[leilao.tipo] : leilao.tipoLabel;

  // URL SEMPRE com ID (`/leilao/{id}-{slug}`): o slug muda quando o leiloeiro
  // edita o título e quebraria os links já divulgados. Ver `lib/rota.ts`.
  const href = hrefLeilao(leilao);

  // LEILÃO DE PARCERIA: o pregão é de outra plataforma → o clique sai do site,
  // com aviso. Ver `components/RedirecionamentoExterno.tsx`.
  const externa = urlExternaValida(leilao.urlExterna);

  // Rótulo do prazo: decisão única em `prazoLeilao` (lib/format.ts) — o card não
  // inventa a sua. "Encerrado" vem SÓ do status (99); com o leilão aberto e a
  // data já vencida sai "Data prevista", nunca uma afirmação de encerramento.
  const prazo = prazoLeilao(leilao.status, leilao.dataProximoLeilao);

  // O conteúdo do card é idêntico nos dois casos — só muda o wrapper clicável.
  const conteudo = (
    <>
      <div className="relative h-40 w-full bg-gray-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={fotoLeilao(leilao) || PLACEHOLDER} alt={leilao.titulo || ''} className="h-full w-full object-cover" loading="lazy" />
        <span className="absolute left-2 top-2"><BadgeLeilao status={leilao.status} label={leilao.statusLabel} /></span>
        {leilao.judicial && <span className="badge absolute right-2 top-2 bg-marca-2 text-white">Judicial</span>}
      </div>
      <div className="flex flex-1 flex-col p-3">
        <p className="line-clamp-2 text-sm font-semibold text-gray-800">{leilao.titulo}</p>
        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500">
          {tipo && <span>{tipo}</span>}
          {leilao.totalLotes != null && <span>{leilao.totalLotes} lotes</span>}
          {externa && <span className="font-semibold text-marca">Leilão em site parceiro</span>}
        </div>
        <p className="mt-auto pt-2 text-xs text-gray-600">
          {prazo.modo === 'sem_data' ? prazo.rotulo : `${prazo.rotulo}: ${dataHora(leilao.dataProximoLeilao)}`}
        </p>
      </div>
    </>
  );

  if (externa) {
    return (
      <LinkRedirecionamento
        url={externa}
        plataforma={leilao.urlExternaEmpresa}
        className="card flex flex-col"
        aria-label={`Acessar site externo do leilão: ${leilao.titulo || leilao.id}`}
      >
        {conteudo}
      </LinkRedirecionamento>
    );
  }

  return (
    <Link href={href} className="card flex flex-col">
      {conteudo}
    </Link>
  );
}
