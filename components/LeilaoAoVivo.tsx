import Link from 'next/link';
import type { Leilao } from '@/lib/types';
import { fotoLeilao } from '@/lib/img';
import Countdown from './Countdown';

// Destaque "Leilão ao vivo / em andamento" — porta o bloco do template (cronômetro + CTAs).
export default function LeilaoAoVivo({ leilao }: { leilao: Leilao }) {
  const foto = fotoLeilao(leilao);
  const titulo = leilao.comitentes?.[0]?.nome || leilao.titulo || 'Leilão';
  const aoVivo = leilao.status === 4;
  // Leilão de EXEMPLO (id negativo) não existe na API → aponta pra lista real em vez de 404.
  const href = leilao.id < 0 ? '/leiloes' : `/leilao/${leilao.slug || leilao.id}`;
  const nLotes = leilao.totalLotes ?? 0;

  return (
    <section className="lei-section" style={{ paddingBottom: 0 }}>
      <div className="lei-live">
        <div className="lei-live__glow" />
        <div className="lei-live__grid">
          <div className="lei-live__body">
            <span className="lei-live__badge"><i />{aoVivo ? 'Ao vivo agora' : 'Aberto para lances'}</span>
            <h2 className="lei-live__title">{titulo}</h2>

            {leilao.dataProximoLeilao && (
              <div style={{ marginTop: 6 }}>
                <div className="lei-live__label">{aoVivo ? 'Encerra em' : 'Começa em'}</div>
                <div style={{ marginTop: 8 }}><Countdown alvo={leilao.dataProximoLeilao} /></div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 11, flexWrap: 'wrap', marginTop: 8 }}>
              <Link href={href} className="lei-live__cta">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"><path d="M23 7l-7 5 7 5V7z" /><rect x="1" y="5" width="15" height="14" rx="2" /></svg>
                Entrar no auditório
              </Link>
              <Link href={href} className="lei-live__cta lei-live__cta--ghost">Ver os {nLotes} lotes</Link>
            </div>
          </div>

          <div className="lei-live__media">
            {foto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={foto} alt={titulo} />
            ) : (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--brand-secondary)' }}>
                <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="var(--brand-accent)" strokeWidth=".85" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: .5 }}><rect x="3" y="19.4" width="10" height="2" rx="1" /><g transform="rotate(45 10 7.5)"><rect x="6.6" y="3" width="6.6" height="4" rx="1.1" /><rect x="9.3" y="6.8" width="1.3" height="7.6" rx=".65" /></g><path d="M4 21.6h16" /></svg>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
