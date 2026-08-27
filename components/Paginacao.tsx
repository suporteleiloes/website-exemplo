import Link from 'next/link';

// Paginação redonda (estilo do template): setas circulares + números em pílula (ativo navy).
export default function Paginacao({ page, pages, makeHref }: { page: number; pages: number; makeHref: (p: number) => string }) {
  if (pages <= 1) return null;
  const prev = Math.max(1, page - 1);
  const next = Math.min(pages, page + 1);
  const nums: number[] = [];
  for (let p = Math.max(1, page - 2); p <= Math.min(pages, page + 2); p++) nums.push(p);

  return (
    <nav className="lei-pag" aria-label="Paginação">
      <Link href={makeHref(prev)} aria-label="Anterior" className={`lei-pag__arrow${page === 1 ? ' is-disabled' : ''}`}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M15 18l-6-6 6-6" /></svg>
      </Link>
      {nums[0] > 1 && (
        <>
          <Link href={makeHref(1)} className="lei-pag__num">1</Link>
          <span className="lei-pag__dots">…</span>
        </>
      )}
      {nums.map((p) => (
        <Link key={p} href={makeHref(p)} className={`lei-pag__num${p === page ? ' is-active' : ''}`} aria-current={p === page ? 'page' : undefined}>{p}</Link>
      ))}
      {nums[nums.length - 1] < pages && (
        <>
          <span className="lei-pag__dots">…</span>
          <Link href={makeHref(pages)} className="lei-pag__num">{pages}</Link>
        </>
      )}
      <Link href={makeHref(next)} aria-label="Próxima" className={`lei-pag__arrow${page === pages ? ' is-disabled' : ''}`}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M9 18l6-6-6-6" /></svg>
      </Link>
    </nav>
  );
}
