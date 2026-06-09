import Link from 'next/link';
import { redirect } from 'next/navigation';
import CadastroForm from '@/components/CadastroForm';
import { getSessionUser } from '@/lib/auth';
import { API_BASE, TENANT, TENANT_HEADER } from '@/lib/config';

export const dynamic = 'force-dynamic';

// Lê flags de cadastro (versão, PJ/estrangeiro) do endpoint público V1.
async function getVersaoCadastro() {
  try {
    const r = await fetch(`${API_BASE}/api/public/arrematantes/versaoCadastro`, {
      headers: { [TENANT_HEADER]: TENANT, Accept: 'application/json' }, cache: 'no-store',
    });
    if (!r.ok) return null;
    return await r.json();
  } catch { return null; }
}

export default async function CadastroPage() {
  const user = await getSessionUser().catch(() => null);
  if (user) redirect('/conta');
  const versao = await getVersaoCadastro();

  return (
    <div className="container-page max-w-3xl">
      <div className="rounded-lg border border-gray-200 bg-white p-6 sm:p-8">
        <h1 className="text-2xl font-bold text-gray-800">Criar conta</h1>
        <p className="mt-1 text-sm text-gray-500">Cadastre-se para participar dos leilões e da venda direta.</p>
        <div className="mt-6"><CadastroForm versao={versao} /></div>
        <p className="mt-6 text-center text-sm text-gray-500">
          Já tem conta? <Link href="/login" className="font-medium text-marca">Entrar</Link>
        </p>
      </div>
    </div>
  );
}
