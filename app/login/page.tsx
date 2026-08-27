import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import '../signin.css';
import SigninAside from '@/components/auth/SigninAside';
import LoginForm from '@/components/auth/LoginForm';
import { getSessionUser } from '@/lib/auth';
import { getSiteConfig } from '@/lib/api';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Entrar', description: 'Acesse sua conta para dar lances e acompanhar seus leilões.', alternates: { canonical: '/login' }, robots: { index: false, follow: true } };

export default async function LoginPage() {
  const user = await getSessionUser().catch(() => null);
  if (user) redirect('/conta');
  const config = await getSiteConfig().catch(() => null);

  return (
    <div className="lei-signin">
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&family=Karla:wght@400;500;600;700&display=swap" />

      <SigninAside config={config} />

      <main className="lei-signin__main">
        <Suspense fallback={<div className="lei-signin__form" />}>
          <LoginForm />
        </Suspense>
      </main>
    </div>
  );
}
