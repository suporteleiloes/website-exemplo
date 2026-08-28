import Link from 'next/link';
import EventoCard from '@/components/vd/EventoCard';
import AnuncioCard from '@/components/vd/AnuncioCard';
import { getEventos, getAnuncios, type Evento, type Anuncio } from '@/lib/vd';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Venda direta', description: 'Bens disponíveis para compra por proposta, fora do leilão.', alternates: { canonical: '/venda-direta' } };

type SP = Record<string, string | undefined>;

const SITUACOES: { key: string; label: string }[] = [
  { key: 'recebendo', label: 'Recebendo ofertas' },
  { key: 'em-breve', label: 'Em breve' },
  { key: 'encerrados', label: 'Encerrados' },
];

const gridCards = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: 18 } as const;

// Vitrine da VENDA DIRETA — mesmo padrão visual da Agenda (hero + empty state do template).
export default async function VendaDiretaPage(props: { searchParams: Promise<SP> }) {
  const searchParams = await props.searchParams;
  const situacao = searchParams.situacao || 'recebendo';
  let eventos: Evento[] = [];
  let destaques: Anuncio[] = [];
  let erro: string | null = null;
  try {
    const [ev, an] = await Promise.all([
      getEventos({ situacao, limit: 12 }),
      getAnuncios({ destaque: true, limit: 8 }),
    ]);
    eventos = ev.result;
    destaques = an.result;
  } catch (e) { erro = (e as Error).message; }

  return (
    <main>
      {/* Hero */}
      <section className="lei-page-hero">
        <div className="lei-page-hero__glow" />
        <div className="lei-page-hero__in">
          <div className="lei-page-hero__crumb"><Link href="/">Início</Link> › Venda direta</div>
          <div className="lei-page-hero__row">
            <div>
              <h1 className="lei-page-hero__title">Venda Direta</h1>
              <p className="lei-page-hero__lead">Compre direto, faça uma oferta ou envie sua proposta — sem disputa de auditório.</p>
            </div>
            <div className="lei-page-hero__stats">
              <div>
                <div className="lei-page-hero__num" style={{ color: 'var(--brand-accent)' }}>{eventos.length}</div>
                <div className="lei-page-hero__cap">{eventos.length === 1 ? 'oferta ativa' : 'ofertas'}</div>
              </div>
            </div>
          </div>
          {/* Filtros por situação */}
          <div className="lei-chips" style={{ justifyContent: 'flex-start', marginTop: 20 }}>
            {SITUACOES.map((s) => {
              const active = situacao === s.key;
              return (
                <Link
                  key={s.key}
                  href={`/venda-direta?situacao=${s.key}`}
                  className="lei-chip"
                  style={active ? { background: 'var(--brand-accent)', color: 'var(--brand-primary)', borderColor: 'var(--brand-accent)' } : undefined}
                >
                  {s.label}
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Corpo */}
      <section className="lei-wrap" style={{ padding: '34px 24px 60px' }}>
        {erro ? (
          <div className="lei-empty">
            <div className="lei-empty__ico">
              <svg width="27" height="27" viewBox="0 0 24 24" fill="none" stroke="#A8874B" strokeWidth="1.7"><circle cx="12" cy="12" r="9" /><path d="M12 8v4.5M12 16h.01" /></svg>
            </div>
            <h3>Não foi possível carregar</h3>
            <p>Tente novamente em instantes.</p>
          </div>
        ) : (
          <>
            {destaques.length > 0 && (
              <div style={{ marginBottom: 34 }}>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--brand-primary)', marginBottom: 16 }}>Em destaque</h2>
                <div style={gridCards}>
                  {destaques.map((a) => <AnuncioCard key={a.id} anuncio={a} />)}
                </div>
              </div>
            )}

            {eventos.length === 0 ? (
              <div className="lei-empty">
                <div className="lei-empty__ico">
                  <svg width="27" height="27" viewBox="0 0 24 24" fill="none" stroke="#A8874B" strokeWidth="1.7"><path d="M3 7.5l3-4h12l3 4M3 7.5h18v13H3zM9 12h6" /></svg>
                </div>
                <h3>Nenhuma venda direta no momento</h3>
                <p>Não há ofertas nesta situação agora. Volte em breve ou veja outra aba acima.</p>
              </div>
            ) : (
              <div style={gridCards}>
                {eventos.map((ev) => <EventoCard key={ev.id} evento={ev} />)}
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}
