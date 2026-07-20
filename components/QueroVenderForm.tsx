'use client';
import { useState } from 'react';

// Formulário "Quero vender" → POST /api/website/v2/quero-vender (via proxy BFF p/ não vazar header).
// Vira lead no CRM do leiloeiro + Negócio no funil. Honeypot oculto anti-bot.
// Anti-dup: reenvio em até 6h devolve o id já existente — continua sendo sucesso.

const UFS = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];

export default function QueroVenderForm() {
  const [form, setForm] = useState({
    nome: '', email: '', telefone: '', tipoBem: '', descricao: '',
    cidade: '', uf: '', valorEstimado: '', website: '',
  });
  const [enviando, setEnviando] = useState(false);
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'erro'; texto: string; campo?: string } | null>(null);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setEnviando(true);
    try {
      const payload: Record<string, unknown> = {
        nome: form.nome, email: form.email, telefone: form.telefone, descricao: form.descricao,
        tipoBem: form.tipoBem || undefined,
        cidade: form.cidade || undefined,
        uf: form.uf || undefined,
        valorEstimado: form.valorEstimado || undefined,
        origem: 'site:quero-vender',
        honeypot: form.website || undefined, // honeypot: campo "website" escondido
      };
      const r = await fetch('/api/proxy/website/v2/quero-vender', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) {
        setMsg({ tipo: 'erro', texto: d?.message || 'Não foi possível enviar.', campo: d?.extra?.field });
      } else {
        setMsg({ tipo: 'ok', texto: d?.message || 'Solicitação recebida. Entraremos em contato.' });
        setForm({ nome: '', email: '', telefone: '', tipoBem: '', descricao: '', cidade: '', uf: '', valorEstimado: '', website: '' });
      }
    } catch {
      setMsg({ tipo: 'erro', texto: 'Erro de rede. Tente novamente.' });
    } finally {
      setEnviando(false);
    }
  }

  const erroNo = (campo: string) => msg?.tipo === 'erro' && msg.campo === campo;

  return (
    <form onSubmit={enviar} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Nome *</label>
          <input className={`input ${erroNo('nome') ? 'border-red-400' : ''}`} value={form.nome} onChange={(e) => set('nome', e.target.value)} required />
        </div>
        <div>
          <label className="label">E-mail *</label>
          <input type="email" className={`input ${erroNo('email') ? 'border-red-400' : ''}`} value={form.email} onChange={(e) => set('email', e.target.value)} required />
        </div>
        <div>
          <label className="label">Telefone / WhatsApp *</label>
          <input className={`input ${erroNo('telefone') ? 'border-red-400' : ''}`} value={form.telefone} onChange={(e) => set('telefone', e.target.value)} placeholder="(11) 99999-0000" required />
        </div>
        <div>
          <label className="label">Tipo de bem</label>
          <select className="input" value={form.tipoBem} onChange={(e) => set('tipoBem', e.target.value)}>
            <option value="">—</option>
            <option value="Imóvel">Imóvel</option>
            <option value="Veículo">Veículo</option>
            <option value="Outros">Outros</option>
          </select>
        </div>
        <div className="grid grid-cols-[1fr_96px] gap-2">
          <div>
            <label className="label">Cidade</label>
            <input className="input" value={form.cidade} onChange={(e) => set('cidade', e.target.value)} />
          </div>
          <div>
            <label className="label">UF</label>
            <select className="input" value={form.uf} onChange={(e) => set('uf', e.target.value)}>
              <option value="">—</option>
              {UFS.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="label">Valor estimado</label>
          <input className="input" value={form.valorEstimado} onChange={(e) => set('valorEstimado', e.target.value)} placeholder="R$ 150.000,00" />
        </div>
      </div>
      <div>
        <label className="label">Descrição do bem *</label>
        <textarea className={`input ${erroNo('descricao') ? 'border-red-400' : ''}`} rows={5} value={form.descricao}
          onChange={(e) => set('descricao', e.target.value)} required
          placeholder="Conte o que deseja vender: características, estado de conservação, documentação, quantidade…" />
      </div>
      {/* honeypot — escondido de humanos, bots preenchem */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" value={form.website} onChange={(e) => set('website', e.target.value)}
        className="absolute left-[-9999px] h-0 w-0 opacity-0" aria-hidden="true" />

      <div className="flex items-center gap-3">
        <button type="submit" className="btn-primary" disabled={enviando}>{enviando ? 'Enviando…' : 'Quero vender'}</button>
        {msg && <span className={`text-sm ${msg.tipo === 'ok' ? 'text-green-700' : 'text-red-600'}`}>{msg.texto}</span>}
      </div>
      <p className="text-xs text-gray-400">Ao enviar, você concorda em ser contatado por nossa equipe sobre esta solicitação.</p>
    </form>
  );
}
