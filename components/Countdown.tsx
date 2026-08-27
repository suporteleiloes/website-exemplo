'use client';
import { useEffect, useState } from 'react';

// Cronômetro regressivo até `alvo` (ISO). Mostra Dias/Horas/Min/Seg no visual do template.
export default function Countdown({ alvo }: { alvo: string | null }) {
  const [restante, setRestante] = useState<number | null>(null);

  useEffect(() => {
    if (!alvo) return;
    const fim = new Date(alvo).getTime();
    if (isNaN(fim)) return;
    const tick = () => setRestante(Math.max(0, fim - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [alvo]);

  if (restante == null) return null;
  const s = Math.floor(restante / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const seg = s % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  const cells: [string, string][] = [
    [String(d), 'Dias'],
    [pad(h), 'Horas'],
    [pad(m), 'Min'],
    [pad(seg), 'Seg'],
  ];

  return (
    <div className="lei-clock">
      {cells.map(([v, r]) => (
        <div key={r} className="lei-clock__cell">
          <div className="lei-clock__v">{v}</div>
          <div className="lei-clock__r">{r}</div>
        </div>
      ))}
    </div>
  );
}
