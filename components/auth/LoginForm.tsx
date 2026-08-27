'use client';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

// Só caminho interno — evita open redirect (?redirect=https://site-falso.com).
function caminhoInterno(v: string | null, fallback = '/conta'): string {
  const s = (v || '').trim();
  if (!s.startsWith('/') || s.startsWith('//') || s.startsWith('/\\')) return fallback;
  if (/^\/\s*[a-z][a-z0-9+.-]*:/i.test(s)) return fallback;
  return s;
}

export default function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const redirect = caminhoInterno(params.get('redirect'), '/conta');
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [verSenha, setVerSenha] = useState(false);
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
      router.push(redirect);
      router.refresh();
    } catch { setErro('Erro de rede. Tente novamente.'); }
    finally { setLoading(false); }
  }

  return (
    <form className="lei-signin__form" onSubmit={submit}>
      <h2 className="lei-signin__title">Entrar</h2>
      <p className="lei-signin__desc">Acesse sua conta para habilitar-se e dar lances.</p>

      <div className="lei-signin__field">
        <label className="lei-signin__lbl" htmlFor="si-user">E-mail ou usuário</label>
        <div className="lei-signin__inwrap">
          <span className="lei-signin__inico">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>
          </span>
          <input id="si-user" className="lei-signin__input" type="text" autoComplete="username" placeholder="seu@email.com" value={user} onChange={(e) => setUser(e.target.value)} required />
        </div>
      </div>

      <div className="lei-signin__field">
        <label className="lei-signin__lbl" htmlFor="si-pass">Senha <Link href="/recuperar-senha">Esqueci minha senha</Link></label>
        <div className="lei-signin__inwrap">
          <span className="lei-signin__inico">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="10" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
          </span>
          <input id="si-pass" className="lei-signin__input" type={verSenha ? 'text' : 'password'} autoComplete="current-password" placeholder="••••••••" value={pass} onChange={(e) => setPass(e.target.value)} required />
          <button type="button" className="lei-signin__toggle" aria-label={verSenha ? 'Ocultar senha' : 'Mostrar senha'} onClick={() => setVerSenha((v) => !v)}>
            {verSenha ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 10 8 10 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><path d="M1 1l22 22" /><path d="M6.61 6.61A13.5 13.5 0 0 0 2 12s3 8 10 8a9.7 9.7 0 0 0 5.39-1.61" /></svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-8 10-8 10 8 10 8-3 8-10 8-10-8-10-8z" /><circle cx="12" cy="12" r="3" /></svg>
            )}
          </button>
        </div>
      </div>

      <label className="lei-signin__check"><input type="checkbox" defaultChecked /> Manter-me conectado neste dispositivo</label>

      {erro && <div className="lei-signin__msg lei-signin__msg--erro">{erro}</div>}

      <button type="submit" className="lei-signin__submit" disabled={loading}>
        {loading ? 'Entrando…' : 'Entrar'}
        {!loading && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>}
      </button>

      <p className="lei-signin__alt">Ainda não tem conta? Crie a sua para habilitar-se e participar. <Link href="/cadastro">Criar cadastro</Link></p>

      <hr className="lei-signin__hr" />
      <div className="lei-signin__secure">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
        <span>Ambiente protegido. Seus dados são usados apenas para habilitação em leilões.</span>
      </div>
    </form>
  );
}
