import { redirect } from 'next/navigation';
import LogoutButton from '@/components/auth/LogoutButton';
import { getSessionUser, authFetch } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Busca uma seção autenticada e normaliza pra { ok, count, amostra, error }.
async function secao(path: string): Promise<{ ok: boolean; count: number | null; amostra: string[]; error?: string }> {
  try {
    const res = await authFetch(path);
    if (res.status === 401) return { ok: false, count: null, amostra: [], error: 'Sessão expirada ou sem permissão (401).' };
    if (!res.ok) return { ok: false, count: null, amostra: [], error: `HTTP ${res.status}` };
    const d = await res.json().catch(() => null);
    const arr: any[] = Array.isArray(d) ? d : (d?.result || d?.historico || d?.lancesAtivos || d?.lotes || []);
    const amostra = arr.slice(0, 5).map((x) => x?.descricao || x?.titulo || x?.bem?.siteTitulo || x?.lote?.descricao || `#${x?.id ?? '?'}`);
    return { ok: true, count: Array.isArray(arr) ? arr.length : 0, amostra };
  } catch (e) {
    return { ok: false, count: null, amostra: [], error: (e as Error).message };
  }
}

function Card({ titulo, r }: { titulo: string; r: Awaited<ReturnType<typeof secao>> }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <p className="font-semibold text-gray-800">{titulo}</p>
        {r.count != null && <span className="badge bg-marca/10 text-marca">{r.count}</span>}
      </div>
      {r.error ? (
        <p className="mt-2 text-sm text-amber-700">{r.error}</p>
      ) : r.amostra.length === 0 ? (
        <p className="mt-2 text-sm text-gray-500">Nenhum registro.</p>
      ) : (
        <ul className="mt-2 space-y-1 text-sm text-gray-600">
          {r.amostra.map((s, i) => <li key={i} className="line-clamp-1">• {s}</li>)}
        </ul>
      )}
    </div>
  );
}

export default async function ContaPage() {
  const user = await getSessionUser().catch(() => null);
  if (!user) redirect('/login');

  const [favoritos, lances, leiloes] = await Promise.all([
    secao('/api/arrematantes/meusFavoritos'),
    secao('/api/arrematantes/service/historico/lances'),
    secao('/api/arrematantes/service/leiloes'),
  ]);

  return (
    <div className="container-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Olá, {user.name || user.username}</h1>
          <p className="text-sm text-gray-500">Sua área de arrematante</p>
        </div>
        <LogoutButton />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="font-semibold text-gray-800">Meus dados</p>
          <dl className="mt-2 space-y-1 text-sm text-gray-600">
            <div><dt className="inline text-gray-400">ID: </dt><dd className="inline">{user.id}</dd></div>
            {user.username && <div><dt className="inline text-gray-400">Usuário: </dt><dd className="inline">{user.username}</dd></div>}
            {user.roles && <div><dt className="inline text-gray-400">Perfis: </dt><dd className="inline">{user.roles.join(', ')}</dd></div>}
          </dl>
        </div>
        <Card titulo="Meus favoritos" r={favoritos} />
        <Card titulo="Meus lances" r={lances} />
        <Card titulo="Meus leilões / habilitações" r={leiloes} />
      </div>

      <p className="mt-6 text-xs text-gray-400">
        As seções acima consomem endpoints autenticados existentes (não replicados na Website V2):
        <code> /api/arrematantes/meusFavoritos</code>, <code>/api/arrematantes/service/historico/lances</code>, <code>/api/arrematantes/service/leiloes</code>.
        Erros/401 indicam que o endpoint exige escopo/dados que o usuário de teste não possui — ver PENDENCIAS-API.md.
      </p>
    </div>
  );
}
