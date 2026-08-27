import MapaBens from '@/components/MapaBens';
import { getFiltros } from '@/lib/api';
import type { Filtros } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Mapa de imóveis', description: 'Localização dos imóveis em leilão no mapa.', alternates: { canonical: '/mapa' } };

export default async function MapaPage(props: { searchParams: Promise<{ leilao?: string }> }) {
  const searchParams = await props.searchParams;
  let filtros: Filtros | null = null;
  try { filtros = await getFiltros(searchParams.leilao ? { leilao: searchParams.leilao } : undefined); } catch { /* segue sem selects */ }

  return (
    <div className="container-page">
      <h1 className="mb-1 text-2xl font-bold text-gray-800">Localização dos Imóveis</h1>
      <p className="mb-4 text-sm text-gray-500">Encontre os imóveis por localização no mapa. Filtre por estado e cidade.</p>
      <MapaBens ufs={filtros?.ufs || []} cidades={filtros?.cidades || []} leilao={searchParams.leilao} />
    </div>
  );
}
