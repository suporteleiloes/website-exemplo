import SkelCards from '@/components/SkelCards';

export default function Loading() {
  return (
    <main>
      <section className="lei-ev-hero">
        <div className="lei-ev-hero__in">
          <div className="lei-skel" style={{ width: 260, height: 14, background: 'rgba(255,255,255,.18)' }} />
          <div className="lei-skel" style={{ width: '60%', maxWidth: 620, height: 40, marginTop: 18, background: 'rgba(255,255,255,.22)' }} />
          <div className="lei-skel" style={{ width: 320, height: 16, marginTop: 14, background: 'rgba(255,255,255,.14)' }} />
          <div className="lei-skel" style={{ width: 300, height: 40, marginTop: 30, background: 'rgba(255,255,255,.12)' }} />
        </div>
      </section>
      <section className="lei-ev-body">
        <div className="lei-skel" style={{ height: 60, marginBottom: 22 }} />
        <div className="lei-ev-cards"><SkelCards n={8} /></div>
      </section>
    </main>
  );
}
