import Link from 'next/link';
import type { Bloco } from '@/lib/pagina-cms';

/**
 * Layout das páginas de conteúdo institucional/legal (privacidade, cookies, termos).
 *
 * Recebe os blocos já limpos do CMS (quando o leiloeiro tem a página cadastrada)
 * OU um conteúdo MODELO de fallback. O CMS sempre vence: é o texto que o
 * jurídico do cliente aprovou.
 *
 * ⚠️ Quando o texto exibido é o MODELO, a página mostra um aviso explícito de
 * que se trata de conteúdo informativo e oferece o canal de contato. Não é
 * cosmético: afirmar prazos, bases legais nominais ou dados do encarregado que
 * ninguém verificou é pior do que não afirmar nada.
 */

export interface SecaoConteudo {
  titulo?: string;
  paragrafos: string[];
}

export interface ConteudoBase {
  /** Parágrafos de abertura (sem título de seção). */
  intro?: string[];
  /** Seções tituladas. */
  secoes: SecaoConteudo[];
}

interface Props {
  titulo: string;
  /** Uma linha abaixo do título. */
  subtitulo?: string;
  /** Blocos vindos do CMS já limpos. Vazio = usa o fallback. */
  blocos: Bloco[];
  /** Texto MODELO usado quando o CMS não tem a página. */
  fallback: ConteudoBase;
}

const P = 'mb-4 text-[15px] leading-relaxed text-gray-700';
const H = 'mb-2 mt-8 text-lg font-bold text-gray-900';

/** Renderiza os blocos do CMS na ordem (o h1 vira o título da página, então sai). */
function CorpoDoCms({ blocos }: { blocos: Bloco[] }) {
  return (
    <>
      {blocos
        .filter((b) => b.tag !== 'h1')
        .map((b, i) =>
          b.tag === 'p' ? <p key={i} className={P}>{b.texto}</p> : <h2 key={i} className={H}>{b.texto}</h2>,
        )}
    </>
  );
}

function CorpoModelo({ conteudo }: { conteudo: ConteudoBase }) {
  return (
    <>
      {conteudo.intro?.map((p, i) => <p key={`i${i}`} className={P}>{p}</p>)}
      {conteudo.secoes.map((s, i) => (
        <section key={i}>
          {s.titulo && <h2 className={H}>{s.titulo}</h2>}
          {s.paragrafos.map((p, j) => <p key={j} className={P}>{p}</p>)}
        </section>
      ))}
    </>
  );
}

export default function PaginaConteudo({ titulo, subtitulo, blocos, fallback }: Props) {
  const temCms = blocos.some((b) => b.tag !== 'h1');

  return (
    <div className="container-page">
      <nav aria-label="Trilha" className="mb-3 text-xs text-gray-500">
        <Link href="/" className="hover:text-marca">Início</Link> · {titulo}
      </nav>

      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">{titulo}</h1>
        {subtitulo && <p className="mt-2 max-w-2xl text-sm text-gray-600">{subtitulo}</p>}
      </header>

      <article className="max-w-3xl rounded-lg border border-gray-200 bg-white p-6 sm:p-8">
        {temCms ? <CorpoDoCms blocos={blocos} /> : <CorpoModelo conteudo={fallback} />}

        {!temCms && (
          <aside className="mt-8 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <strong className="block font-semibold">Conteúdo informativo</strong>
            <p className="mt-1 leading-relaxed">
              Este texto descreve as práticas gerais do site. Para o documento oficial completo,
              para exercer os seus direitos de titular de dados ou para esclarecer qualquer ponto,{' '}
              <Link href="/contato" className="font-semibold underline">fale com a nossa equipe</Link>.
            </p>
          </aside>
        )}
      </article>
    </div>
  );
}
