import Link from 'next/link';
import { getLeiloes } from '@/lib/api';
import { textoLocal } from '@/lib/format';
import type { Leilao } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Agenda de leilões', description: 'Datas dos próximos pregões. Programe-se para participar.', alternates: { canonical: '/agenda' } };

const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const MESES_CURTO = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

// Cor do "dot" de status na agenda (hex direto — fora do sistema de badges Tailwind).
function statusCor(status: number): string {
  if (status === 3 || status === 4) return '#157249'; // aberto / ao vivo
  if (status === 1 || status === 2) return 'var(--brand-accent-ink)'; // em breve
  return '#8A8880';
}

interface Item { leilao: Leilao; d: Date }
interface Grupo { key: string; mes: string; qtd: number; itens: Item[] }

export default async function AgendaPage() {
  let leiloes: Leilao[] = [];
  try {
    const r = await getLeiloes({ limit: 80, status: '1,2,3,4', sortBy: 'dataProximoLeilao', order: 'asc' });
    leiloes = r.result;
  } catch { /* mantém vazio */ }

  // Agrupa por mês/ano da data do próximo pregão.
  const grupos: Grupo[] = [];
  const idx = new Map<string, Grupo>();
  for (const l of leiloes) {
    const iso = l.dataProximoLeilao || l.data1;
    if (!iso) continue;
    const d = new Date(iso);
    if (isNaN(d.getTime())) continue;
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    let g = idx.get(key);
    if (!g) {
      g = { key, mes: `${MESES[d.getMonth()]} de ${d.getFullYear()}`, qtd: 0, itens: [] };
      idx.set(key, g);
      grupos.push(g);
    }
    g.itens.push({ leilao: l, d });
    g.qtd++;
  }

  const total = grupos.reduce((s, g) => s + g.qtd, 0);

  return (
    <main>
      {/* Hero */}
      <section className="lei-page-hero">
        <div className="lei-page-hero__glow" />
        <div className="lei-page-hero__in">
          <div className="lei-page-hero__crumb"><Link href="/">Início</Link> › Agenda de leilões</div>
          <div className="lei-page-hero__row">
            <div>
              <h1 className="lei-page-hero__title">Agenda de leilões</h1>
              <p className="lei-page-hero__lead">Acompanhe as datas dos próximos pregões e programe-se para participar.</p>
            </div>
            <div className="lei-page-hero__stats">
              <div>
                <div className="lei-page-hero__num" style={{ color: 'var(--brand-accent)' }}>{total}</div>
                <div className="lei-page-hero__cap">leilões agendados</div>
              </div>
              <span className="lei-page-hero__vsep" />
              <div>
                <div className="lei-page-hero__num">{grupos.length}</div>
                <div className="lei-page-hero__cap">{grupos.length === 1 ? 'mês com leilão' : 'meses com leilão'}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Lista por mês */}
      <section className="lei-agenda">
        {grupos.length === 0 && (
          <div className="lei-agenda__vazio">Nenhum leilão agendado no momento.</div>
        )}
        {grupos.map((g) => (
          <div key={g.key}>
            <div className="lei-agenda__mes">
              <span className="lei-agenda__mes-lbl">{g.mes}</span>
              <span className="lei-agenda__mes-line" />
              <span className="lei-agenda__mes-qtd">{g.qtd} {g.qtd === 1 ? 'leilão' : 'leilões'}</span>
            </div>

            <div className="lei-agenda__list">
              {g.itens.map(({ leilao: a, d }) => {
                const cor = statusCor(a.status);
                const href = `/leilao/${a.slug || a.id}`;
                const modalidade = a.tipoLabel || (a.tipo === 1 ? 'Online' : a.tipo === 2 ? 'Presencial' : a.tipo === 3 ? 'Simultâneo' : '');
                const hora = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                const local = textoLocal(a.local); // vazio quando sem endereço: não mostra nada
                const codigo = a.codigo || (a.numero ? `${a.numero}${a.ano ? '/' + a.ano : ''}` : String(a.id));
                // Comitentes: dedup por nome e ignora os que são só CNPJ/CPF (ex.: "24.754.392/0001-42").
                // Sem isso a API devolvia "DETRAN RS" repetido dezenas de vezes. Mostra até 2 + "e mais N".
                const nomesComitentes = Array.from(new Set(
                  (a.comitentes || []).map((c) => (c.nome || '').trim()).filter((n) => n && !/^[\d.\-/\s]+$/.test(n)),
                ));
                const comitente = nomesComitentes.length
                  ? (nomesComitentes.length > 2 ? `${nomesComitentes.slice(0, 2).join(', ')} e mais ${nomesComitentes.length - 2}` : nomesComitentes.join(', '))
                  : (a.titulo || 'Leilão');
                return (
                  <Link key={a.id} href={href} className="lei-agenda__card">
                    <div className="lei-agenda__date">
                      <div className="lei-agenda__date-d">{d.getDate()}</div>
                      <div className="lei-agenda__date-m">{MESES_CURTO[d.getMonth()]}</div>
                    </div>

                    <div className="lei-agenda__body">
                      <div className="lei-agenda__tags">
                        <span className="lei-agenda__st" style={{ color: cor }}>
                          <span className="lei-agenda__dot" style={{ background: cor }} />{a.statusLabel}
                        </span>
                        {modalidade && <span className="lei-agenda__mod">{modalidade}</span>}
                        {a.judicial && <span className="lei-agenda__mod">Judicial</span>}
                      </div>
                      <div className="lei-agenda__name">{comitente}</div>
                      <div className="lei-agenda__meta">Leilão {codigo}{local ? ` · ${local}` : ''}</div>
                    </div>

                    <div className="lei-agenda__right">
                      <div className="lei-agenda__col">
                        <div className="lei-agenda__col-lbl">Horário</div>
                        <div className="lei-agenda__col-val">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--brand-accent-ink)" strokeWidth="1.9"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l4 2" /></svg>
                          {hora}
                        </div>
                      </div>
                      {a.totalLotes != null && (
                        <div className="lei-agenda__col">
                          <div className="lei-agenda__col-lbl">Lotes</div>
                          <div className="lei-agenda__col-num">{a.totalLotes}</div>
                        </div>
                      )}
                      <span className="lei-agenda__go">
                        Ver lotes
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}
