'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function LoginForm() {
  const router = useRouter();
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErro(''); setLoading(true);
    try {
      const r = await fetch('/api/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user, pass }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) { setErro(d?.message || 'Não foi possível entrar.'); return; }
      router.push('/conta');
      router.refresh();
    } catch { setErro('Erro de rede.'); }
    finally { setLoading(false); }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div>
        <label className="label">E-mail ou usuário</label>
        <input className="input" value={user} onChange={(e) => setUser(e.target.value)} autoComplete="username" />
      </div>
      <div>
        <label className="label">Senha</label>
        <input type="password" className="input" value={pass} onChange={(e) => setPass(e.target.value)} autoComplete="current-password" />
      </div>
      {erro && <p className="rounded bg-red-50 p-2 text-sm text-red-700">{erro}</p>}
      <button type="submit" className="btn-primary w-full" disabled={loading}>{loading ? 'Entrando…' : 'Entrar'}</button>
    </form>
  );
}
