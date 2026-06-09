import { GridSkeleton } from '@/components/Estados';

export default function Loading() {
  return (
    <div className="container-page">
      <div className="mb-6 h-40 animate-pulse rounded-xl bg-gray-200" />
      <GridSkeleton n={8} />
    </div>
  );
}
