// Estados de UI reaproveitáveis: loading (skeleton), vazio e erro.

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-gray-200 ${className}`} />;
}

export function GridSkeleton({ n = 8 }: { n?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className="card p-3">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="mt-3 h-4 w-3/4" />
          <Skeleton className="mt-2 h-4 w-1/2" />
        </div>
      ))}
    </div>
  );
}

export function Vazio({ titulo = 'Nada por aqui', descricao }: { titulo?: string; descricao?: string }) {
  return (
    <div className="rounded-lg border border-dashed border-gray-300 bg-white p-10 text-center">
      <p className="text-lg font-semibold text-gray-700">{titulo}</p>
      {descricao && <p className="mt-1 text-sm text-gray-500">{descricao}</p>}
    </div>
  );
}

export function Erro({ mensagem }: { mensagem?: string }) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
      <p className="font-semibold text-red-700">Não foi possível carregar</p>
      <p className="mt-1 text-sm text-red-600">{mensagem || 'Tente novamente em instantes.'}</p>
    </div>
  );
}
