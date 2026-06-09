import MapaBens from '@/components/MapaBens';
import { getFiltros } from '@/lib/api';
import type { Filtros } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function MapaPage() {
  let filtros: Filtros | null = null;
  try { filtros = await getFiltros(); } catch { /* segue sem selects */ }

  return (
    <div className="container-page">
      <h1 className="mb-1 text-2xl font-bold text-gray-800">Mapa de bens</h1>
      <p className="mb-4 text-sm text-gray-500">Encontre lotes por localização. Filtre por estado e cidade.</p>
      <MapaBens ufs={filtros?.ufs || []} cidades={filtros?.cidades || []} />
    </div>
  );
}
