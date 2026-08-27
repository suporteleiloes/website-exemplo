import Link from 'next/link';
import Popup from '@/components/Popup';
import Banner from '@/components/Banner';
import BannerExemplo from '@/components/BannerExemplo';
import HeroBusca from '@/components/HeroBusca';
import LeilaoAoVivo from '@/components/LeilaoAoVivo';
import LeilaoCard from '@/components/LeilaoCard';
import LoteCard from '@/components/LoteCard';
import { getBanners, getFiltros, getLeiloes, getLotes, getSiteConfig } from '@/lib/api';
import { MODO_EXEMPLO } from '@/lib/config';
import type { Banner as TBanner, Filtros, Leilao, Lote, SiteConfig } from '@/lib/types';

export const dynamic = 'force-dynamic'; // catálogo sempre ao vivo (sem prerender no build)

async function safe<T>(p: Promise<T>, fb: T): Promise<T> { try { return await p; } catch { return fb; } }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Pag = { result: any[]; total: number; page: number; limit: number; pages: number };

// Gera leilões de EXEMPLO (só no MODO_EXEMPLO) pra completar a grade quando o tenant tem poucos —
// assim a seção "Leilões" mostra os 12 cards do template. Dados variados e IDs negativos (não colidem).
function leiloesExemplo(inicio: number, quantidade: number): Leilao[] {
  const nomes = ['Tribunal de Justiça de SP', 'Prefeitura Municipal de Curitiba', 'Banco do Brasil S.A.', 'Caixa Econômica Federal', 'Vara do Trabalho de BH', 'Sicoob Crediminas', 'INSS - Instituto Nacional', 'Receita Federal do Brasil', 'Justiça Federal do Paraná', 'Município de Campinas', 'Energisa Distribuidora', 'Detran - Departamento Estadual'];
  const cidades = ['São Paulo - SP', 'Curitiba - PR', 'Belo Horizonte - MG', 'Rio de Janeiro - RJ', 'Salvador - BA', 'Campinas - SP', 'Londrina - PR', 'Manaus - AM'];
  const base = new Date();
  return Array.from({ length: Math.max(0, quantidade) }, (_, k) => {
    const i = inicio + k;
    const d = new Date(base.getTime() + (5 + i * 3) * 86400000).toISOString();
    return {
      id: -(1000 + i), slug: `exemplo-${i}`, titulo: nomes[i % nomes.length],
      comitentes: [{ nome: nomes[i % nomes.length] }], instancia: 1, praca: 1,
      judicial: i % 3 === 0, vendaDireta: false, status: 3, statusLabel: 'Aberto para lances',
      dataProximoLeilao: d, totalLotes: 5 + (i * 7) % 80, local: cidades[i % cidades.length], image: null,
    } as unknown as Leilao;
  });
}

function SecaoLink({ href }: { href: string }) {
  return (
    <Link href={href} className="lei-section__link">
      Ver todos
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
    </Link>
  );
}

export default async function Home() {
  const emptyP: Pag = { result: [], total: 0, page: 1, limit: 0, pages: 0 };
  const [config, bannersHome, bannersPopup, filtros, leiloesP, lotesDestaque, dispCount] = await Promise.all([
    safe(getSiteConfig(), null as SiteConfig | null),
    safe(getBanners('home').then((d) => d.result), [] as TBanner[]),
    safe(getBanners('popup').then((d) => d.result), [] as TBanner[]),
    safe(getFiltros(), { categorias: [], subcategorias: [], ufs: [], cidades: [], bairros: [], comitentes: [] } as Filtros),
    // "Leilões" = os próximos que VÃO acontecer (padrão kleiloes): status 1,3,4, sem venda direta,
    // ordenados pela próxima data. O corte "hoje/futuro" é aplicado abaixo.
    safe(getLeiloes({ status: '1,3,4', vendaDireta: false, somenteAtivos: true, sortBy: 'dataProximoLeilao', order: 'asc', limit: 24 }), emptyP),
    safe(getLotes({ destaque: true, somenteAtivos: true, limit: 8 }), emptyP),
    // Contagem de lotes DISPONÍVEIS (abertos em leilões ativos) — igual ao "disponíveis" do kleiloes.
    safe(getLotes({ leilaoStatus: '1,3,4', somenteAtivos: true, status: 1, limit: 1 }), emptyP),
  ]);

  const hoje = new Date().toISOString().slice(0, 10);
  const futuros: Leilao[] = (leiloesP.result as Leilao[]).filter((l) => {
    const d = l.dataProximoLeilao ? String(l.dataProximoLeilao).slice(0, 10) : '';
    return d !== '' && d >= hoje;
  });
  // Fonte dos cards: leilões FUTUROS; se não houver (ex.: dados de demonstração com datas passadas),
  // cai nos leilões ATIVOS reais do tenant (status 1,3,4). Assim clicar num card SEMPRE abre um
  // leilão REAL com seus lotes — nunca um card de exemplo (fake) que não existe na API.
  const fonteLeiloes: Leilao[] = futuros.length > 0 ? futuros : (leiloesP.result as Leilao[]);
  // Destaque "ao vivo" = primeiro leilão aberto/em pregão (status 3/4); senão o próximo da fila.
  const aoVivo: Leilao | undefined = fonteLeiloes.find((l) => l.status === 3 || l.status === 4)
    || fonteLeiloes[0]
    || (MODO_EXEMPLO ? { ...leiloesExemplo(50, 1)[0], status: 4, statusLabel: 'Em leilão' } : undefined);
  const grade: Leilao[] = fonteLeiloes.filter((l) => l.id !== aoVivo?.id);
  // Cards reais têm prioridade. Só completa com exemplos se NÃO houver nenhum leilão real.
  const gradeCards: Leilao[] = grade.length > 0
    ? grade.slice(0, 12)
    : (MODO_EXEMPLO ? leiloesExemplo(0, 12) : []);
  const destaques: Lote[] = lotesDestaque.result;
  const features = config?.features; // flags do ERP (liveHome, destaquesHome, mostrar*, etc.)
  // Textos do hero: usa o que o leiloeiro configurou no ERP; vazio = texto padrão do template.
  const heroTitulo = config?.hero?.titulo?.trim() || '';
  const heroSub = config?.hero?.subtitulo?.trim() || '';
  const totalLotes = dispCount.total ?? 0; // lotes disponíveis (abertos em leilões ativos)
  const chips = filtros.categorias.slice(0, 6);

  return (
    <>
      {!MODO_EXEMPLO && <Popup banners={bannersPopup} />}

      {/* ===== HERO + BUSCA ===== */}
      <section className="lei-hero">
        <div className="lei-hero__glow" />
        <div className="lei-hero__inner">
          <div className="lei-hero__head">
            {totalLotes > 0 && <span className="lei-hero__badge">{totalLotes.toLocaleString('pt-BR')} lotes disponíveis</span>}
            <h1 className="lei-hero__title">{heroTitulo || <>Arremate com <em>segurança jurídica</em> e transparência</>}</h1>
            <p className="lei-hero__sub">{heroSub || 'Leilões judiciais e extrajudiciais de imóveis, veículos e máquinas.'}</p>
          </div>

          <HeroBusca categorias={filtros.categorias} ufs={filtros.ufs} comitentes={filtros.comitentes} />

          {chips.length > 0 && (
            <div className="lei-chips">
              {chips.map((c) => (
                <Link key={String(c.id ?? c.nome)} href={`/leiloes?categoria=${encodeURIComponent(String(c.id ?? c.nome))}`} className="lei-chip">
                  {c.nome}{c.total != null ? ` · ${c.total}` : ''}
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ===== BANNER ===== No modo exemplo mostra um banner de EXEMPLO (o real vem do leiloeiro
          via API). Fora do modo exemplo, usa os banners do /site/config. */}
      {MODO_EXEMPLO ? (
        <section className="lei-section" style={{ paddingBottom: 0, paddingTop: 26 }}>
          <BannerExemplo />
        </section>
      ) : bannersHome.length > 0 && (
        <section className="lei-section" style={{ paddingBottom: 0 }}>
          <Banner banners={bannersHome} />
        </section>
      )}

      {/* ===== LEILÃO AO VIVO / EM DESTAQUE ===== (feature liveHome) */}
      {features?.liveHome !== false && aoVivo && <LeilaoAoVivo leilao={aoVivo} />}

      {/* ===== LOTES EM DESTAQUE ===== (feature destaquesHome) */}
      {features?.destaquesHome !== false && destaques.length > 0 && (
        <section className="lei-section">
          <div className="lei-section__head">
            <h2 className="lei-section__title">Lotes em destaque</h2>
            <SecaoLink href="/lotes?destaque=1" />
          </div>
          <div className="lei-grid-lotes">
            {destaques.slice(0, 5).map((lt) => <LoteCard key={lt.id} lote={lt} compact />)}
          </div>
        </section>
      )}

      {/* ===== LEILÕES (próximos que vão acontecer) ===== */}
      <section className="lei-section">
        <div className="lei-section__head">
          <h2 className="lei-section__title">Leilões</h2>
          <SecaoLink href="/leiloes" />
        </div>
        {gradeCards.length > 0 ? (
          <div className="lei-grid-leiloes">
            {gradeCards.map((l, i) => <LeilaoCard key={`${l.id}-${i}`} leilao={l} features={features} />)}
          </div>
        ) : (
          <div className="lei-empty">
            <div className="lei-empty__ico">
              <svg width="27" height="27" viewBox="0 0 24 24" fill="none" stroke="#A8874B" strokeWidth="1.7"><rect x="3" y="4.5" width="18" height="17" rx="2" /><path d="M3 9.5h18M8 2.5v4M16 2.5v4" /></svg>
            </div>
            <h3>Nenhum leilão agendado no momento</h3>
            <p>Cadastre-se para ser avisado assim que novos leilões forem publicados.</p>
          </div>
        )}
      </section>

      <div style={{ height: 66 }} />
    </>
  );
}
