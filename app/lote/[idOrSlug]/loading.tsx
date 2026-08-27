export default function Loading() {
  return (
    <div className="lei-lote-wrap">
      <div className="lei-skel" style={{ width: 320, height: 14, marginBottom: 20 }} />
      <div className="lei-skel" style={{ height: 44, marginBottom: 20 }} />
      <div className="lei-lote-grid">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div className="lei-skel" style={{ aspectRatio: '4 / 3', borderRadius: 20 }} />
          <div className="lei-skel" style={{ height: 220, borderRadius: 18 }} />
          <div className="lei-skel" style={{ height: 160, borderRadius: 18 }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
          <div className="lei-skel" style={{ height: 420, borderRadius: 18 }} />
          <div className="lei-skel" style={{ height: 120, borderRadius: 18 }} />
        </div>
      </div>
    </div>
  );
}
