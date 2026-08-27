'use client';
import { useEffect, useState } from 'react';

// Banner de EXEMPLO (modo exemplo) — mini-carrossel com setas + dots, só pra demonstrar o slot.
// No modo cliente (MODO_EXEMPLO=false), quem entra é o <Banner> com as imagens do /site/config.
const SLIDES = [
  { eyebrow: 'Banner de exemplo', titulo: 'Imóveis e veículos com preços de oportunidade', sub: 'Novos editais toda semana — cadastre-se e participe dos leilões online.' },
  { eyebrow: 'Banner de exemplo', titulo: 'Leilões judiciais com segurança jurídica', sub: 'Bens de processos judiciais e extrajudiciais, 100% online e documentado.' },
  { eyebrow: 'Banner de exemplo', titulo: 'Habilite-se em minutos e dê seu lance', sub: 'Cadastro rápido, aprovação ágil e suporte do leiloeiro oficial.' },
];

function Chevron({ dir }: { dir: 'l' | 'r' }) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
      <path d={dir === 'l' ? 'M15 18l-6-6 6-6' : 'M9 18l6-6-6-6'} />
    </svg>
  );
}

export default function BannerExemplo() {
  const [i, setI] = useState(0);
  const s = SLIDES[i];
  const go = (d: number) => setI((v) => (v + d + SLIDES.length) % SLIDES.length);

  // Auto-avança a cada 5s quando há mais de 1 banner. `i` na dependência reinicia o timer a
  // cada troca (manual ou automática), então depois de clicar você ganha os 5s cheios.
  useEffect(() => {
    if (SLIDES.length <= 1) return;
    const id = setInterval(() => setI((v) => (v + 1) % SLIDES.length), 5000);
    return () => clearInterval(id);
  }, [i]);

  return (
    <div className="lei-banner">
      <div className="lei-banner__content">
        <span className="lei-banner__eyebrow">{s.eyebrow}</span>
        <h3 className="lei-banner__title">{s.titulo}</h3>
        <p className="lei-banner__sub">{s.sub}</p>
      </div>
      <button type="button" className="lei-banner__arrow lei-banner__arrow--prev" onClick={() => go(-1)} aria-label="Banner anterior"><Chevron dir="l" /></button>
      <button type="button" className="lei-banner__arrow lei-banner__arrow--next" onClick={() => go(1)} aria-label="Próximo banner"><Chevron dir="r" /></button>
      <div className="lei-banner__dots">
        {SLIDES.map((_, k) => (
          <button key={k} type="button" onClick={() => setI(k)} aria-label={`Ir para o banner ${k + 1}`}>
            <i className={k === i ? 'is-on' : ''} style={{ display: 'block', width: k === i ? 22 : 8, height: 8, borderRadius: 999, background: k === i ? 'var(--brand-accent)' : 'rgba(255,255,255,.35)' }} />
          </button>
        ))}
      </div>
    </div>
  );
}
