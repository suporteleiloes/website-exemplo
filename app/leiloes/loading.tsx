import SkelCards from '@/components/SkelCards';

export default function Loading() {
  return (
    <main>
      <section className="lei-page-hero">
        <div className="lei-page-hero__in">
          <div className="lei-skel" style={{ width: 120, height: 14, background: 'rgba(255,255,255,.18)' }} />
          <div className="lei-skel" style={{ width: 220, height: 34, marginTop: 16, background: 'rgba(255,255,255,.22)' }} />
          <div className="lei-skel" style={{ width: 360, height: 16, marginTop: 12, background: 'rgba(255,255,255,.14)' }} />
        </div>
      </section>
      <section className="lei-ev-body">
        <div className="lei-skel" style={{ height: 60, marginBottom: 22 }} />
        <div className="lei-grid-leiloes"><SkelCards n={9} /></div>
      </section>
    </main>
  );
}
