import ContatoForm from '@/components/ContatoForm';
import { getContatoSetores, getSiteConfig, type ContatoSetores } from '@/lib/api';
import type { SiteConfig } from '@/lib/types';
import { MODO_EXEMPLO } from '@/lib/config';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Contato', description: 'Fale com o leiloeiro: dúvidas, suporte e atendimento.', alternates: { canonical: '/contato' } };

// Formata o WhatsApp bruto (5544998660707) para "(44) 99866-0707".
function fmtWhats(raw: string): string {
  const d = raw.replace(/\D/g, '').replace(/^55/, '');
  const ddd = d.slice(0, 2);
  const num = d.slice(2);
  const meio = num.length > 8 ? num.slice(0, 5) : num.slice(0, 4);
  const fim = num.length > 8 ? num.slice(5) : num.slice(4);
  return `(${ddd}) ${meio}-${fim}`;
}

// Monta o endereço a partir do Record livre de config.endereco (campos podem vir null).
// Devolve a linha de exibição + CEP + a query já codificada p/ o Google Maps, ou null se vazio.
function montaEndereco(e: Record<string, string | null> | undefined): { linha: string; cep: string; query: string } | null {
  if (!e) return null;
  const rua = e.logradouro || e.rua || e.endereco || '';
  const num = e.numero ? `, ${e.numero}` : '';
  const bairro = e.bairro || '';
  const cidade = [e.cidade, e.uf].filter(Boolean).join(' - ');
  const partes = [(rua + num).trim(), bairro, cidade].filter(Boolean);
  const cep = e.cep || '';
  if (partes.length === 0 && !cep) return null;
  const linha = partes.join(', ');
  return { linha, cep, query: encodeURIComponent([linha, cep].filter(Boolean).join(', ')) };
}

export default async function ContatoPage() {
  const safe = async <T,>(p: Promise<T>, fb: T) => { try { return await p; } catch { return fb; } };
  const [setores, config] = await Promise.all([
    safe<ContatoSetores | null>(getContatoSetores(), null),
    safe<SiteConfig | null>(getSiteConfig(), null),
  ]);

  // Dados vêm do config (não de constantes). No MODO_EXEMPLO usamos placeholders neutros do
  // template (ou escondemos), como o Footer — a tela nunca fica quebrada/vazia.
  const whats = MODO_EXEMPLO ? '' : (config?.contato?.whatsapp || '');
  const tel = MODO_EXEMPLO ? '(00) 0000-0000' : (config?.contato?.telefone || '');
  const email = MODO_EXEMPLO ? 'contato@leiloeiro.com.br' : (config?.contato?.email || '');
  const end = MODO_EXEMPLO
    ? { linha: 'Av. Exemplo, 000, Centro, Cidade - UF', cep: '00000-000', query: '' }
    : montaEndereco(config?.endereco);
  const temContato = whats || tel || email || end;

  return (
    <>
      {/* Hero (gradiente da marca). */}
      <section className="lei-fc-hero">
        <div className="lei-fc-hero__inner">
          <h1>Tem dúvidas ou precisa de mais informações?</h1>
          <p>Entre em contato conosco e nossa equipe estará pronta para ajudar.</p>
        </div>
      </section>

      {/* Corpo: form (esq.) + mapa/atendimento (dir.). */}
      <section className="lei-fc-body">
        <div className="lei-fc-inner">
          <div className="lei-fc-form">
            <ContatoForm setores={setores} />
          </div>

          {temContato && (
            <aside className="lei-fc-side">
              {/* Mapa só quando há endereço real (não em modo exemplo). */}
              {end && end.query && (
                <div className="lei-fc-mapa">
                  <iframe
                    title="Mapa de localização"
                    width="100%"
                    height="400"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    allowFullScreen
                    src={`https://www.google.com/maps?q=${end.query}&output=embed`}
                  />
                </div>
              )}

              <h3 className="lei-fc-side__h">Atendimento</h3>

              <ul className="lei-fc-contato">
                {whats && (
                  <li>
                    <a href={`https://wa.me/${whats.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer">
                      <span className="lei-fc-contato__ico">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7 .9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z" /></svg>
                      </span>
                      <span className="lei-fc-contato__txt">{fmtWhats(whats)}</span>
                    </a>
                  </li>
                )}
                {tel && (
                  <li>
                    <a href={`tel:+55${tel.replace(/\D/g, '')}`}>
                      <span className="lei-fc-contato__ico">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M164.9 24.6c-7.7-18.6-28-28.5-47.4-23.2l-88 24C12.1 30.2 0 46 0 64C0 311.4 200.6 512 448 512c18 0 33.8-12.1 38.6-29.5l24-88c5.3-19.4-4.6-39.7-23.2-47.4l-96-40c-16.3-6.8-35.2-2.1-46.3 11.6L304.7 368C234.3 334.7 177.3 277.7 144 207.3L193.3 167c13.7-11.2 18.4-30 11.6-46.3l-40-96z" /></svg>
                      </span>
                      <span className="lei-fc-contato__txt">{tel}</span>
                    </a>
                  </li>
                )}

                {(whats || tel) && email && <li className="lei-fc-contato__sep" />}

                {email && (
                  <li>
                    <a href={`mailto:${email}`}>
                      <span className="lei-fc-contato__ico">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M48 64C21.5 64 0 85.5 0 112c0 15.1 7.1 29.3 19.2 38.4L236.8 313.6c11.4 8.5 27 8.5 38.4 0L492.8 150.4c12.1-9.1 19.2-23.3 19.2-38.4c0-26.5-21.5-48-48-48L48 64zM0 176L0 384c0 35.3 28.7 64 64 64l384 0c35.3 0 64-28.7 64-64l0-208L294.4 339.2c-22.8 17.1-54 17.1-76.8 0L0 176z" /></svg>
                      </span>
                      <span className="lei-fc-contato__txt">{email}</span>
                    </a>
                  </li>
                )}

                {end && (whats || tel || email) && <li className="lei-fc-contato__sep" />}

                {end && (
                  <li>
                    {end.query ? (
                      <a href={`https://www.google.com/maps/search/?api=1&query=${end.query}`} target="_blank" rel="noopener noreferrer" title="Ver no Google Maps">
                        <span className="lei-fc-contato__ico">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><path d="M215.7 499.2C267 435 384 279.4 384 192C384 86 298 0 192 0S0 86 0 192c0 87.4 117 243 168.3 307.2c12.3 15.3 35.1 15.3 47.4 0zM192 128a64 64 0 1 1 0 128 64 64 0 1 1 0-128z" /></svg>
                        </span>
                        <span className="lei-fc-contato__txt lei-fc-contato__txt--addr">
                          {end.linha}{end.cep && <><br />CEP {end.cep}</>}
                        </span>
                      </a>
                    ) : (
                      <div>
                        <span className="lei-fc-contato__ico">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><path d="M215.7 499.2C267 435 384 279.4 384 192C384 86 298 0 192 0S0 86 0 192c0 87.4 117 243 168.3 307.2c12.3 15.3 35.1 15.3 47.4 0zM192 128a64 64 0 1 1 0 128 64 64 0 1 1 0-128z" /></svg>
                        </span>
                        <span className="lei-fc-contato__txt lei-fc-contato__txt--addr">
                          {end.linha}{end.cep && <><br />CEP {end.cep}</>}
                        </span>
                      </div>
                    )}
                  </li>
                )}
              </ul>
            </aside>
          )}
        </div>
      </section>
    </>
  );
}
