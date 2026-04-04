import type { DiscriminatedPoints } from '../../types';

interface Props {
  points: DiscriminatedPoints;
  onClose: () => void;
}

export default function PointsPopover({ points, onClose }: Props) {
  const total = points.resultPoints + points.localScorePoints + points.visitorScorePoints + points.exactScoreBonus + (points.drawBonus ?? 0);

  return (
    <div
      className="absolute z-10 left-1/2 -translate-x-1/2"
      style={{
        marginTop: 8,
        background: 'var(--color-card)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-md)',
        padding: 16,
        minWidth: 220,
        boxShadow: 'var(--shadow-lg)',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {[
          { label: 'Resultado', value: points.resultPoints },
          { label: 'Goles local', value: points.localScorePoints },
          { label: 'Goles visitante', value: points.visitorScorePoints },
          { label: 'Bonus exacto', value: points.exactScoreBonus, highlight: true },
          { label: 'Bonus empate', value: points.drawBonus ?? 0, highlight: true },
        ].filter((row) => row.value > 0 || row.label !== 'Bonus empate').map((row) => (
          <div key={row.label} className="flex justify-between items-center" style={{ fontSize: 12 }}>
            <span style={{ color: 'var(--color-text-secondary)' }}>{row.label}</span>
            <span style={{
              color: row.value > 0 ? (row.highlight ? 'var(--color-gold)' : 'var(--color-text)') : 'var(--color-text-muted)',
              fontWeight: 600,
            }}>
              {row.value} pts
            </span>
          </div>
        ))}
        <div className="flex justify-between items-center" style={{ marginTop: 4, paddingTop: 8, borderTop: '1px solid var(--color-border-light)', fontSize: 13 }}>
          <span style={{ color: 'var(--color-fifa-blue)', fontWeight: 700 }}>Total</span>
          <span style={{ color: 'var(--color-fifa-blue)', fontWeight: 700 }}>{total} pts</span>
        </div>
      </div>
      <button onClick={onClose} className="cursor-pointer bg-transparent border-none w-full text-center"
        style={{ marginTop: 12, color: 'var(--color-text-muted)', fontSize: 11 }}>
        Cerrar
      </button>
    </div>
  );
}
