'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface VersaoCadastro { versao?: number; permitirEstrangeiros?: boolean; bloquearCadPj?: boolean }

// Cadastro completo de arrematante → POST /api/auth/cadastro (BFF) →
// POST /api/public/arrematantes/cadastro (V1). Sucesso devolve JWT e já loga.
export default function CadastroForm({ versao }: { versao: VersaoCadastro | null }) {
  const router = useRouter();
  // A API devolve flags como STRING ("0"/"1"). `!"0"` é false em JS — trate explicitamente.
  const podePj = !(versao?.bloquearCadPj === true || String(versao?.bloquearCadPj) === '1');
  const [tipo, setTipo] = useState<1 | 2>(1); // 1=PF, 2=PJ
  const [f, setF] = useState({
    name: '', document: '', email: '', telefone: '', birthDate: '', gender: '', apelido: '', password: '', password2: '',
    cep: '', address: '', number: '', district: '', city: '', state: '',
  });
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const set = (k: string, v: string) => setF((s) => ({ ...s, [k]: v }));
  const soDig = (v: string) => v.replace(/\D/g, '');

  function primeiraMsg(m: unknown): string {
    if (typeof m === 'string') return m;
    if (Array.isArray(m)) return m.length ? primeiraMsg(m[0]) : '';
    if (m && typeof m === 'object') {
      for (const v of Object.values(m as Record<string, unknown>)) { const s = primeiraMsg(v); if (s) return s; }
    }
    return '';
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    if (f.password.length < 6) { setErro('A senha deve ter ao menos 6 caracteres.'); return; }
    if (f.password !== f.password2) { setErro('As senhas não conferem.'); return; }
    setEnviando(true);

    const payload = {
      apelido: f.apelido || 'auto',
      password: f.password,
      newsletter: true,
      pessoa: {
        name: f.name,
        type: tipo,
        document: soDig(f.document),
        birthDate: tipo === 1 && f.birthDate ? f.birthDate : undefined,
        gender: tipo === 1 && f.gender ? Number(f.gender) : undefined,
        nationality: 'BR',
        emails: [{ email: f.email, default: true, active: true }],
        phoneNumbers: f.telefone ? [{
          areaCode: Number(soDig(f.telefone).slice(0, 2)) || undefined,
          phoneNumber: soDig(f.telefone).slice(2) || undefined,
          cellphone: true, default: true, active: true,
        }] : [],
        addresses: (f.cep || f.address) ? [{
          zip: soDig(f.cep) || undefined, address: f.address || undefined, number: f.number || undefined,
          district: f.district || undefined, city: f.city || undefined, state: f.state || undefined,
          default: true, active: true,
        }] : [],
      },
    };

    try {
      const r = await fetch('/api/auth/cadastro', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) { setErro(primeiraMsg(d?.message) || 'Não foi possível concluir o cadastro.'); return; }
      router.push('/conta');
      router.refresh();
    } catch {
      setErro('Erro de rede. Tente novamente.');
    } finally {
      setEnviando(false);
    }
  }

  const req = <span className="lei-req">*</span>;

  return (
    <form onSubmit={enviar}>
      {/* tipo de pessoa */}
      <div className="lei-cad-tabs">
        <button type="button" onClick={() => setTipo(1)} className={`lei-cad-tab${tipo === 1 ? ' is-active' : ''}`}>Pessoa Física</button>
        {podePj && <button type="button" onClick={() => setTipo(2)} className={`lei-cad-tab${tipo === 2 ? ' is-active' : ''}`}>Pessoa Jurídica</button>}
      </div>

      {/* dados */}
      <div className="lei-cad-flds">
        <div className="lei-field" style={{ gridColumn: '1/-1' }}>
          <label>{tipo === 1 ? 'Nome completo' : 'Razão social'} {req}</label>
          <input value={f.name} onChange={(e) => set('name', e.target.value)} required />
        </div>
        <div className="lei-field">
          <label>{tipo === 1 ? 'CPF' : 'CNPJ'} {req}</label>
          <input value={f.document} onChange={(e) => set('document', e.target.value)} inputMode="numeric" placeholder={tipo === 1 ? '000.000.000-00' : '00.000.000/0000-00'} required />
        </div>
        {tipo === 1 && (
          <div className="lei-field">
            <label>Data de nascimento</label>
            <input type="date" value={f.birthDate} onChange={(e) => set('birthDate', e.target.value)} />
          </div>
        )}
        {tipo === 1 && (
          <div className="lei-field">
            <label>Gênero {req}</label>
            <select value={f.gender} onChange={(e) => set('gender', e.target.value)} required>
              <option value="">Selecione</option><option value="1">Masculino</option><option value="2">Feminino</option>
            </select>
          </div>
        )}
        <div className="lei-field">
          <label>E-mail {req}</label>
          <input type="email" value={f.email} onChange={(e) => set('email', e.target.value)} required />
        </div>
        <div className="lei-field">
          <label>Telefone / WhatsApp</label>
          <input value={f.telefone} onChange={(e) => set('telefone', e.target.value)} placeholder="(11) 99999-0000" />
        </div>
      </div>

      {/* endereço */}
      <div className="lei-cad-lbl" style={{ marginTop: 24 }}>Endereço</div>
      <div className="lei-cad-flds">
        <div className="lei-field"><label>CEP</label><input value={f.cep} onChange={(e) => set('cep', e.target.value)} inputMode="numeric" placeholder="00000-000" /></div>
        <div className="lei-field" style={{ gridColumn: 'span 2' }}><label>Logradouro</label><input value={f.address} onChange={(e) => set('address', e.target.value)} /></div>
        <div className="lei-field"><label>Número</label><input value={f.number} onChange={(e) => set('number', e.target.value)} /></div>
        <div className="lei-field"><label>Bairro</label><input value={f.district} onChange={(e) => set('district', e.target.value)} /></div>
        <div className="lei-field"><label>Cidade</label><input value={f.city} onChange={(e) => set('city', e.target.value)} /></div>
        <div className="lei-field"><label>UF</label><input maxLength={2} value={f.state} onChange={(e) => set('state', e.target.value.toUpperCase())} /></div>
      </div>

      <div className="lei-cad-divider" />
      <div className="lei-cad-lbl">Acesso</div>
      <div className="lei-cad-flds">
        <div className="lei-field"><label>Apelido (opcional)</label><input value={f.apelido} onChange={(e) => set('apelido', e.target.value)} placeholder="gerado automaticamente" /></div>
        <div className="lei-field"><label>Senha {req}</label><input type="password" value={f.password} onChange={(e) => set('password', e.target.value)} placeholder="Mínimo de 8 caracteres" required /></div>
        <div className="lei-field"><label>Confirmar senha {req}</label><input type="password" value={f.password2} onChange={(e) => set('password2', e.target.value)} placeholder="Repita a senha" required /></div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 24 }}>
        <label className="lei-check" style={{ alignItems: 'flex-start', lineHeight: 1.6 }}>
          <input type="checkbox" required style={{ marginTop: 2 }} />
          <span>Li e aceito os <a href="/termos" style={{ fontWeight: 700, color: 'var(--brand-accent-ink)' }}>termos de uso</a> e a <a href="/privacidade" style={{ fontWeight: 700, color: 'var(--brand-accent-ink)' }}>política de privacidade</a>.</span>
        </label>
        <label className="lei-check" style={{ alignItems: 'flex-start', lineHeight: 1.6 }}>
          <input type="checkbox" defaultChecked style={{ marginTop: 2 }} />
          <span>Quero receber avisos de novos leilões por e-mail e WhatsApp.</span>
        </label>
      </div>

      {erro && <p className="lei-auth__err">{erro}</p>}
      <button type="submit" className="lei-auth__submit" disabled={enviando}>{enviando ? 'Enviando…' : 'Criar conta'}</button>
      <div style={{ textAlign: 'center', marginTop: 15, fontSize: 13.5, color: '#5a6270' }}>
        Já tem conta? <a href="/login" style={{ fontWeight: 700, color: 'var(--brand-accent-ink)' }}>Entrar</a>
      </div>
    </form>
  );
}
