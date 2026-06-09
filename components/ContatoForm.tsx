'use client';
import { useState } from 'react';
import type { ContatoSetores } from '@/lib/api';

// Formulário de contato → POST /api/website/v2/contato (via proxy BFF p/ não vazar header).
// Honeypot oculto anti-bot. Selects de assunto/departamento vindos de /contato/setores.
export default function ContatoForm({ setores }: { setores: ContatoSetores | null }) {
  const [form, setForm] = useState({ nome: '', email: '', telefone: '', assunto: '', departamento: '', mensagem: '', newsletter: false, website: '' });
  const [enviando, setEnviando] = useState(false);
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'erro'; texto: string; campo?: string } | null>(null);

  const set = (k: string, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setEnviando(true);
    try {
      const payload: Record<string, unknown> = {
        nome: form.nome, email: form.email, telefone: form.telefone || undefined,
        mensagem: form.mensagem, newsletter: form.newsletter || undefined,
        assunto: form.assunto ? Number(form.assunto) : undefined,
        departamento: form.departamento ? Number(form.departamento) : undefined,
        honeypot: form.website || undefined, // honeypot: campo "website" escondido
      };
      const r = await fetch('/api/proxy/website/v2/contato', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) {
        setMsg({ tipo: 'erro', texto: d?.message || 'Não foi possível enviar.', campo: d?.extra?.field });
      } else {
        setMsg({ tipo: 'ok', texto: d?.message || 'Mensagem enviada! Retornaremos em breve.' });
        setForm({ nome: '', email: '', telefone: '', assunto: '', departamento: '', mensagem: '', newsletter: false, website: '' });
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
          <label className="label">Telefone</label>
          <input className="input" value={form.telefone} onChange={(e) => set('telefone', e.target.value)} placeholder="(11) 99999-0000" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="label">Assunto</label>
            <select className="input" value={form.assunto} onChange={(e) => set('assunto', e.target.value)}>
              <option value="">—</option>
              {setores?.assuntos.map((a) => <option key={a.id} value={a.id}>{a.nome}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Departamento</label>
            <select className="input" value={form.departamento} onChange={(e) => set('departamento', e.target.value)}>
              <option value="">—</option>
              {setores?.departamentos.map((d) => <option key={d.id} value={d.id}>{d.nome}</option>)}
            </select>
          </div>
        </div>
      </div>
      <div>
        <label className="label">Mensagem *</label>
        <textarea className={`input ${erroNo('mensagem') ? 'border-red-400' : ''}`} rows={5} value={form.mensagem} onChange={(e) => set('mensagem', e.target.value)} required />
      </div>
      <label className="flex items-center gap-2 text-sm text-gray-600">
        <input type="checkbox" checked={form.newsletter} onChange={(e) => set('newsletter', e.target.checked)} />
        Quero receber novidades e leilões por e-mail
      </label>
      {/* honeypot — escondido de humanos, bots preenchem */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" value={form.website} onChange={(e) => set('website', e.target.value)}
        className="absolute left-[-9999px] h-0 w-0 opacity-0" aria-hidden="true" />

      <div className="flex items-center gap-3">
        <button type="submit" className="btn-primary" disabled={enviando}>{enviando ? 'Enviando…' : 'Enviar mensagem'}</button>
        {msg && <span className={`text-sm ${msg.tipo === 'ok' ? 'text-green-700' : 'text-red-600'}`}>{msg.texto}</span>}
      </div>
    </form>
  );
}
