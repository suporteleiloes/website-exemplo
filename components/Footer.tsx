import Link from 'next/link';
import { MODO_EXEMPLO } from '@/lib/config';
import type { SiteConfig, Leiloeiro } from '@/lib/types';

function Gavel() {
  return (
    <svg width={24} height={24} viewBox="0 0 24 24" fill="#fff" aria-hidden="true">
      <rect x="3" y="19.2" width="12" height="2.4" rx="1.2" />
      <g transform="rotate(45 11.5 8.5)">
        <rect x="7.4" y="3.4" width="8.2" height="4.6" rx="1.3" />
        <rect x="10.7" y="8" width="1.6" height="9" rx=".8" />
      </g>
    </svg>
  );
}

const ICON = {
  facebook: <path d="M14 9h3V6h-3c-2.2 0-4 1.8-4 4v2H8v3h2v7h3v-7h3l1-3h-4v-2c0-.6.4-1 1-1z" />,
  instagram: (<><rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" strokeWidth="1.9" /><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="1.9" /><circle cx="17.5" cy="6.5" r="1.1" /></>),
  whatsapp: (<path d="M21 12a9 9 0 0 1-13.3 7.9L3 21l1.2-4.6A9 9 0 1 1 21 12z" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />),
} as const;

// Endereço a partir do Record livre de config.endereco (campos podem vir null).
// Devolve DUAS linhas (rua/num · cidade-uf · cep) como no template.
function duasLinhasEndereco(e: Record<string, string | null> | undefined): { l1: string; l2: string } {
  if (!e) return { l1: '', l2: '' };
  const rua = e.logradouro || e.rua || e.endereco || '';
  const num = e.numero ? `, ${e.numero}` : '';
  const cidade = [e.cidade, e.uf].filter(Boolean).join(' - ');
  const cep = e.cep ? ` · ${e.cep}` : '';
  return { l1: (rua + num).trim(), l2: (cidade + cep).trim() };
}

// Footer do template. Onde o leiloeiro não preencheu o dado, cai em PLACEHOLDER (modo exemplo),
// exatamente como o HTML de referência — assim a tela nunca fica "quebrada"/vazia.
export default function Footer({ config, leiloeiros = [] }: { config: SiteConfig | null; leiloeiros?: Leiloeiro[] }) {
  const nome = MODO_EXEMPLO ? 'Leiloeiro Modelo' : (config?.siteName || 'Leiloeiro Modelo');
  const c = config?.contato;
  const redes = config?.redesSociais || {};

  // No MODO_EXEMPLO usamos SEMPRE os placeholders neutros do template (ignora o config do tenant,
  // que traria dados reais do leiloeiro de teste). Fora dele, config → fallback placeholder.
  const end = MODO_EXEMPLO ? { l1: '', l2: '' } : duasLinhasEndereco(config?.endereco);
  const endL1 = end.l1 || 'Av. Exemplo, 000';
  const endL2 = end.l2 || 'Cidade - UF · 00000-000';
  const telefone = (MODO_EXEMPLO ? '' : c?.telefone) || '(00) 0000-0000';
  const email = (MODO_EXEMPLO ? '' : c?.email) || 'contato@leiloeiro.com.br';
  const horario = (MODO_EXEMPLO ? '' : c?.horario) || 'Seg. a Sex., das 8h às 11:30h e das 13:30h às 18h';
  const lgpd = (MODO_EXEMPLO ? '' : (c as { lgpd?: string } | undefined)?.lgpd) || 'lgpd@leiloeiro.com.br';
  // Links dos contatos: endereço → Google Maps, telefone → app de ligação, e-mail → app de e-mail.
  const mapsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${endL1}, ${endL2}`)}`;
  const telHref = `tel:${telefone.replace(/[^\d+]/g, '')}`;
  const mailHref = `mailto:${email}`;

  const listaLeiloeiros = leiloeiros.length > 0
    ? leiloeiros.map((l) => ({ nome: l.nome || 'Leiloeiro Oficial', matricula: l.matricula || '0000' }))
    : [
        { nome: 'Nome do Leiloeiro Oficial', matricula: '0000' },
        { nome: 'Segundo Leiloeiro Oficial', matricula: '0000' },
        { nome: 'Terceiro Leiloeiro Oficial', matricula: '0000' },
      ];

  const social = ([
    ['facebook', redes.facebook || '#'],
    ['instagram', redes.instagram || '#'],
    ['whatsapp', redes.whatsapp || (c?.whatsapp ? `https://wa.me/${c.whatsapp.replace(/\D/g, '')}` : '#')],
  ] as const);

  return (
    <footer className="lei-footer">
      {/* newsletter */}
      <div className="lei-footer__news">
        <div className="lei-wrap lei-footer__news-inner">
          <div style={{ minWidth: 280 }}>
            <h2>Receba os próximos leilões no seu e-mail</h2>
            <p>Cadastre-se e seja avisado sobre novos editais e oportunidades.</p>
          </div>
          <form className="lei-news-form" action="/contato" method="get">
            <input name="email" placeholder="Seu melhor e-mail" aria-label="E-mail" />
            <button type="submit">Cadastrar</button>
          </form>
        </div>
      </div>

      {/* colunas */}
      <div className="lei-wrap lei-footer__cols">
        {/* marca + leiloeiros + social */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <span className="lei-logo__mark" style={{ background: 'var(--color-danger)', width: 46, height: 46, borderRadius: 10 }}>
              <Gavel />
            </span>
            <span className="lei-footer__brand-name">{nome}</span>
          </div>
          <div style={{ marginBottom: 22, maxWidth: 270 }}>
            <div className="lei-footer__label">Leiloeiros Oficiais</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {listaLeiloeiros.map((p, i) => (
                <span key={i} className="lei-footer__leiloeiro">
                  {p.nome} <span style={{ color: 'rgba(255,255,255,.45)' }}>|</span> <b>{p.matricula}</b>
                </span>
              ))}
            </div>
          </div>
          <div className="lei-social">
            {social.map(([rede, url]) => (
              <a key={rede} href={url} aria-label={rede} target={url === '#' ? undefined : '_blank'} rel="noopener noreferrer">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">{ICON[rede]}</svg>
              </a>
            ))}
          </div>
        </div>

        {/* Leilões */}
        <div>
          <div className="lei-footer__coltitle">Leilões</div>
          <div className="lei-footer__links">
            <Link href="/agenda">Calendário</Link>
            <Link href="/venda-direta">Venda Direta</Link>
            <Link href="/lotes?categoria=Im%C3%B3veis">Imóveis</Link>
            <Link href="/lotes?categoria=Ve%C3%ADculos">Veículos</Link>
            <Link href="/leiloes?encerrados=1">Realizados</Link>
          </div>
        </div>

        {/* Participante */}
        <div>
          <div className="lei-footer__coltitle">Participante</div>
          <div className="lei-footer__links">
            <Link href="/ajuda">Como participar</Link>
            <Link href="/cadastro">Cadastro</Link>
            <Link href="/ajuda">Dúvidas frequentes</Link>
            <Link href="/contato">Fale conosco</Link>
          </div>
        </div>

        {/* Atendimento */}
        <div>
          <div className="lei-footer__coltitle">Atendimento</div>
          <div className="lei-footer__links" style={{ gap: 15 }}>
            <a className="lei-footer__contact" href={mapsHref} target="_blank" rel="noopener noreferrer">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.55)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none', marginTop: 3 }}><path d="M12 21s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12z" /><circle cx="12" cy="9" r="2.5" /></svg>
              <span>{endL1}<br />{endL2}</span>
            </a>
            <a className="lei-footer__contact" href={telHref}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.55)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none', marginTop: 3 }}><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.6a2 2 0 0 1-.5 2.1L8.1 9.7a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.8.3 1.7.6 2.6.7a2 2 0 0 1 1.7 2z" /></svg>
              <span>{telefone}</span>
            </a>
            <a className="lei-footer__contact" href={mailHref}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.55)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none', marginTop: 3 }}><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M2 7l10 6 10-6" /></svg>
              <span>{email}</span>
            </a>
            <div className="lei-footer__contact">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.55)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none', marginTop: 3 }}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l4 2" /></svg>
              <span>{horario}</span>
            </div>
            <a className="lei-footer__contact" href={`mailto:${lgpd}`}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.55)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none', marginTop: 3 }}><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M2 7l10 6 10-6" /></svg>
              <span>LGPD: {lgpd}</span>
            </a>
          </div>
        </div>
      </div>

      {/* barra final */}
      <div className="lei-footer__bar">
        <div className="lei-wrap lei-footer__bar-inner">
          <span>© 2026 {nome} · Todos os direitos reservados.</span>
          <span className="lei-footer__ssl" aria-label="Site seguro — SSL e monitorado 24h">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="M9 12l2 2 4-4" /></svg>
            Site seguro — SSL e monitorado 24h
          </span>
          <span style={{ display: 'flex', gap: 22, flexWrap: 'wrap' }}>
            <Link href="/termos" style={{ color: 'rgba(255,255,255,.78)' }}>Termos de uso</Link>
            <Link href="/privacidade" style={{ color: 'rgba(255,255,255,.78)' }}>Política de privacidade</Link>
          </span>
        </div>
      </div>
    </footer>
  );
}
