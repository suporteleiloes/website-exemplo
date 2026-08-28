import Link from 'next/link';
import { redirect } from 'next/navigation';
import LogoutButton from '@/components/auth/LogoutButton';
import { getSessionUser, authFetch } from '@/lib/auth';
import { moeda } from '@/lib/format';
import { fotoBem, urlImagem } from '@/lib/img';
import '../conta.css';

export const dynamic = 'force-dynamic';

// URLs de lote/leilão seguem a convenção do site (slug com fallback pro id).
const hrefLote = (l: { id: number | string; slug?: string | null }) => `/lote/${l.slug || l.id}`;
const hrefLeilao = (l: { id: number | string; slug?: string | null }) => `/leilao/${l.slug || l.id}`;

/* eslint-disable @typescript-eslint/no-explicit-any */
async function getJson(path: string): Promise<any | null> {
  try { const r = await authFetch(path); if (!r.ok) return null; return await r.json(); } catch { return null; }
}
const nomeItem = (x: any): string =>
  x?.bem?.siteTitulo || x?.siteTitulo || x?.descricao || x?.titulo || x?.lote?.bem?.siteTitulo || x?.leilao?.titulo || 'Lote favoritado';
const iniciais = (n: string) => (n || '?').trim().split(/\s+/).slice(0, 2).map((s) => s[0] || '').join('').toUpperCase();
const papelBonito = (r: string) => r.replace(/^ROLE_/, '').replace(/_/g, ' ').toLowerCase();
const faseFav = (l: any): string => {
  const le = l?.leilao;
  if (le?.vendaDireta) return 'Venda direta';
  const inst = le?.instancia ?? 1;
  if (inst <= 1) return 'Leilão único';
  return le?.praca === 2 ? '2º leilão' : le?.praca === 3 ? '3º leilão' : '1º leilão';
};

export default async function ContaPage() {
  const user = await getSessionUser().catch(() => null);
  if (!user) redirect('/login');

  const [me, fav, lances, habs, props, docs] = await Promise.all([
    getJson('/api/website/v2/me'),
    getJson('/api/website/v2/me/favoritos'),
    getJson('/api/website/v2/me/lances'),
    getJson('/api/website/v2/me/habilitacoes'),
    getJson('/api/website/v2/me/propostas'),
    getJson('/api/website/v2/me/documentos'),
  ]);
  const docItems: any[] = docs?.result || [];

  const nome = me?.pessoa?.nome || user.name || user.username || 'arrematante';
  const email = user.username || '';
  const aprovado = me?.aprovado === true;
  const idArr = me?.id ?? '—';
  const roles = (user.roles || []).filter((r: string) => r && r !== 'ROLE_USER').slice(0, 6);

  // Favoritos podem vir em lotes, leilões OU bens — o total conta os três. Combina todos p/ a lista.
  const favLotes: any[] = [
    ...(fav?.lotes || []).map((x: any) => ({ ...x, _t: 'lote' })),
    ...(fav?.leiloes || []).map((x: any) => ({ ...x, _t: 'leilao' })),
    ...(fav?.bens || []).map((x: any) => ({ ...x, _t: 'bem' })),
  ];
  const nFav = fav?.total ?? favLotes.length;
  const nLances = lances?.total ?? (lances?.result?.length ?? 0);
  const habItems: any[] = habs?.result || [];
  const nHab = habs?.total ?? habItems.length;
  const nProp = props?.total ?? (props?.result?.length ?? 0);

  return (
    <div className="lei-conta">
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="stylesheet" precedence="high" href="https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&family=Karla:wght@400;500;600;700&display=swap" />

      <div className="lei-conta__wrap">
        {/* Hero */}
        <div className="lei-conta__hero">
          <div>
            <span className="lei-conta__eyebrow">Área do arrematante</span>
            <h1 className="lei-conta__hi">Olá, {nome}</h1>
            <span className={`lei-conta__badge${aprovado ? '' : ' lei-conta__badge--off'}`}>
              {aprovado
                ? <><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg> Cadastro habilitado</>
                : <>Cadastro em análise</>}
            </span>
          </div>
          <div className="lei-conta__hero-acts">
            <Link href="/leiloes" className="lei-conta__cta">Ver leilões abertos <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg></Link>
            <LogoutButton />
          </div>
        </div>

        {/* Stats */}
        <div className="lei-conta__stats">
          <div className="lei-conta__stat"><span className="lei-conta__stat-ic lei-conta__stat-ic--gold"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" /></svg></span><div><b>{nFav}</b><span>favoritos</span></div></div>
          <div className="lei-conta__stat"><span className="lei-conta__stat-ic lei-conta__stat-ic--wine"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="m14 13-8.5 8.5a2.1 2.1 0 0 1-3-3L11 10" /><path d="m16 16 6-6" /><path d="m8 8 6-6" /><path d="m9 7 8 8" /><path d="m21 11-8-8" /></svg></span><div><b>{nLances}</b><span>lances dados</span></div></div>
          <div className="lei-conta__stat"><span className="lei-conta__stat-ic lei-conta__stat-ic--green"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="m9 12 2 2 4-4" /></svg></span><div><b>{nHab}</b><span>{nHab === 1 ? 'leilão habilitado' : 'leilões habilitados'}</span></div></div>
          <div className="lei-conta__stat"><span className="lei-conta__stat-ic lei-conta__stat-ic--blue"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg></span><div><b>{nProp}</b><span>propostas enviadas</span></div></div>
        </div>

        {/* Grid */}
        <div className="lei-conta__grid">
          {/* Meus dados (com Documentos fixado no rodapé do card) */}
          <div className="lei-card">
            <div className="lei-card__head"><span className="lei-card__h">Meus dados</span></div>
            <div className="lei-conta__me">
              <span className="lei-conta__avatar">{iniciais(nome)}</span>
              <div><div className="lei-conta__me-nome">{nome}</div><div className="lei-conta__me-mail">{email}</div></div>
            </div>
            <dl className="lei-conta__dl">
              <div className="lei-conta__row"><dt>ID de arrematante</dt><dd>{idArr}</dd></div>
              {roles.length > 0 && (
                <div className="lei-conta__row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 8 }}>
                  <dt>Perfis de acesso</dt>
                  <div className="lei-conta__chips">{roles.map((r: string) => <span key={r} className="lei-conta__chip">{papelBonito(r)}</span>)}</div>
                </div>
              )}
            </dl>
            <div className="lei-conta__docs">
              <b>Documentos {docItems.length > 0 && <span className="lei-card__count">{docItems.length}</span>}</b>
              {docItems.length > 0 ? (
                <div className="lei-conta__doclist">
                  {docItems.slice(0, 4).map((d) => (
                    <a key={d.id} href={d.download ? `/api/proxy${d.download.replace(/^\/api/, '')}` : '#'} target="_blank" rel="noopener noreferrer" className="lei-conta__doc">
                      <span className="lei-conta__doc-ic"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg></span>
                      <span className="lei-conta__doc-t">{d.nome || d.tipo || 'Documento'}{d.validade ? ` · val. ${d.validade.split('-').reverse().join('/')}` : ''}</span>
                    </a>
                  ))}
                </div>
              ) : (
                <p>Mantenha seus documentos atualizados para agilizar novas habilitações.</p>
              )}
            </div>
          </div>

          {/* Meus favoritos */}
          <div className="lei-card">
            <div className="lei-card__head"><span className="lei-card__h">Meus favoritos <span className="lei-card__count">{nFav}</span></span></div>
            {favLotes.length === 0 ? (
              <div className="lei-conta__empty lei-conta__empty--tall">
                <div className="lei-conta__empty-ic lei-conta__empty-ic--heart"><svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" /></svg></div>
                <strong>Ainda não há favoritos</strong>
                <p>Salve lotes que você quer acompanhar e encontre-os rapidamente depois.</p>
                <Link href="/lotes">Explorar lotes →</Link>
              </div>
            ) : (
              <div className="lei-conta__list">
                {favLotes.map((l) => {
                  // Foto e rota conforme o tipo. Lote traz `bem`+`slug`; bem avulso é o próprio
                  // objeto (sem lote → sem link); leilão usa a própria imagem.
                  const foto = l._t === 'lote' ? fotoBem(l.bem) : l._t === 'bem' ? fotoBem(l) : urlImagem(l.image, 'min');
                  const href = l._t === 'leilao' ? hrefLeilao({ id: l.id, slug: l.slug }) : l._t === 'lote' ? hrefLote({ id: l.id, slug: l.slug }) : null;
                  const preco = l.valorInicial != null ? moeda(l.valorInicial) : null;
                  const meta = [preco, l._t !== 'leilao' ? faseFav(l) : null].filter(Boolean).join(' · ');
                  const inner = (
                    <>
                      {foto ? <span className="lei-conta__fav-img" style={{ backgroundImage: `url('${foto}')` }} /> : <span className="lei-conta__fav-img lei-conta__fav-img--none"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-5-5L5 21" /></svg></span>}
                      <div className="lei-conta__fav-body">
                        <span className="lei-conta__fav-id">#{l.id}</span>
                        <span className="lei-conta__fav-t">{nomeItem(l)}</span>
                        {meta && <span className="lei-conta__fav-meta">{meta}</span>}
                      </div>
                      {href && <span className="lei-conta__fav-ch"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg></span>}
                    </>
                  );
                  return href ? (
                    <Link key={`${l._t}-${l.id}`} href={href} className="lei-conta__fav">{inner}</Link>
                  ) : (
                    <div key={`${l._t}-${l.id}`} className="lei-conta__fav">{inner}</div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Linha inferior */}
        <div className="lei-conta__bottom" style={{ marginTop: 18 }}>
          {/* Lances */}
          <div className="lei-card">
            <div className="lei-card__head"><span className="lei-card__h">Meus lances <span className="lei-card__count">{nLances}</span></span></div>
            <div className="lei-conta__empty">
              <div className="lei-conta__empty-ic"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m14 13-8.5 8.5a2.1 2.1 0 0 1-3-3L11 10" /><path d="m16 16 6-6" /><path d="m8 8 6-6" /><path d="m9 7 8 8" /><path d="m21 11-8-8" /></svg></div>
              <p>{nLances > 0 ? `Você tem ${nLances} lance${nLances > 1 ? 's' : ''} registrado${nLances > 1 ? 's' : ''}.` : 'Você ainda não deu nenhum lance.'}</p>
              <Link href="/lotes">Explorar lotes abertos →</Link>
            </div>
          </div>

          {/* Habilitações */}
          <div className="lei-card">
            <div className="lei-card__head"><span className="lei-card__h">Habilitações <span className="lei-card__count">{nHab}</span></span></div>
            {habItems.length > 0 ? (
              <div className="lei-conta__hablist">
                {habItems.map((h, i) => {
                  const st = h.status === 99 ? 'reprovada' : h.status === 0 ? 'analise' : 'aprovada';
                  return (
                    <div className={`lei-conta__hab lei-conta__hab--${st}`} key={h.id || i}>
                      <span className="lei-conta__hab-tag">{h.status_label || 'Habilitado'}</span>
                      <div className="lei-conta__hab-nome">{h.leilao?.titulo || `Leilão ${h.leilao?.codigo || ''}`}</div>
                      <div className="lei-conta__hab-sub">{h.leilao?.judicial ? 'Leilão judicial' : 'Leilão'}{h.leilao?.id ? <> · <Link href={hrefLeilao({ id: h.leilao.id, slug: h.leilao.slug })}>ver detalhes →</Link></> : ''}</div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="lei-conta__empty">
                <div className="lei-conta__empty-ic"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg></div>
                <p>Você ainda não está habilitado em nenhum leilão.</p>
                <Link href="/leiloes">Ver leilões →</Link>
              </div>
            )}
          </div>

          {/* Propostas */}
          <div className="lei-card">
            <div className="lei-card__head"><span className="lei-card__h">Propostas <span className="lei-card__count">{nProp}</span></span></div>
            <div className="lei-conta__empty">
              <div className="lei-conta__empty-ic"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg></div>
              <p>{nProp > 0 ? `Você enviou ${nProp} proposta${nProp > 1 ? 's' : ''} de venda direta.` : 'Nenhuma proposta de venda direta enviada.'}</p>
              <Link href="/leiloes?tipo=vendaDireta">Ver venda direta →</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
