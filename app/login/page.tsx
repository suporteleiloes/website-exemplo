import Link from 'next/link';
import { redirect } from 'next/navigation';
import LoginForm from '@/components/auth/LoginForm';
import { getSessionUser } from '@/lib/auth';

export default async function LoginPage() {
  const user = await getSessionUser().catch(() => null);
  if (user) redirect('/conta');

  return (
    <div className="container-page max-w-md">
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h1 className="text-xl font-bold text-gray-800">Entrar</h1>
        <p className="mt-1 text-sm text-gray-500">Acesse sua conta de arrematante para habilitar-se e dar lances.</p>
        <div className="mt-4"><LoginForm /></div>
        <p className="mt-4 text-center text-xs text-gray-400">
          Ainda não tem conta? O cadastro é feito pela área do arrematante da plataforma.
          <br /><Link href="/" className="text-marca">Voltar ao início</Link>
        </p>
      </div>
    </div>
  );
}
