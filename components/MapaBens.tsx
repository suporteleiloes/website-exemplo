'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import type { MapaPin } from '@/lib/api';
import type { FacetItem } from '@/lib/types';

// Carrega Leaflet via CDN (1x) e resolve quando o global L está pronto.
let leafletPromise: Promise<any> | null = null;
function loadLeaflet(): Promise<any> {
  if (typeof window === 'undefined') return Promise.reject('ssr');
  if ((window as any).L) return Promise.resolve((window as any).L);
  if (leafletPromise) return leafletPromise;
  leafletPromise = new Promise((resolve, reject) => {
    const css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(css);
    const s = document.createElement('script');
    s.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    s.onload = () => resolve((window as any).L);
    s.onerror = reject;
    document.head.appendChild(s);
  });
  return leafletPromise;
}

interface Props { ufs: FacetItem[]; cidades: FacetItem[] }

// Mapa de bens georreferenciado (Website V2 /mapa) com filtros UF + cidade.
export default function MapaBens({ ufs, cidades }: Props) {
  const elRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const layerRef = useRef<any>(null);
  const [uf, setUf] = useState('');
  const [cidade, setCidade] = useState('');
  const [total, setTotal] = useState<number | null>(null);
  const [carregando, setCarregando] = useState(false);

  const carregarPins = useCallback(async (L: any) => {
    setCarregando(true);
    try {
      const qs = new URLSearchParams();
      if (uf) qs.set('uf', uf);
      if (cidade) qs.set('cidade', cidade);
      const r = await fetch(`/api/proxy/website/v2/mapa?${qs.toString()}`, { cache: 'no-store' });
      const d = await r.json().catch(() => ({ result: [] }));
      const pins: MapaPin[] = Array.isArray(d?.result) ? d.result : [];
      setTotal(d?.total ?? pins.length);

      if (layerRef.current) layerRef.current.clearLayers();
      else layerRef.current = L.layerGroup().addTo(mapRef.current);

      const bounds: [number, number][] = [];
      for (const p of pins) {
        const lat = parseFloat(String(p.latitude));
        const lng = parseFloat(String(p.longitude));
        if (!isFinite(lat) || !isFinite(lng)) continue;
        bounds.push([lat, lng]);
        const href = `/lote/${p.loteSlug || p.loteId}`;
        const marker = L.marker([lat, lng]).addTo(layerRef.current);
        marker.bindPopup(
          `<div style="min-width:160px">
            <strong>${(p.titulo || 'Lote ' + p.numero || '').replace(/</g, '&lt;')}</strong><br/>
            <span style="color:#666">${[p.cidade, p.uf].filter(Boolean).join('/')}</span><br/>
            <a href="${href}" style="color:#1A4DB3;font-weight:600">Ver lote →</a>
          </div>`
        );
      }
      if (bounds.length) mapRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
    } finally {
      setCarregando(false);
    }
  }, [uf, cidade]);

  // init do mapa (1x)
  useEffect(() => {
    let cancel = false;
    loadLeaflet().then((L) => {
      if (cancel || !elRef.current || mapRef.current) return;
      mapRef.current = L.map(elRef.current).setView([-15.78, -47.93], 4); // Brasil
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap', maxZoom: 19,
      }).addTo(mapRef.current);
      carregarPins(L);
    });
    return () => { cancel = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // re-carrega ao mudar filtro
  useEffect(() => {
    if (mapRef.current && (window as any).L) carregarPins((window as any).L);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uf, cidade]);

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-end gap-3">
        <div>
          <label className="label">Estado</label>
          <select className="input min-w-[120px]" value={uf} onChange={(e) => { setUf(e.target.value); setCidade(''); }}>
            <option value="">Todos</option>
            {ufs.map((u) => <option key={String(u.id)} value={String(u.id)}>{u.nome} ({u.total})</option>)}
          </select>
        </div>
        <div>
          <label className="label">Cidade</label>
          <select className="input min-w-[180px]" value={cidade} onChange={(e) => setCidade(e.target.value)}>
            <option value="">Todas</option>
            {cidades.map((c) => <option key={String(c.id)} value={String(c.id)}>{c.nome} ({c.total})</option>)}
          </select>
        </div>
        <div className="ml-auto text-sm text-gray-500">
          {carregando ? 'Carregando…' : total !== null ? `${total} bem(ns) no mapa` : ''}
        </div>
      </div>
      <div ref={elRef} className="h-[600px] w-full rounded-lg border border-gray-200 bg-gray-100" />
      <p className="mt-2 text-xs text-gray-400">Pins de lotes georreferenciados (até 2.000). Clique num pin para abrir o lote.</p>
    </div>
  );
}
