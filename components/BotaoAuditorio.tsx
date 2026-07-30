import { PAINEL_URL } from '@/lib/config';

/**
 * Botão "Auditório Virtual" — CONVENÇÃO de todo site de leiloeiro (2026-07-30).
 *
 * Presente nas telas de LEILÃO e de LOTE, sempre visível, em VERMELHO (suave).
 * É o caminho pra acompanhar o pregão ao vivo no app do arrematante.
 *
 * URL = `${PAINEL_URL}/auditorio/{leilaoId}` — o app-cliente NOVO (`app.<dominio>`).
 * ⚠️ NUNCA use `leilao._urls.auditorio` da API: aponta pro arrematante LEGADO
 * (`arrematante.<dominio>`, hash-routing) — sites novos não referenciam o legado.
 *
 * `variant`: `destaque` (sólido, p/ hero do leilão) | `sutil` (rosado, p/ dentro
 * do painel de lance, abaixo do "Dar lance"). Some se o leilão está encerrado/
 * cancelado/adiado (96/97/99).
 */
const SEM_AUDITORIO = new Set([96, 97, 99]);

export default function BotaoAuditorio({
  leilaoId,
  status,
  aoVivo = false,
  variant = 'destaque',
  className = '',
}: {
  leilaoId: number | null | undefined;
  status?: number | null;
  aoVivo?: boolean;
  variant?: 'destaque' | 'sutil';
  className?: string;
}) {
  if (!leilaoId || !PAINEL_URL) return null;
  if (typeof status === 'number' && SEM_AUDITORIO.has(status)) return null;

  const sutil = variant === 'sutil';
  const estilo: React.CSSProperties = sutil
    ? { background: '#fdefef', color: '#c0392b', border: '1px solid #f0c9c9', boxShadow: 'none' }
    : { background: '#d9534f', color: '#fff', border: 'none', boxShadow: '0 12px 26px rgba(217,83,79,.34)' };

  return (
    <a
      href={`${PAINEL_URL}/auditorio/${leilaoId}`}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: '13px 22px',
        borderRadius: 12,
        fontWeight: 800,
        ...estilo,
      }}
    >
      <span style={{ width: 9, height: 9, borderRadius: '50%', background: sutil ? '#d9534f' : '#fff', animation: aoVivo ? 'pulse 1.6s infinite' : 'none' }} />
      {aoVivo ? 'Auditório ao vivo' : 'Auditório Virtual'}
    </a>
  );
}
