'use client';
import { useEffect, useState } from 'react';
import { moeda, mascararApelido, data as dataBR, horaSeg } from '@/lib/format';
import type { LancePublico } from '@/lib/types';

// Histórico de lances — seção full-width abaixo do conteúdo do lote (igual kleiloes-v2).
export default function HistoricoLances({ loteId }: { loteId: number }) {
  const [lances, setLances] = useState<LancePublico[]>([]);
  const [carregou, setCarregou] = useState(false);

  useEffect(() => {
    let vivo = true;
    fetch(`/api/proxy/website/v2/lotes/${loteId}/lances-publicos`, { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => {
        if (!vivo) return;
        setLances(Array.isArray(d?.result) ? d.result : []);
      })
      .catch(() => { /* silencioso */ })
      .finally(() => { if (vivo) setCarregou(true); });
    return () => { vivo = false; };
  }, [loteId]);

  if (!carregou) return null;

  return (
    <section className="lei-lote-hist">
      <h2>Histórico de Lances</h2>
      {lances.length > 0 && (
        <p className="lei-lote-hist__resumo">
          {lances.length} {lances.length === 1 ? 'lance' : 'lances'}
        </p>
      )}
      <div className="lei-lote-hist__wrap">
        <table>
          <thead>
            <tr>
              <th className="td-data">Data</th>
              <th className="td-user">Usuário</th>
              <th className="td-value">Valor</th>
            </tr>
          </thead>
          <tbody>
            {lances.length === 0 ? (
              <tr className="lei-lote-hist__empty">
                <td colSpan={3}>
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M3 3v18h18" /><path d="M18.5 9.5 13 15l-3-3-3.5 3.5" /></svg>
                  <strong>Nenhum lance até o momento</strong>
                  <span>Seja o primeiro a dar um lance neste lote.</span>
                </td>
              </tr>
            ) : (
              lances.map((l, i) => (
                <tr key={i}>
                  <td className="td-data">
                    {l.data ? <><strong>{dataBR(l.data)}</strong><span>{horaSeg(l.data)}</span></> : '—'}
                  </td>
                  <td className="td-user">{mascararApelido(l.apelido)}</td>
                  <td className={`td-value${i === 0 ? ' is-top' : ''}`}>{moeda(l.valor)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
