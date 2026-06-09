'use client';
import { Erro } from '@/components/Estados';

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="container-page py-10">
      <Erro mensagem={error.message} />
      <div className="mt-4 text-center">
        <button onClick={reset} className="btn-primary">Tentar novamente</button>
      </div>
    </div>
  );
}
