import Link from 'next/link';
import { redirect } from 'next/navigation';
import CadastroForm from '@/components/CadastroForm';
import { getSessionUser } from '@/lib/auth';
import { API_BASE, TENANT, TENANT_HEADER } from '@/lib/config';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Criar minha conta', description: 'Cadastre-se gratuitamente para participar dos leilões.', alternates: { canonical: '/cadastro' } };

// Lê flags de cadastro (versão, PJ/estrangeiro) do endpoint público V1.
async function getVersaoCadastro() {
  try {
    const r = await fetch(`${API_BASE}/api/public/arrematantes/versaoCadastro`, {
      headers: { [TENANT_HEADER]: TENANT, Accept: 'application/json' }, cache: 'no-store',
    });
    if (!r.ok) return null;
    return await r.json();
  } catch { return null; }
}

const HOWTO = [
  { n: '1', t: 'Cadastro.', d: 'Preencha seus dados e crie a senha.' },
  { n: '2', t: 'Documentos.', d: 'Envie documento com foto e comprovante de endereço.' },
  { n: '3', t: 'Habilitação.', d: 'A análise leva até 1 dia útil por leilão.' },
];

export default async function CadastroPage() {
  const user = await getSessionUser().catch(() => null);
  if (user) redirect('/conta');
  const versao = await getVersaoCadastro();

  return (
    <main className="lei-cad">
      <div className="lei-cad__crumb"><Link href="/">Início</Link> › Cadastro</div>

      <div className="lei-cad__head">
        <h1 className="lei-cad__title">Criar minha conta</h1>
        <p className="lei-cad__lead">O cadastro é gratuito. Depois de criar a conta, você solicita a habilitação em cada leilão que quiser participar.</p>
      </div>

      {/* passos */}
      <div className="lei-cad__steps">
        <span className="lei-cad__step is-active"><i>1</i>Seus dados</span>
        <span className="lei-cad__sep" />
        <span className="lei-cad__step"><i>2</i>Documentos</span>
        <span className="lei-cad__sep" />
        <span className="lei-cad__step"><i>3</i>Habilitação</span>
      </div>

      <div className="lei-cad__grid">
        <div className="lei-cad__card">
          <CadastroForm versao={versao} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="lei-cad__aside-card">
            <div className="lei-cad__aside-title">Como funciona</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
              {HOWTO.map((s) => (
                <div key={s.n} className="lei-cad__howto">
                  <i>{s.n}</i>
                  <span><b>{s.t}</b> {s.d}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="lei-cad__note">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--brand-accent-ink)" strokeWidth="2" style={{ flex: 'none', marginTop: 2 }}><circle cx="12" cy="12" r="9" /><path d="M12 16v-4M12 8h.01" /></svg>
            <span>O cadastro não habilita automaticamente. É preciso solicitar habilitação em cada leilão, respeitando o prazo do edital.</span>
          </div>
        </div>
      </div>

      {/* Seção informativa — o que é o cadastro, dados e documentos */}
      <section className="mt-8 rounded-2xl border border-gray-200 bg-white p-6 sm:p-8">
        <h2 className="text-xl font-bold text-gray-800">Cadastro</h2>
        <p className="mt-2 text-sm leading-relaxed text-gray-600">
          Para participar dos nossos leilões, realize o seu cadastro. O processo é rápido, gratuito e seus dados são tratados com segurança e confidencialidade, em conformidade com a Lei Geral de Proteção de Dados (LGPD).
        </p>

        <h3 className="mt-6 text-sm font-bold uppercase tracking-wide text-gray-700">Dados solicitados</h3>
        <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-gray-600">
          <li><b>Pessoa Física:</b> nome completo, CPF, RG, data de nascimento, endereço completo, telefone e e-mail.</li>
          <li><b>Pessoa Jurídica:</b> razão social, CNPJ, endereço completo, dados do representante legal, telefone e e-mail.</li>
        </ul>

        <h3 className="mt-6 text-sm font-bold uppercase tracking-wide text-gray-700">Documentos para habilitação</h3>
        <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-gray-600">
          <li><b>Pessoa Física:</b> documento de identidade com foto, CPF e comprovante de endereço.</li>
          <li><b>Pessoa Jurídica:</b> contrato social ou cartão CNPJ e documentos do representante legal.</li>
        </ul>

        <p className="mt-6 border-t border-gray-100 pt-4 text-sm leading-relaxed text-gray-500">
          Ao concluir o cadastro, o participante declara ter lido e estar de acordo com os editais, as condições de venda e os termos de uso da plataforma.
        </p>
      </section>
    </main>
  );
}
