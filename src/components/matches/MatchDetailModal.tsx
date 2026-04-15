import { useState, useEffect, useRef, useMemo, memo } from 'react';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { FiX, FiChevronDown, FiChevronUp, FiCalendar } from 'react-icons/fi';
import type { Match, UserMatch, DiscriminatedPoints, PaginatedMatchPredictions } from '../../types';
import { getMatchPredictionsApi } from '../../api/users';
import { getCountryCode } from '../../utils/flags';
import { useSocket } from '../../hooks/useSocket';
import { useAuth } from '../../context/AuthContext';

function Flag({ teamId, size = 28 }: { teamId: string | null; size?: number }) {
  const code = getCountryCode(teamId);
  const h = Math.round(size * 0.72);
  if (!code) return <span style={{ width: size, height: h, borderRadius: 3, background: 'rgba(255,255,255,0.15)', display: 'inline-block' }} />;
  return <span className={`fi fis fi-${code}`} style={{ width: size, height: h, borderRadius: 3, display: 'inline-block', boxShadow: '0 0 0 1px rgba(255,255,255,0.1)' }} />;
}

const PointsBreakdown = memo(function PointsBreakdown({ points }: { points: DiscriminatedPoints }) {
  const total = points.resultPoints + points.localScorePoints + points.visitorScorePoints + points.exactScoreBonus + (points.drawBonus ?? 0);
  const rows = [
    { label: 'Acertar resultado (G/E/P)', value: points.resultPoints },
    { label: 'Acertar goles local', value: points.localScorePoints },
    { label: 'Acertar goles visitante', value: points.visitorScorePoints },
    { label: 'Bonus marcador exacto', value: points.exactScoreBonus, gold: true },
    { label: 'Bonus empate no exacto', value: points.drawBonus ?? 0, gold: true },
  ].filter((r) => r.value > 0 || !r.label.includes('empate'));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 10 }}>
      {rows.map((r) => (
        <div key={r.label} style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '7px 12px', borderRadius: 8,
          background: r.value > 0 ? (r.gold ? 'rgba(255,193,7,0.12)' : 'rgba(45,226,177,0.1)') : 'rgba(255,255,255,0.04)',
        }}>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)' }}>{r.label}</span>
          <span style={{
            fontSize: 13, fontWeight: 700,
            color: r.value > 0 ? (r.gold ? '#ffc107' : 'var(--color-fifa-teal)') : 'rgba(255,255,255,0.3)',
          }}>
            +{r.value}
          </span>
        </div>
      ))}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '9px 14px', borderRadius: 8, marginTop: 2,
        background: 'var(--color-fifa-blue)',
      }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>Total</span>
        <span style={{ fontSize: 17, fontWeight: 800, color: '#fff' }}>{total} pts</span>
      </div>
    </div>
  );
});

const PRED_PAGE_SIZE = 30;

interface Props {
  match: Match;
  prediction?: UserMatch;
  onClose: () => void;
}

export default function MatchDetailModal({ match, prediction, onClose }: Props) {
  const [showBreakdown, setShowBreakdown] = useState(false);
  const played = match.has_played;
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const sentinelRef = useRef<HTMLDivElement>(null);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery<PaginatedMatchPredictions>({
    queryKey: ['matchPredictions', match.id],
    queryFn: ({ pageParam }) =>
      getMatchPredictionsApi(match.id, pageParam as number, PRED_PAGE_SIZE).then((r) => r.data),
    getNextPageParam: (lastPage) => {
      const nextPage = lastPage.page + 1;
      return nextPage <= Math.ceil(lastPage.total / lastPage.limit) ? nextPage : undefined;
    },
    initialPageParam: 1,
  });

  const allPredictions = useMemo(
    () => data?.pages.flatMap((p) => p.data) || [],
    [data],
  );

  const otherPredictions = useMemo(
    () => allPredictions.filter((p) => p.user?.id !== user?.id),
    [allPredictions, user?.id],
  );

  // Infinite scroll inside the modal
  useEffect(() => {
    if (!sentinelRef.current || !hasNextPage) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: '100px' },
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  useSocket({
    'match.prediction.updated': (payload: { matchId: string }) => {
      if (payload.matchId === match.id) {
        queryClient.invalidateQueries({ queryKey: ['matchPredictions', match.id] });
      }
    },
  });

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const bg = '#00173A';
  const cardBg = 'rgba(255,255,255,0.06)';
  const textPrimary = '#fff';
  const textSecondary = 'rgba(255,255,255,0.6)';
  const border = 'rgba(255,255,255,0.1)';

  const matchDate = new Date(match.match_date).toLocaleDateString('es-CO', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 200 }} />

      <div style={{
        position: 'fixed', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16, zIndex: 201, pointerEvents: 'none',
      }}>
        <div style={{
          width: '100%', maxWidth: 500,
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
          }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: textPrimary }}>Detalle del partido</span>
            <button onClick={onClose} style={{
              background: 'rgba(255,255,255,0.08)', border: 'none', cursor: 'pointer',
              color: textSecondary, padding: 6, borderRadius: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <FiX size={16} />
            </button>
          </div>

          <div style={{ padding: '20px 20px 24px' }}>

            {/* Match date */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              marginBottom: 16,
              padding: '10px 14px',
              borderRadius: 10,
              background: 'rgba(255,255,255,0.04)',
              border: `1px solid ${border}`,
            }}>
              <FiCalendar size={14} style={{ color: 'var(--color-fifa-teal)', flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: textSecondary, textTransform: 'capitalize' }}>
                {matchDate}
              </span>
            </div>

            {/* Match result (when played) */}
            {played && (
              <div style={{ marginBottom: 20 }}>
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16,
                  padding: '18px 16px',
                  background: cardBg,
                  borderRadius: 12,
                  border: `1px solid ${border}`,
                }}>
                  <div style={{ textAlign: 'center', flex: 1 }}>
                    <Flag teamId={match.local_team_id} size={36} />
                    <div style={{ fontSize: 12, fontWeight: 600, color: textPrimary, marginTop: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {match.local_team?.name || 'TBD'}
                    </div>
                  </div>
                  <div style={{
                    fontSize: 28, fontWeight: 900, color: textPrimary,
                    fontVariantNumeric: 'tabular-nums', letterSpacing: 2,
                    display: 'flex', alignItems: 'center', gap: 8,
                  }}>
                    <span>{match.local_result}</span>
                    <span style={{ fontSize: 14, color: textSecondary, fontWeight: 400 }}>-</span>
                    <span>{match.visiting_result}</span>
                  </div>
                  <div style={{ textAlign: 'center', flex: 1 }}>
                    <Flag teamId={match.visiting_team_id} size={36} />
                    <div style={{ fontSize: 12, fontWeight: 600, color: textPrimary, marginTop: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {match.visiting_team?.name || 'TBD'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* My Prediction */}
            <div style={{ marginBottom: 24 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: textSecondary, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
                Mi predicción
              </h3>

              <div style={{
                padding: '14px 16px',
                borderRadius: 12,
                background: cardBg,
                border: `1px solid ${border}`,
                display: 'flex', flexDirection: 'column', gap: 10,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Flag teamId={match.local_team_id} />
                    <span style={{ fontSize: 14, fontWeight: 600, color: textPrimary }}>
                      {match.local_team?.name || 'TBD'}
                    </span>
                  </div>
                  <span style={{
                    fontSize: 22, fontWeight: 800, fontVariantNumeric: 'tabular-nums',
                    color: prediction?.local_score != null ? textPrimary : textSecondary,
                  }}>
                    {prediction?.local_score ?? '-'}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Flag teamId={match.visiting_team_id} />
                    <span style={{ fontSize: 14, fontWeight: 600, color: textPrimary }}>
                      {match.visiting_team?.name || 'TBD'}
                    </span>
                  </div>
                  <span style={{
                    fontSize: 22, fontWeight: 800, fontVariantNumeric: 'tabular-nums',
                    color: prediction?.visitor_score != null ? textPrimary : textSecondary,
                  }}>
                    {prediction?.visitor_score ?? '-'}
                  </span>
                </div>
              </div>

              {played && (
                <div style={{ marginTop: 12 }}>
                  {prediction ? (
                    <>
                      <button
                        onClick={() => setShowBreakdown(!showBreakdown)}
                        style={{
                          width: '100%',
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '10px 14px', borderRadius: 10,
                          background: prediction.points > 0 ? 'rgba(45,226,177,0.12)' : cardBg,
                          border: `1px solid ${prediction.points > 0 ? 'rgba(45,226,177,0.3)' : border}`,
                          cursor: 'pointer',
                        }}
                      >
                        <span style={{
                          fontSize: 13, fontWeight: 700,
                          color: prediction.points > 0 ? 'var(--color-fifa-teal)' : textSecondary,
                        }}>
                          En este partido sumé: {prediction.points} puntos
                        </span>
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: 4,
                          fontSize: 11, fontWeight: 600,
                          color: textSecondary,
                        }}>
                          Detalle de mis puntos
                          {showBreakdown ? <FiChevronUp size={12} /> : <FiChevronDown size={12} />}
                        </div>
                      </button>
                      {showBreakdown && prediction.discriminated_points && (
                        <PointsBreakdown points={prediction.discriminated_points} />
                      )}
                    </>
                  ) : (
                    <div style={{
                      padding: '10px 14px', borderRadius: 10,
                      background: cardBg,
                      border: `1px solid ${border}`,
                    }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: textSecondary }}>
                        No registraste predicción · +0 puntos
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Participants Predictions (excluding current user) */}
            <div>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: textSecondary, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
                Predicción de los participantes
              </h3>

              {isLoading ? (
                <div style={{ padding: 24, textAlign: 'center' }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    border: '3px solid rgba(255,255,255,0.1)',
                    borderTopColor: 'var(--color-fifa-teal)',
                    animation: 'spin 0.8s linear infinite',
                    margin: '0 auto 8px',
                  }} />
                  <span style={{ color: textSecondary, fontSize: 13 }}>Cargando predicciones...</span>
                </div>
              ) : (
                <div style={{
                  borderRadius: 12,
                  border: `1px solid ${border}`,
                  overflow: 'hidden',
                }}>
                  {/* Column header */}
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '10px 14px',
                    background: 'rgba(255,255,255,0.04)',
                    borderBottom: `1px solid ${border}`,
                  }}>
                    <div style={{ flex: 1, fontSize: 11, color: textSecondary, fontWeight: 600 }}>
                      Participante
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Flag teamId={match.local_team_id} size={20} />
                      <span style={{ fontSize: 10, color: textSecondary, fontWeight: 700 }}>VS</span>
                      <Flag teamId={match.visiting_team_id} size={20} />
                    </div>
                    {played && (
                      <div style={{ width: 44, textAlign: 'center', fontSize: 11, color: textSecondary, fontWeight: 600 }}>
                        Pts
                      </div>
                    )}
                  </div>

                  {/* Rows */}
                  {otherPredictions.length > 0 ? (
                    otherPredictions.map((p, i) => {
                      const hasPred = p.local_score != null && p.visitor_score != null;
                      return (
                        <div
                          key={p.id}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            padding: '11px 14px',
                            background: i % 2 === 0 ? 'rgba(255,255,255,0.03)' : 'transparent',
                            borderBottom: i < otherPredictions.length - 1 ? `1px solid ${border}` : 'none',
                          }}
                        >
                          <div style={{
                            flex: 1, fontSize: 13, fontWeight: 500,
                            color: hasPred ? textPrimary : textSecondary,
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          }}>
                            {p.user?.nickname || 'Anon'}
                          </div>
                          {hasPred ? (
                            <div style={{
                              display: 'flex', alignItems: 'center', gap: 8,
                              fontSize: 15, fontWeight: 700, color: textPrimary,
                              fontVariantNumeric: 'tabular-nums',
                              minWidth: 56, justifyContent: 'center',
                            }}>
                              <span>{p.local_score}</span>
                              <span style={{ color: textSecondary, fontWeight: 400, fontSize: 12 }}>-</span>
                              <span>{p.visitor_score}</span>
                            </div>
                          ) : (
                            <span style={{
                              fontSize: 10, fontWeight: 600,
                              color: 'rgba(245,158,11,0.8)',
                              background: 'rgba(245,158,11,0.1)',
                              padding: '3px 8px', borderRadius: 99,
                              minWidth: 56, textAlign: 'center',
                            }}>
                              Pendiente
                            </span>
                          )}
                          {played && (
                            <div style={{
                              width: 44, textAlign: 'center',
                              fontSize: 12, fontWeight: 700,
                              color: p.points > 0 ? 'var(--color-fifa-teal)' : textSecondary,
                            }}>
                              {p.points}
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div style={{ padding: 24, textAlign: 'center', color: textSecondary, fontSize: 13 }}>
                      No hay participantes activos
                    </div>
                  )}

                  {/* Infinite scroll sentinel */}
                  <div ref={sentinelRef} style={{ height: 1 }} />

                  {isFetchingNextPage && (
                    <div style={{ padding: 12, textAlign: 'center' }}>
                      <div style={{
                        width: 20, height: 20, borderRadius: '50%',
                        border: '2px solid rgba(255,255,255,0.1)',
                        borderTopColor: 'var(--color-fifa-teal)',
                        animation: 'spin 0.8s linear infinite',
                        margin: '0 auto',
                      }} />
                    </div>
                  )}
                </div>
              )}
            </div>
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
