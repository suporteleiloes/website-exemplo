import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getArtigoServer } from '@/lib/widget';
import { WIDGET_SLUG } from '@/lib/config';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: { id: string } }) {
  const a = await getArtigoServer(WIDGET_SLUG, Number(params.id)).catch(() => null);
  return { title: a ? `${a.titulo} — Central de Ajuda` : 'Central de Ajuda' };
}

export default async function ArtigoPage({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!Number.isFinite(id)) notFound();
  const artigo = await getArtigoServer(WIDGET_SLUG, id).catch(() => null);
  if (!artigo) notFound();

  return (
    <div className="container-page max-w-3xl py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-1.5 text-sm text-gray-400">
        <Link href="/ajuda" className="hover:text-marca">Central de Ajuda</Link>
        <span>/</span>
        <Link href={`/ajuda?busca=${encodeURIComponent(artigo.categoria)}`} className="hover:text-marca">{artigo.categoria}</Link>
      </nav>

      <article className="rounded-2xl border border-gray-200 bg-white p-7 sm:p-9">
        <span className="inline-flex items-center rounded-full bg-marca/10 px-3 py-1 text-xs font-semibold text-marca">{artigo.categoria}</span>
        <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl">{artigo.titulo}</h1>
        <div className="artigo-corpo mt-5" dangerouslySetInnerHTML={{ __html: artigo.corpo || '' }} />
      </article>

      {/* Feedback / volta */}
      <div className="mt-6 flex flex-col items-center gap-3 rounded-2xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-6 text-center">
        <p className="text-sm font-medium text-gray-700">Esse artigo ajudou?</p>
        <p className="text-sm text-gray-500">Se ainda tiver dúvida, fale com nosso time pelo chat no canto da tela.</p>
        <Link href="/ajuda" className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold text-marca hover:underline">
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
          Voltar à Central de Ajuda
        </Link>
      </div>
    </div>
  );
}
