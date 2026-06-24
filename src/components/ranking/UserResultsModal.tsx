import { useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FiX } from 'react-icons/fi';
import { getUserMatchResultsApi } from '../../api/users';
import { getCountryCode } from '../../utils/flags';
import type { RankingEntry } from '../../types';

const PHASE_LABEL: Record<string, string> = {
  group: 'Grupo',
  round_of_32: '1/32',
  round_of_16: 'Octavos',
  quarter: 'Cuartos',
  semi: 'Semis',
  third_place: '3er puesto',
  final: 'Final',
};

function Flag({ teamId, size = 22 }: { teamId: string | null; size?: number }) {
  const code = getCountryCode(teamId);
  const h = Math.round(size * 0.72);
  if (!code) {
    return (
      <span style={{ width: size, height: h, borderRadius: 3, background: 'rgba(255,255,255,0.15)', display: 'inline-block', flexShrink: 0 }} />
    );
  }
  return (
    <span
      className={`fi fis fi-${code}`}
      style={{ width: size, height: h, borderRadius: 3, display: 'inline-block', boxShadow: '0 0 0 1px rgba(255,255,255,0.1)', flexShrink: 0 }}
    />
  );
}

interface Props {
  entry: RankingEntry;
  onClose: () => void;
}

export default function UserResultsModal({ entry, onClose }: Props) {
  const { data, isLoading } = useQuery({
    queryKey: ['userMatchResults', entry.id],
    queryFn: () => getUserMatchResultsApi(entry.id).then((r) => r.data),
    staleTime: 30_000,
  });

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const results = data?.data ?? [];

  const summary = useMemo(() => {
    const played = results.filter((r) => r.match.has_played);
    const totalPoints = played.reduce((acc, r) => acc + r.points, 0);
    const withPoints = played.filter((r) => r.points > 0).length;
    return { played: played.length, totalPoints, withPoints };
  }, [results]);

  const bg = '#00173A';
  const cardBg = 'rgba(255,255,255,0.06)';
  const textPrimary = '#fff';
  const textSecondary = 'rgba(255,255,255,0.6)';
  const border = 'rgba(255,255,255,0.1)';

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 200 }} />

      <div style={{
        position: 'fixed', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16, zIndex: 201, pointerEvents: 'none',
      }}>
        <div style={{
          width: '100%', maxWidth: 520,
          maxHeight: 'calc(100dvh - 32px)',
          overflowY: 'auto',
          background: bg,
          borderRadius: 16,
          boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
          border: `1px solid ${border}`,
          pointerEvents: 'auto',
        }}>
          {/* Header */}
          <div style={{
            padding: '16px 20px',
            borderBottom: `1px solid ${border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            position: 'sticky', top: 0, background: bg, zIndex: 1,
          }}>
            <div>
              <span style={{ fontSize: 16, fontWeight: 700, color: textPrimary }}>
                {data?.user.nickname ?? entry.nickname}
              </span>
              <span style={{ fontSize: 12, color: textSecondary, marginLeft: 8 }}>
                Resultados
              </span>
            </div>
            <button onClick={onClose} style={{
              background: 'rgba(255,255,255,0.08)', border: 'none', cursor: 'pointer',
              color: textSecondary, padding: 6, borderRadius: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <FiX size={16} />
            </button>
          </div>

          <div style={{ padding: '20px 20px 24px' }}>
            {/* Summary */}
            {!isLoading && summary.played > 0 && (
              <div style={{
                display: 'flex', gap: 10, marginBottom: 20,
              }}>
                {[
                  { label: 'Partidos jugados', value: summary.played },
                  { label: 'Con puntos', value: summary.withPoints },
                  { label: 'Puntos totales', value: summary.totalPoints, accent: true },
                ].map(({ label, value, accent }) => (
                  <div key={label} style={{
                    flex: 1, padding: '12px 10px', borderRadius: 10,
                    background: accent ? 'var(--color-fifa-blue)' : cardBg,
                    border: `1px solid ${accent ? 'transparent' : border}`,
                    textAlign: 'center',
                  }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: accent ? '#fff' : 'var(--color-fifa-teal)' }}>
                      {value}
                    </div>
                    <div style={{ fontSize: 10, color: accent ? 'rgba(255,255,255,0.7)' : textSecondary, marginTop: 2, fontWeight: 600 }}>
                      {label}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* List */}
            {isLoading ? (
              <div style={{ padding: 40, textAlign: 'center' }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  border: '3px solid rgba(255,255,255,0.1)',
                  borderTopColor: 'var(--color-fifa-teal)',
                  animation: 'spin 0.8s linear infinite',
                  margin: '0 auto 10px',
                }} />
                <span style={{ color: textSecondary, fontSize: 13 }}>Cargando resultados...</span>
              </div>
            ) : results.length === 0 ? (
              <div style={{ padding: 32, textAlign: 'center', color: textSecondary, fontSize: 13 }}>
                Sin resultados registrados
              </div>
            ) : (
              <div style={{ borderRadius: 12, border: `1px solid ${border}`, overflow: 'hidden' }}>
                {/* Column headers */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 60px 60px 44px',
                  gap: 8,
                  padding: '9px 14px',
                  background: 'rgba(255,255,255,0.04)',
                  borderBottom: `1px solid ${border}`,
                  fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                  letterSpacing: '0.07em', color: textSecondary,
                  alignItems: 'center',
                }}>
                  <div>Partido</div>
                  <div style={{ textAlign: 'center' }}>Pred.</div>
                  <div style={{ textAlign: 'center' }}>Result.</div>
                  <div style={{ textAlign: 'center' }}>Pts</div>
                </div>

                {results.map((r, i) => {
                  const { match } = r;
                  const hasPred = r.local_score != null && r.visitor_score != null;
                  const phaseLabel = PHASE_LABEL[match.phase] ?? match.phase;
                  const groupSuffix = match.group_code ? ` ${match.group_code}` : '';
                  const matchDate = new Date(match.match_date).toLocaleDateString('es-CO', {
                    day: '2-digit', month: 'short',
                  });

                  return (
                    <div
                      key={r.id}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 60px 60px 44px',
                        gap: 8,
                        padding: '11px 14px',
                        background: i % 2 === 0 ? 'rgba(255,255,255,0.03)' : 'transparent',
                        borderBottom: i < results.length - 1 ? `1px solid ${border}` : 'none',
                        alignItems: 'center',
                      }}
                    >
                      {/* Teams + phase */}
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
                          <span style={{
                            fontSize: 9, fontWeight: 700,
                            color: 'var(--color-fifa-teal)',
                            background: 'rgba(45,226,177,0.1)',
                            padding: '1px 6px', borderRadius: 99,
                            textTransform: 'uppercase', letterSpacing: '0.05em',
                            flexShrink: 0,
                          }}>
                            {phaseLabel}{groupSuffix}
                          </span>
                          <span style={{ fontSize: 10, color: textSecondary }}>{matchDate}</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <Flag teamId={match.local_team?.id ?? null} size={18} />
                            <span style={{ fontSize: 12, color: textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {match.local_team?.name ?? 'TBD'}
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <Flag teamId={match.visiting_team?.id ?? null} size={18} />
                            <span style={{ fontSize: 12, color: textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {match.visiting_team?.name ?? 'TBD'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Prediction */}
                      <div style={{ textAlign: 'center' }}>
                        {hasPred ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center' }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: textPrimary, fontVariantNumeric: 'tabular-nums' }}>
                              {r.local_score}
                            </span>
                            <span style={{ fontSize: 13, fontWeight: 700, color: textPrimary, fontVariantNumeric: 'tabular-nums' }}>
                              {r.visitor_score}
                            </span>
                          </div>
                        ) : (
                          <span style={{ fontSize: 10, color: 'rgba(245,158,11,0.8)', background: 'rgba(245,158,11,0.1)', padding: '3px 6px', borderRadius: 99 }}>
                            Sin pred.
                          </span>
                        )}
                      </div>

                      {/* Actual result */}
                      <div style={{ textAlign: 'center' }}>
                        {match.has_played ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center' }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: textSecondary, fontVariantNumeric: 'tabular-nums' }}>
                              {match.local_result}
                            </span>
                            <span style={{ fontSize: 13, fontWeight: 700, color: textSecondary, fontVariantNumeric: 'tabular-nums' }}>
                              {match.visiting_result}
                            </span>
                          </div>
                        ) : (
                          <span style={{ fontSize: 10, color: textSecondary }}>—</span>
                        )}
                      </div>

                      {/* Points */}
                      <div style={{ textAlign: 'center' }}>
                        {match.has_played ? (
                          <span style={{
                            fontSize: 13, fontWeight: 800,
                            color: r.points > 0 ? 'var(--color-fifa-teal)' : textSecondary,
                            fontVariantNumeric: 'tabular-nums',
                          }}>
                            {r.points}
                          </span>
                        ) : (
                          <span style={{ fontSize: 10, color: textSecondary }}>—</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}
