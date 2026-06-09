import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="container-page py-16 text-center">
      <p className="text-5xl font-bold text-marca">404</p>
      <p className="mt-2 text-lg text-gray-600">Página não encontrada.</p>
      <Link href="/" className="btn-primary mt-6 inline-flex">Voltar ao início</Link>
    </div>
  );
}
