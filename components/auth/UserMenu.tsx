'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

// "Olá, {nome}!" no header → dropdown com Meu perfil + Sair (fecha ao clicar fora / Esc).
export default function UserMenu({ nome }: { nome: string }) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [saindo, setSaindo] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!aberto) return;
    const clique = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setAberto(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setAberto(false); };
    document.addEventListener('mousedown', clique);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', clique); document.removeEventListener('keydown', esc); };
  }, [aberto]);

  async function sair() {
    if (saindo) return;
    setSaindo(true);
    try { await fetch('/api/auth/logout', { method: 'POST' }); } catch { /* segue mesmo se falhar */ }
    setAberto(false);
    router.push('/');
    router.refresh();
  }

  return (
    <div className="lei-usermenu" ref={ref}>
      <button type="button" className="lei-usermenu__name" aria-haspopup="menu" aria-expanded={aberto} onClick={() => setAberto((v) => !v)}>
        <span>Olá, {nome}!</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ transform: aberto ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }}><polyline points="6 9 12 15 18 9" /></svg>
      </button>

      <div className={`lei-usermenu__drop${aberto ? ' is-open' : ''}`} role="menu">
        <Link href="/conta" role="menuitem" onClick={() => setAberto(false)}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
          Meu perfil
        </Link>
        <a className="lei-usermenu__logout" role="menuitem" tabIndex={0} onClick={sair} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') sair(); }} style={{ cursor: 'pointer' }}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
          {saindo ? 'Saindo…' : 'Sair'}
        </a>
      </div>
    </div>
  );
}
