import Link from 'next/link';
import type { Lote } from '@/lib/types';
import { moeda } from '@/lib/format';
import { BadgeLote } from './Badge';
import { fotoBem, PLACEHOLDER } from '@/lib/img';
import { hrefLote } from '@/lib/rota';
import LinkRedirecionamento from './RedirecionamentoExterno';
import { urlExternaValida } from '@/lib/externo';

export default function LoteCard({ lote }: { lote: Lote }) {
  const bem = lote.bem;
  const titulo = bem?.siteTitulo || lote.descricao || `Lote ${lote.numeroString || lote.numero}`;
  const valor = lote.valorLanceAtual ?? lote.valorInicial;
  const local = bem?.localizacao ? [bem.localizacao.cidade, bem.localizacao.uf].filter(Boolean).join('/') : null;

  // URL SEMPRE com ID (`/lote/{id}-{slug}`) — o slug vem do título do bem e muda
  // quando o leiloeiro corrige a descrição. Ver `lib/rota.ts`.
  const href = hrefLote(lote);

  // Lote de leilão de PARCERIA: o pregão é de outra plataforma, então nem o lote
  // pode abrir aqui dentro (daria a impressão de que o lance é conosco). A API
  // manda `urlExterna` também no leilão ANINHADO do lote, justamente pra isso.
  const externa = urlExternaValida(lote.leilao?.urlExterna);

  // Mesmo conteúdo nos dois casos — só muda o wrapper clicável.
  const conteudo = (
    <>
      <div className="relative h-44 w-full bg-gray-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={fotoBem(bem) || PLACEHOLDER} alt={titulo} className="h-full w-full object-cover" loading="lazy" />
        <span className="absolute left-2 top-2"><BadgeLote status={lote.status} label={lote.statusLabel} /></span>
        {lote.destaque && <span className="badge absolute right-2 top-2 bg-destaque text-white">Destaque</span>}
      </div>
      <div className="flex flex-1 flex-col p-3">
        <p className="text-xs text-gray-500">Lote {lote.numeroString || lote.numero}{local ? ` · ${local}` : ''}</p>
        <p className="mt-1 line-clamp-2 text-sm font-semibold text-gray-800">{titulo}</p>
        <div className="mt-auto pt-2">
          <p className="text-xs text-gray-500">{lote.valorLanceAtual ? 'Lance atual' : 'Lance inicial'}</p>
          <p className="text-lg font-bold text-marca">{moeda(valor)}</p>
          {externa
            ? <p className="text-xs font-semibold text-marca">Leilão em site parceiro</p>
            : (lote.totalLances ?? 0) > 0 && <p className="text-xs text-gray-500">{lote.totalLances} lance(s)</p>}
        </div>
      </div>
    </>
  );

  if (externa) {
    return (
      <LinkRedirecionamento
        url={externa}
        plataforma={lote.leilao?.urlExternaEmpresa}
        className="card flex flex-col"
        aria-label={`Acessar site externo do lote: ${titulo}`}
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
