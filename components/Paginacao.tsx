import Link from 'next/link';

// Paginação por links (preserva os query params atuais, troca só `page`).
export default function Paginacao({ page, pages, makeHref }: { page: number; pages: number; makeHref: (p: number) => string }) {
  if (pages <= 1) return null;
  const prev = Math.max(1, page - 1);
  const next = Math.min(pages, page + 1);
  const nums: number[] = [];
  for (let p = Math.max(1, page - 2); p <= Math.min(pages, page + 2); p++) nums.push(p);

  return (
    <nav className="mt-6 flex items-center justify-center gap-1 text-sm">
      <Link href={makeHref(prev)} className={`btn-outline ${page === 1 ? 'pointer-events-none opacity-40' : ''}`}>Anterior</Link>
      {nums[0] > 1 && <span className="px-2 text-gray-400">…</span>}
      {nums.map((p) => (
        <Link key={p} href={makeHref(p)} className={p === page ? 'btn-primary' : 'btn-outline'}>{p}</Link>
      ))}
      {nums[nums.length - 1] < pages && <span className="px-2 text-gray-400">…</span>}
      <Link href={makeHref(next)} className={`btn-outline ${page === pages ? 'pointer-events-none opacity-40' : ''}`}>Próxima</Link>
    </nav>
  );
}
