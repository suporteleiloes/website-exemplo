'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

// Esconde o "chrome" do site (header/footer/floats) nas telas de autenticação
// (/login) — a página de login é full-screen e não deve mostrar a navegação.
export default function AuthRouteGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (pathname?.startsWith('/login')) return null;
  return <>{children}</>;
}
