'use client';
import Link from 'next/link';
import { useState } from 'react';

type NavItem = { href: string; label: string };

// Hambúrguer + drawer lateral (aparece só no mobile via CSS). Fecha ao clicar no fundo,
// num link ou no X. O nav e as ações (Entrar/Cadastre-se ou Minha conta) espelham o header.
export default function MobileMenu({ nav, logado, permitirCadastro }: { nav: NavItem[]; logado: boolean; permitirCadastro: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="lei-header__mobile">
      <button type="button" className="lei-burger" aria-label="Abrir menu" aria-expanded={open} onClick={() => setOpen(true)}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 6h18M3 12h18M3 18h18" /></svg>
      </button>

      {open && (
        <div className="lei-drawer" role="dialog" aria-modal="true">
          <div className="lei-drawer__bg" onClick={() => setOpen(false)} />
          <div className="lei-drawer__panel">
            <button type="button" className="lei-drawer__close" aria-label="Fechar menu" onClick={() => setOpen(false)}>×</button>
            <nav className="lei-drawer__nav" onClick={() => setOpen(false)}>
              {nav.map((n) => <Link key={n.label} href={n.href}>{n.label}</Link>)}
            </nav>
            <div className="lei-drawer__actions" onClick={() => setOpen(false)}>
              {logado ? (
                <Link href="/conta" className="lei-btn lei-btn--primary lei-btn--block">Minha conta</Link>
              ) : permitirCadastro ? (
                <>
                  <Link href="/login" className="lei-btn lei-btn--block lei-drawer__login">Entrar</Link>
                  <Link href="/cadastro" className="lei-btn lei-btn--primary lei-btn--block">Cadastre-se</Link>
                </>
              ) : (
                <Link href="/contato" className="lei-btn lei-btn--primary lei-btn--block">Fale com o leiloeiro</Link>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
