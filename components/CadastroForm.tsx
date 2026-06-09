'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface VersaoCadastro { versao?: number; permitirEstrangeiros?: boolean; bloquearCadPj?: boolean }

// Cadastro completo de arrematante → POST /api/auth/cadastro (BFF) →
// POST /api/public/arrematantes/cadastro (V1). Sucesso devolve JWT e já loga.
export default function CadastroForm({ versao }: { versao: VersaoCadastro | null }) {
  const router = useRouter();
  const podePj = !versao?.bloquearCadPj;
  const [tipo, setTipo] = useState<1 | 2>(1); // 1=PF, 2=PJ
  const [f, setF] = useState({
    name: '', document: '', email: '', telefone: '', birthDate: '', gender: '', apelido: '', password: '', password2: '',
    cep: '', address: '', number: '', district: '', city: '', state: '',
  });
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const set = (k: string, v: string) => setF((s) => ({ ...s, [k]: v }));
  const soDig = (v: string) => v.replace(/\D/g, '');

  // A API V1 pode devolver message como string OU objeto aninhado de erros de form
  // (ex.: { pessoa: { gender: ["Informe gênero"] } }). Extrai a 1ª string legível.
  function primeiraMsg(m: unknown): string {
    if (typeof m === 'string') return m;
    if (Array.isArray(m)) return m.length ? primeiraMsg(m[0]) : '';
    if (m && typeof m === 'object') {
      for (const v of Object.values(m as Record<string, unknown>)) {
        const s = primeiraMsg(v);
        if (s) return s;
      }
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

  return (
    <form onSubmit={enviar} className="space-y-5">
      {/* Tipo */}
      <div className="flex gap-2 rounded-lg bg-gray-100 p-1 text-sm">
        <button type="button" onClick={() => setTipo(1)} className={`flex-1 rounded-md px-3 py-1.5 font-medium ${tipo === 1 ? 'bg-white text-marca shadow-sm' : 'text-gray-500'}`}>Pessoa Física</button>
        {podePj && <button type="button" onClick={() => setTipo(2)} className={`flex-1 rounded-md px-3 py-1.5 font-medium ${tipo === 2 ? 'bg-white text-marca shadow-sm' : 'text-gray-500'}`}>Pessoa Jurídica</button>}
      </div>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-700">Dados {tipo === 1 ? 'pessoais' : 'da empresa'}</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label">{tipo === 1 ? 'Nome completo' : 'Razão social'} *</label>
            <input className="input" value={f.name} onChange={(e) => set('name', e.target.value)} required />
          </div>
          <div>
            <label className="label">{tipo === 1 ? 'CPF' : 'CNPJ'} *</label>
            <input className="input" value={f.document} onChange={(e) => set('document', e.target.value)} inputMode="numeric" required />
          </div>
          {tipo === 1 && (
            <div>
              <label className="label">Data de nascimento</label>
              <input type="date" className="input" value={f.birthDate} onChange={(e) => set('birthDate', e.target.value)} />
            </div>
          )}
          {tipo === 1 && (
            <div>
              <label className="label">Gênero *</label>
              <select className="input" value={f.gender} onChange={(e) => set('gender', e.target.value)} required>
                <option value="">Selecione</option>
                <option value="1">Masculino</option>
                <option value="2">Feminino</option>
              </select>
            </div>
          )}
          <div>
            <label className="label">E-mail *</label>
            <input type="email" className="input" value={f.email} onChange={(e) => set('email', e.target.value)} required />
          </div>
          <div>
            <label className="label">Telefone / WhatsApp</label>
            <input className="input" value={f.telefone} onChange={(e) => set('telefone', e.target.value)} placeholder="(11) 99999-0000" />
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-700">Endereço</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-6">
          <div className="sm:col-span-2"><label className="label">CEP</label><input className="input" value={f.cep} onChange={(e) => set('cep', e.target.value)} inputMode="numeric" /></div>
          <div className="sm:col-span-4"><label className="label">Logradouro</label><input className="input" value={f.address} onChange={(e) => set('address', e.target.value)} /></div>
          <div className="sm:col-span-1"><label className="label">Número</label><input className="input" value={f.number} onChange={(e) => set('number', e.target.value)} /></div>
          <div className="sm:col-span-2"><label className="label">Bairro</label><input className="input" value={f.district} onChange={(e) => set('district', e.target.value)} /></div>
          <div className="sm:col-span-2"><label className="label">Cidade</label><input className="input" value={f.city} onChange={(e) => set('city', e.target.value)} /></div>
          <div className="sm:col-span-1"><label className="label">UF</label><input className="input" maxLength={2} value={f.state} onChange={(e) => set('state', e.target.value.toUpperCase())} /></div>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-700">Acesso</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div><label className="label">Apelido (opcional)</label><input className="input" value={f.apelido} onChange={(e) => set('apelido', e.target.value)} placeholder="gerado automaticamente" /></div>
          <div><label className="label">Senha *</label><input type="password" className="input" value={f.password} onChange={(e) => set('password', e.target.value)} required /></div>
          <div><label className="label">Confirmar senha *</label><input type="password" className="input" value={f.password2} onChange={(e) => set('password2', e.target.value)} required /></div>
        </div>
      </section>

      {erro && <p className="rounded bg-red-50 p-3 text-sm text-red-700">{erro}</p>}
      <button type="submit" className="btn-primary w-full" disabled={enviando}>{enviando ? 'Enviando…' : 'Criar conta'}</button>
      <p className="text-center text-xs text-gray-400">Ao se cadastrar você poderá habilitar-se em leilões e participar de venda direta.</p>
    </form>
  );
}
