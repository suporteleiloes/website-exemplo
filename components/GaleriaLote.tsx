'use client';
import { useState } from 'react';

interface Props {
  fotos: string[];
  fase: string;
  comitente?: string | null;
  mapEmbed?: string | null;
  street?: string | null;
  video?: string | null;
}

// Galeria do lote (porta a do kleiloes-v2): foto principal + abas (fotos/mapa/street/vídeo) + thumbs.
export default function GaleriaLote({ fotos, fase, comitente, mapEmbed, street, video }: Props) {
  const [idx, setIdx] = useState(0);
  const [aba, setAba] = useState<'fotos' | 'mapa' | 'street' | 'video'>('fotos');
  const temTabs = !!(mapEmbed || street || video);
  const principal = fotos[idx];

  return (
    <div className="lei-lgal">
      <div className="lei-lgal__stage">
        <div
          className={`lei-lgal__main${!principal ? ' lei-noimg' : ''}`}
          style={{ display: aba === 'fotos' ? 'block' : 'none', ...(principal ? { backgroundImage: `url('${principal}')` } : {}) }}
        />
        {mapEmbed && <div className="lei-lgal__media" hidden={aba !== 'mapa'}><iframe src={mapEmbed} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" /></div>}
        {street && <div className="lei-lgal__media" hidden={aba !== 'street'}><iframe src={street} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" /></div>}
        {video && <div className="lei-lgal__media" hidden={aba !== 'video'}><iframe src={video} title="Vídeo" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen /></div>}
        <span className="lei-lgal__phase">{fase}</span>
        {comitente && <span className="lei-lgal__com">{comitente}</span>}
        {principal && aba === 'fotos' && (
          <a className="lei-lgal__zoom" href={principal} target="_blank" rel="noopener noreferrer">⤢ Ampliar fotos</a>
        )}
      </div>

      {temTabs && (
        <div className="lei-lgal__tabs">
          <button type="button" className={`lei-lgal__tab${aba === 'fotos' ? ' is-active' : ''}`} onClick={() => setAba('fotos')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-4.5-4.5L5 21" /></svg>
            Fotos
          </button>
          {mapEmbed && <button type="button" className={`lei-lgal__tab${aba === 'mapa' ? ' is-active' : ''}`} onClick={() => setAba('mapa')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 10c0 6-9 12-9 12s-9-6-9-12a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
            Mapa
          </button>}
          {street && <button type="button" className={`lei-lgal__tab${aba === 'street' ? ' is-active' : ''}`} onClick={() => setAba('street')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="7" r="4" /><path d="M5.5 21a6.5 6.5 0 0 1 13 0" /></svg>
            Street View
          </button>}
          {video && <button type="button" className={`lei-lgal__tab${aba === 'video' ? ' is-active' : ''}`} onClick={() => setAba('video')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="2" y="4" width="20" height="16" rx="3" /><path d="m10 9 5 3-5 3z" /></svg>
            Vídeo
          </button>}
        </div>
      )}

      {fotos.length > 1 && (
        <div className="lei-lgal__thumbs">
          {fotos.slice(0, 10).map((f, i) => (
            <div
              key={i}
              className={`lei-lgal__thumb${i === idx ? ' is-active' : ''}`}
              style={{ backgroundImage: `url('${f}')` }}
              onClick={() => { setIdx(i); setAba('fotos'); }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
