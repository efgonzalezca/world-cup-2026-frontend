import { useState } from 'react';
import { calculatePoints } from '../../utils/scoring';

export default function Simulator() {
  const [realLocal, setRealLocal] = useState('');
  const [realVisitor, setRealVisitor] = useState('');
  const [predLocal, setPredLocal] = useState('');
  const [predVisitor, setPredVisitor] = useState('');

  const canCalculate = realLocal !== '' && realVisitor !== '' && predLocal !== '' && predVisitor !== '';

  const result = canCalculate
    ? calculatePoints(parseInt(predLocal), parseInt(predVisitor), parseInt(realLocal), parseInt(realVisitor))
    : null;

  const handleReset = () => {
    setRealLocal(''); setRealVisitor('');
    setPredLocal(''); setPredVisitor('');
  };

  const ScoreInput = ({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) => (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
      <input
        type="text" inputMode="numeric" pattern="[0-9]*" maxLength={2}
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 2))}
        style={{
          width: 64, height: 52, textAlign: 'center',
          fontSize: 24, fontWeight: 800,
          background: 'var(--color-card)',
          color: 'var(--color-text)',
          border: '2px solid var(--color-border)',
          borderRadius: 'var(--radius-sm)',
          outline: 'none',
          fontVariantNumeric: 'tabular-nums',
          transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
        }}
        onFocus={(e) => { e.target.style.borderColor = 'var(--color-fifa-blue)'; e.target.style.boxShadow = '0 0 0 3px var(--color-fifa-blue-light)'; }}
        onBlur={(e) => { e.target.style.borderColor = 'var(--color-border)'; e.target.style.boxShadow = 'none'; }}
      />
    </div>
  );

  const PointRow = ({ label, points, accent }: { label: string; points: number; accent?: string }) => (
    <div
      className="flex items-center justify-between"
      style={{
        padding: '10px 14px',
        borderRadius: 'var(--radius-sm)',
        background: points > 0
          ? (accent === 'gold' ? 'var(--color-gold-bg)' : 'var(--color-success-bg)')
          : 'var(--color-bg)',
        transition: 'background 0.2s ease',
      }}
    >
      <span style={{
        fontSize: 13,
        color: points > 0
          ? (accent === 'gold' ? 'var(--color-gold)' : 'var(--color-text-secondary)')
          : 'var(--color-text-muted)',
        fontWeight: points > 0 ? 600 : 400,
      }}>
        {label}
      </span>
      <span style={{
        fontSize: 14, fontWeight: 700, fontVariantNumeric: 'tabular-nums',
        color: points > 0
          ? (accent === 'gold' ? 'var(--color-gold)' : 'var(--color-success)')
          : 'var(--color-text-light)',
      }}>
        {points > 0 ? `+${points}` : '0'} pts
      </span>
    </div>
  );

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <h2 className="text-2xl font-bold" style={{ color: 'var(--color-text)', marginBottom: 4, textAlign: 'center' }}>
        Simulador de Puntos
      </h2>
      <p style={{ fontSize: 13, color: 'var(--color-text-muted)', textAlign: 'center', marginBottom: 28 }}>
        Ingresa un resultado hipotético y tu predicción para ver cuántos puntos obtendrías
      </p>

      {/* ═══ SCORE CARDS ═══ */}
      <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: 16, marginBottom: 24 }}>
        {/* Real result */}
        <div style={{
          background: 'var(--color-card)',
          border: '1px solid var(--color-border-light)',
          borderRadius: 'var(--radius-md)',
          padding: '20px 16px',
          boxShadow: 'var(--shadow-sm)',
        }}>
          <div style={{
            fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: '0.08em', color: 'var(--color-primary)',
            textAlign: 'center', marginBottom: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: '50%',
              background: 'var(--color-primary)', opacity: 0.4,
            }} />
            Resultado Real
          </div>
          <div className="flex items-end justify-center" style={{ gap: 12 }}>
            <ScoreInput value={realLocal} onChange={setRealLocal} label="Local" />
            <span style={{ fontSize: 20, fontWeight: 300, color: 'var(--color-text-light)', paddingBottom: 14 }}>-</span>
            <ScoreInput value={realVisitor} onChange={setRealVisitor} label="Visitante" />
          </div>
        </div>

        {/* Prediction */}
        <div style={{
          background: 'var(--color-card)',
          border: '1px solid var(--color-border-light)',
          borderRadius: 'var(--radius-md)',
          padding: '20px 16px',
          boxShadow: 'var(--shadow-sm)',
        }}>
          <div style={{
            fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: '0.08em', color: 'var(--color-fifa-blue)',
            textAlign: 'center', marginBottom: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: '50%',
              background: 'var(--color-fifa-blue)',
            }} />
            Tu Predicción
          </div>
          <div className="flex items-end justify-center" style={{ gap: 12 }}>
            <ScoreInput value={predLocal} onChange={setPredLocal} label="Local" />
            <span style={{ fontSize: 20, fontWeight: 300, color: 'var(--color-text-light)', paddingBottom: 14 }}>-</span>
            <ScoreInput value={predVisitor} onChange={setPredVisitor} label="Visitante" />
          </div>
        </div>
      </div>

      {/* ═══ RESULTS BREAKDOWN ═══ */}
      {result && (
        <div style={{
          background: 'var(--color-card)',
          border: '1px solid var(--color-border-light)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-sm)',
          overflow: 'hidden',
        }}>
          <div style={{
            padding: '14px 16px',
            borderBottom: '1px solid var(--color-border-light)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>
              Desglose de Puntos
            </span>
            <button
              onClick={handleReset}
              style={{
                fontSize: 12, color: 'var(--color-fifa-blue)',
                background: 'var(--color-fifa-blue-light)',
                border: 'none', cursor: 'pointer',
                padding: '4px 12px', borderRadius: 99,
                fontWeight: 600,
                transition: 'opacity 0.15s ease',
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
            >
              Limpiar
            </button>
          </div>

          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <PointRow label="Acertar resultado (G/E/P)" points={result.resultPoints} />
            <PointRow label="Acertar goles local" points={result.localScorePoints} />
            <PointRow label="Acertar goles visitante" points={result.visitorScorePoints} />
            <PointRow label="Bonus marcador exacto" points={result.exactScoreBonus} accent="gold" />
            <PointRow label="Bonus empate no exacto" points={result.drawBonus} accent="gold" />
          </div>

          {/* Total */}
          <div style={{
            margin: '0 16px 16px',
            padding: '14px 18px',
            borderRadius: 'var(--radius-sm)',
            background: result.total > 0 ? 'var(--color-fifa-blue)' : 'var(--color-bg)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: result.total > 0 ? '#fff' : 'var(--color-text-muted)' }}>
              Total
            </span>
            <span style={{ fontSize: 22, fontWeight: 800, color: result.total > 0 ? '#fff' : 'var(--color-text-muted)', fontVariantNumeric: 'tabular-nums' }}>
              {result.total} pts
            </span>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!result && (
        <div style={{
          textAlign: 'center', padding: '40px 20px',
          background: 'var(--color-card)',
          border: '1px solid var(--color-border-light)',
          borderRadius: 'var(--radius-md)',
        }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>{'\u26BD'}</div>
          <div style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>
            Completa ambos marcadores para ver el desglose de puntos
          </div>
        </div>
      )}
    </div>
  );
}
