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
  const semAssuntos = !setores?.assuntos?.length;
  const semDepartamentos = !setores?.departamentos?.length;

  return (
    <form onSubmit={enviar} className="lei-fc-formEl">
      <p className="lei-fc-formEl__lead">Preencha os campos abaixo corretamente:</p>

      <div className="lei-fc-field">
        <label htmlFor="fc-nome">Nome Completo<sup>*</sup></label>
        <input id="fc-nome" type="text" className={erroNo('nome') ? 'is-error' : ''} value={form.nome} onChange={(e) => set('nome', e.target.value)} required />
      </div>

      <div className="lei-fc-group">
        <div className="lei-fc-field">
          <label htmlFor="fc-email">E-mail<sup>*</sup></label>
          <input id="fc-email" type="email" className={erroNo('email') ? 'is-error' : ''} value={form.email} onChange={(e) => set('email', e.target.value)} required />
        </div>
        <div className="lei-fc-field">
          <label htmlFor="fc-tel">Telefone</label>
          <input id="fc-tel" type="text" placeholder="(DDD) + Telefone" value={form.telefone} onChange={(e) => set('telefone', e.target.value)} />
        </div>
      </div>

      <div className="lei-fc-group">
        <div className="lei-fc-field">
          <label htmlFor="fc-assunto">Assunto</label>
          <select id="fc-assunto" value={form.assunto} onChange={(e) => set('assunto', e.target.value)}>
            {semAssuntos ? (
              <option value="">Geral</option>
            ) : (
              <>
                <option value="">Selecione</option>
                {setores!.assuntos.map((a) => <option key={a.id} value={a.id}>{a.nome}</option>)}
              </>
            )}
          </select>
        </div>
        <div className="lei-fc-field">
          <label htmlFor="fc-dep">Departamento</label>
          <select id="fc-dep" value={form.departamento} onChange={(e) => set('departamento', e.target.value)}>
            {semDepartamentos ? (
              <option value="">Atendimento</option>
            ) : (
              <>
                <option value="">Selecione</option>
                {setores!.departamentos.map((d) => <option key={d.id} value={d.id}>{d.nome}</option>)}
              </>
            )}
          </select>
        </div>
      </div>

      <div className="lei-fc-field">
        <label htmlFor="fc-msg">Mensagem</label>
        <textarea id="fc-msg" rows={7} className={erroNo('mensagem') ? 'is-error' : ''} value={form.mensagem} onChange={(e) => set('mensagem', e.target.value)} required />
      </div>

      <div className="lei-fc-check">
        <label>
          <input type="checkbox" checked={form.newsletter} onChange={(e) => set('newsletter', e.target.checked)} />
          <span>Deseja receber nossas principais oportunidades por e-mail?</span>
        </label>
      </div>

      {/* honeypot — escondido de humanos, bots preenchem */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" value={form.website} onChange={(e) => set('website', e.target.value)}
        aria-hidden="true" style={{ position: 'absolute', left: '-9999px', height: 0, width: 0, opacity: 0 }} />

      {msg && <p className={`lei-fc-alert ${msg.tipo === 'ok' ? 'is-ok' : 'is-erro'}`}>{msg.texto}</p>}

      <button type="submit" className="lei-fc-submit" disabled={enviando}>{enviando ? 'Enviando…' : 'Enviar Mensagem'}</button>
    </form>
  );
}
