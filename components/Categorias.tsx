import Link from 'next/link';
import type { FacetItem } from '@/lib/types';

function nome(f: FacetItem) { return f.nome || f.label || String(f.id ?? f.value); }
function id(f: FacetItem) { return f.id ?? f.value; }

// Chips de categorias principais (de GET /buscador/filtros → categorias).
export default function Categorias({ categorias }: { categorias: FacetItem[] }) {
  if (!categorias?.length) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {categorias.slice(0, 12).map((c) => (
        <Link key={String(id(c))} href={`/lotes?categoria=${encodeURIComponent(String(id(c)))}`}
          className="rounded-full border border-gray-300 bg-white px-3 py-1.5 text-sm hover:border-marca hover:text-marca">
          {nome(c)}{c.total != null ? <span className="ml-1 text-xs text-gray-400">({c.total})</span> : null}
        </Link>
      ))}
    </div>
  );
}
