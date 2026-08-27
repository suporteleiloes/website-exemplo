// Grade de cards "fantasma" (skeleton) enquanto os dados carregam.
export default function SkelCards({ n = 8 }: { n?: number }) {
  return (
    <>
      {Array.from({ length: n }).map((_, i) => (
        <div className="lei-skel-card" key={i}>
          <div className="lei-skel lei-skel-card__img" style={{ borderRadius: 0 }} />
          <div style={{ padding: '14px 15px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div className="lei-skel lei-skel-line" style={{ width: '55%' }} />
            <div className="lei-skel lei-skel-line" style={{ width: '90%', height: 16 }} />
            <div className="lei-skel lei-skel-line" style={{ width: '40%', height: 20, marginTop: 6 }} />
            <div className="lei-skel lei-skel-line" style={{ width: '100%', height: 34, marginTop: 8 }} />
          </div>
        </div>
      ))}
    </>
  );
}
