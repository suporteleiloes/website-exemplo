'use client';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

// Recuperação de senha do arrematante. Dois modos, decididos pela querystring:
//  - sem ?token  → formulário "Esqueci minha senha" (pede e-mail/usuário → envia e-mail).
//  - com ?token  → formulário "Definir nova senha" (token vem do link do e-mail).
export default function RecuperarSenhaForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = (params.get('token') || '').trim();
  const modoDefinir = token !== '';

  const [login, setLogin] = useState('');
  const [senha, setSenha] = useState('');
  const [senha2, setSenha2] = useState('');
  const [verSenha, setVerSenha] = useState(false);
  const [erro, setErro] = useState('');
  const [okMsg, setOkMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [concluido, setConcluido] = useState(false);

  async function pedirReset(e: React.FormEvent) {
    e.preventDefault();
    setErro(''); setOkMsg(''); setLoading(true);
    try {
      const r = await fetch('/api/auth/recuperar-senha', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) { setErro(d?.message || 'Não foi possível enviar o e-mail.'); return; }
      setOkMsg(d?.message || 'Se houver uma conta com este login, enviaremos as instruções por e-mail.');
      setConcluido(true);
    } catch { setErro('Erro de rede. Tente novamente.'); }
    finally { setLoading(false); }
  }

  async function definirSenha(e: React.FormEvent) {
    e.preventDefault();
    setErro(''); setOkMsg('');
    if (senha.length < 6) { setErro('A nova senha deve ter ao menos 6 caracteres.'); return; }
    if (senha !== senha2) { setErro('As senhas não conferem.'); return; }
    setLoading(true);
    try {
      const r = await fetch('/api/auth/recuperar-senha', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password: senha }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) { setErro(d?.message || 'Não foi possível definir a senha.'); return; }
      setOkMsg('Senha redefinida com sucesso! Você já pode entrar com a nova senha.');
      setConcluido(true);
      setTimeout(() => { router.push('/login'); }, 2200);
    } catch { setErro('Erro de rede. Tente novamente.'); }
    finally { setLoading(false); }
  }

  // ── Mensagem de conclusão ───────────────────────────────────────────────
  if (concluido) {
    return (
      <div className="lei-signin__form">
        <h2 className="lei-signin__title">{modoDefinir ? 'Senha redefinida' : 'Verifique seu e-mail'}</h2>
        <div className="lei-signin__msg lei-signin__msg--ok">{okMsg}</div>
        {!modoDefinir && (
          <p className="lei-signin__desc">Não recebeu? Confira a caixa de spam ou tente novamente em alguns minutos.</p>
        )}
        <p className="lei-signin__alt"><Link href="/login">Voltar para o login</Link></p>
      </div>
    );
  }

  // ── Modo: definir nova senha (veio do link do e-mail) ────────────────────
  if (modoDefinir) {
    return (
      <form className="lei-signin__form" onSubmit={definirSenha}>
        <h2 className="lei-signin__title">Definir nova senha</h2>
        <p className="lei-signin__desc">Escolha uma nova senha para a sua conta.</p>

        <div className="lei-signin__field">
          <label className="lei-signin__lbl" htmlFor="rs-pass">Nova senha</label>
          <div className="lei-signin__inwrap">
            <span className="lei-signin__inico">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="10" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
            </span>
            <input id="rs-pass" className="lei-signin__input" type={verSenha ? 'text' : 'password'} autoComplete="new-password" placeholder="Mínimo de 6 caracteres" value={senha} onChange={(e) => setSenha(e.target.value)} required />
            <button type="button" className="lei-signin__toggle" aria-label={verSenha ? 'Ocultar senha' : 'Mostrar senha'} onClick={() => setVerSenha((v) => !v)}>
              {verSenha ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 10 8 10 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><path d="M1 1l22 22" /><path d="M6.61 6.61A13.5 13.5 0 0 0 2 12s3 8 10 8a9.7 9.7 0 0 0 5.39-1.61" /></svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-8 10-8 10 8 10 8-3 8-10 8-10-8-10-8z" /><circle cx="12" cy="12" r="3" /></svg>
              )}
            </button>
          </div>
        </div>

        <div className="lei-signin__field">
          <label className="lei-signin__lbl" htmlFor="rs-pass2">Confirmar nova senha</label>
          <div className="lei-signin__inwrap">
            <span className="lei-signin__inico">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="10" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
            </span>
            <input id="rs-pass2" className="lei-signin__input" type={verSenha ? 'text' : 'password'} autoComplete="new-password" placeholder="Repita a nova senha" value={senha2} onChange={(e) => setSenha2(e.target.value)} required />
          </div>
        </div>

        {erro && <div className="lei-signin__msg lei-signin__msg--erro">{erro}</div>}

        <button type="submit" className="lei-signin__submit" disabled={loading}>
          {loading ? 'Salvando…' : 'Salvar nova senha'}
        </button>

        <p className="lei-signin__alt"><Link href="/login">Voltar para o login</Link></p>
      </form>
    );
  }

  // ── Modo: pedir recuperação (padrão) ─────────────────────────────────────
  return (
    <form className="lei-signin__form" onSubmit={pedirReset}>
      <h2 className="lei-signin__title">Recuperar senha</h2>
      <p className="lei-signin__desc">Informe o e-mail ou usuário da sua conta. Enviaremos um link para você criar uma nova senha.</p>

      <div className="lei-signin__field">
        <label className="lei-signin__lbl" htmlFor="rs-login">E-mail ou usuário</label>
        <div className="lei-signin__inwrap">
          <span className="lei-signin__inico">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>
          </span>
          <input id="rs-login" className="lei-signin__input" type="text" autoComplete="username" placeholder="seu@email.com" value={login} onChange={(e) => setLogin(e.target.value)} required />
        </div>
      </div>

      {erro && <div className="lei-signin__msg lei-signin__msg--erro">{erro}</div>}

      <button type="submit" className="lei-signin__submit" disabled={loading}>
        {loading ? 'Enviando…' : 'Enviar link de recuperação'}
        {!loading && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>}
      </button>

      <p className="lei-signin__alt">Lembrou a senha? <Link href="/login">Voltar para o login</Link></p>
    </form>
  );
}
