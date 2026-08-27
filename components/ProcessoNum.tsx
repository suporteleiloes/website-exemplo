'use client';
import { useState } from 'react';

// Nº do processo — badge inline com Copiar (porta o .kl-l-proc do kleiloes-v2).
export default function ProcessoNum({ numero }: { numero: string }) {
  const [copiado, setCopiado] = useState(false);
  const copiar = () => {
    try { navigator.clipboard?.writeText(numero); } catch { /* ignora */ }
    setCopiado(true);
    setTimeout(() => setCopiado(false), 1500);
  };
  return (
    <div className="lei-lote-proc">
      <strong>Nº do Processo</strong>
      <span className="lei-lote-proc__num">{numero}</span>
      <span className="lei-lote-proc__copy" role="button" tabIndex={0} onClick={copiar} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') copiar(); }}>
        {copiado ? 'Copiado!' : 'Copiar'}
      </span>
    </div>
  );
}
