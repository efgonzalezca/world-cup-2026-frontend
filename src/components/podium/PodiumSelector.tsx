import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { FiCheck, FiX } from 'react-icons/fi';
import { getTeamsApi } from '../../api/teams';
import { getMatchesApi } from '../../api/matches';
import { getPodiumDeadlineApi } from '../../api/config';
import { updateUserApi } from '../../api/users';
import { useAuth } from '../../context/AuthContext';
import { getCountryCode } from '../../utils/flags';
import type { Team, Match } from '../../types';

const POSITIONS = [
  { key: 'champion',   label: 'Campeón',     shortLabel: '1ro', points: 30, color: 'var(--color-gold)',   bg: 'var(--color-gold-bg)',   emoji: '\uD83E\uDD47', height: 100, desktopH: 130 },
  { key: 'runnerUp',   label: 'Subcampeón',   shortLabel: '2do', points: 20, color: 'var(--color-silver)', bg: 'var(--color-silver-bg)', emoji: '\uD83E\uDD48', height: 80, desktopH: 105 },
  { key: 'thirdPlace', label: '3er Lugar',    shortLabel: '3ro', points: 10, color: 'var(--color-bronze)', bg: 'var(--color-bronze-bg)', emoji: '\uD83E\uDD49', height: 64, desktopH: 84 },
] as const;

const PODIUM_ORDER = [POSITIONS[1], POSITIONS[0], POSITIONS[2]];

type PickStatus = 'pending' | 'correct' | 'wrong';

/** Derive actual podium from final & third_place matches */
function getActualPodium(finalMatches: Match[], thirdPlaceMatches: Match[]) {
  const finalMatch = finalMatches.find((m) => m.has_played);
  const thirdMatch = thirdPlaceMatches.find((m) => m.has_played);

  let champion: string | null = null;
  let runnerUp: string | null = null;
  let thirdPlace: string | null = null;

  if (finalMatch && finalMatch.local_result != null && finalMatch.visiting_result != null) {
    if (finalMatch.local_result > finalMatch.visiting_result) {
      champion = finalMatch.local_team_id;
      runnerUp = finalMatch.visiting_team_id;
    } else if (finalMatch.visiting_result > finalMatch.local_result) {
      champion = finalMatch.visiting_team_id;
      runnerUp = finalMatch.local_team_id;
    }
  }

  if (thirdMatch && thirdMatch.local_result != null && thirdMatch.visiting_result != null) {
    if (thirdMatch.local_result > thirdMatch.visiting_result) {
      thirdPlace = thirdMatch.local_team_id;
    } else if (thirdMatch.visiting_result > thirdMatch.local_result) {
      thirdPlace = thirdMatch.visiting_team_id;
    }
  }

  return { champion, runnerUp, thirdPlace };
}

function TeamFlag({ teamId, size = 36 }: { teamId: string; size?: number }) {
  const code = getCountryCode(teamId);
  const h = Math.round(size * 0.72);
  if (!code) return null;
  return <span className={`fi fis fi-${code}`} style={{ width: size, height: h, borderRadius: 4, boxShadow: '0 1px 3px rgba(0,0,0,0.12)' }} />;
}

function StatusBadge({ status }: { status: PickStatus }) {
  if (status === 'pending') return null;
  const isCorrect = status === 'correct';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: 20, height: 20, borderRadius: '50%',
      background: isCorrect ? 'var(--color-success)' : 'var(--color-error)',
      color: '#fff', fontSize: 11, fontWeight: 700,
      boxShadow: `0 2px 6px ${isCorrect ? 'rgba(22,163,74,0.4)' : 'rgba(220,38,38,0.4)'}`,
    }}>
      {isCorrect ? <FiCheck size={12} /> : <FiX size={12} />}
    </span>
  );
}

export default function PodiumSelector() {
  const { user, updateUser } = useAuth();
  const [selections, setSelections] = useState({ champion: '', runnerUp: '', thirdPlace: '' });
  const [saving, setSaving] = useState(false);

  const { data: teams } = useQuery({
    queryKey: ['teams'],
    queryFn: () => getTeamsApi().then((r) => r.data),
  });

  const { data: deadlineData } = useQuery({
    queryKey: ['podiumDeadline'],
    queryFn: () => getPodiumDeadlineApi().then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  });

  // Fetch final and third_place matches to determine actual results
  const { data: finalMatches } = useQuery({
    queryKey: ['matches', 'final'],
    queryFn: () => getMatchesApi('final').then((r) => r.data),
  });
  const { data: thirdPlaceMatches } = useQuery({
    queryKey: ['matches', 'third_place'],
    queryFn: () => getMatchesApi('third_place').then((r) => r.data),
  });

  const actualPodium = useMemo(
    () => getActualPodium(finalMatches || [], thirdPlaceMatches || []),
    [finalMatches, thirdPlaceMatches],
  );

  // Determine if results are known (at least one final decided)
  const hasResults = !!(actualPodium.champion || actualPodium.thirdPlace);

  /** Get pick status for a position */
  const getStatus = (posKey: string, pickedTeamId: string): PickStatus => {
    if (!pickedTeamId || !hasResults) return 'pending';
    const actualId = actualPodium[posKey as keyof typeof actualPodium];
    if (!actualId) return 'pending'; // that position not yet decided
    return pickedTeamId === actualId ? 'correct' : 'wrong';
  };

  useEffect(() => {
    if (user?.podium) {
      setSelections({
        champion: user.podium.champion_team_id || '',
        runnerUp: user.podium.runner_up_team_id || '',
        thirdPlace: user.podium.third_place_team_id || '',
      });
    }
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await updateUserApi(user.id, {
        champion_team_id: selections.champion || null,
        runner_up_team_id: selections.runnerUp || null,
        third_place_team_id: selections.thirdPlace || null,
      });
      updateUser({
        podium: {
          ...(user.podium || { id: '', user_id: user.id }),
          champion_team_id: selections.champion || null,
          runner_up_team_id: selections.runnerUp || null,
          third_place_team_id: selections.thirdPlace || null,
        },
      });
      toast.success('Podio guardado exitosamente');
    } catch {
      toast.error('Error al guardar el podio');
    } finally {
      setSaving(false);
    }
  };

  const getTeamName = (id: string) => teams?.find((t) => t.id === id)?.name || '';
  const podiumDeadline = deadlineData?.podium_deadline ? new Date(deadlineData.podium_deadline) : null;
  const deadlinePassed = podiumDeadline ? Date.now() >= podiumDeadline.getTime() : false;
  const tournamentFinished = deadlinePassed;
  const anySelected = selections.champion || selections.runnerUp || selections.thirdPlace;

  const getAvailable = (currentKey: string) => {
    const selected = Object.entries(selections)
      .filter(([k, v]) => k !== currentKey && v)
      .map(([, v]) => v);
    return (teams || []).filter((t) => !selected.includes(t.id));
  };

  return (
    <div style={{ maxWidth: 680, margin: '0 auto' }}>
      {/* Header */}
      <h2 className="text-2xl font-bold" style={{ color: 'var(--color-text)', marginBottom: 4, textAlign: 'center' }}>
        Predicción de Podio
      </h2>
      <p style={{ fontSize: 13, color: 'var(--color-text-muted)', textAlign: 'center', marginBottom: 28 }}>
        Selecciona tus predicciones para el podio del mundial
        {podiumDeadline && !deadlinePassed && (
          <span style={{ display: 'block', fontSize: 11, marginTop: 4, color: 'var(--color-gold)' }}>
            Fecha limite: {podiumDeadline.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
        {deadlinePassed && (
          <span style={{ display: 'block', fontSize: 11, marginTop: 4, color: 'var(--color-error)' }}>
            El plazo para modificar predicciones de podio ha finalizado
          </span>
        )}
      </p>

      {/* ═══ PODIUM VISUAL ═══ */}
      <div style={{
        background: tournamentFinished ? 'var(--color-fifa-gradient)' : 'var(--color-card)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: tournamentFinished ? 'var(--shadow-lg)' : 'var(--shadow-md)',
        border: tournamentFinished ? 'none' : '1px solid var(--color-border-light)',
        padding: '28px 16px 0',
        marginBottom: 24,
        overflow: 'hidden',
      }}>
        {tournamentFinished && (
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 28, lineHeight: 1 }}>{'\uD83C\uDFC6'}</div>
            <div style={{
              fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
              letterSpacing: '0.15em', color: 'var(--color-fifa-teal)', marginTop: 6,
            }}>
              Resultado Final
            </div>
          </div>
        )}

        <div className="flex items-end justify-center" style={{ gap: 8 }}>
          {PODIUM_ORDER.map((pos) => {
            const val = selections[pos.key as keyof typeof selections];
            const isChamp = pos.key === 'champion';
            const status = getStatus(pos.key, val);
            const isCorrect = status === 'correct';
            const isWrong = status === 'wrong';

            const textColor = tournamentFinished ? '#fff' : 'var(--color-text)';

            // Pillar colors change based on correctness
            let pillarBg: string;
            let pillarBorder: string;
            if (tournamentFinished || hasResults) {
              if (isCorrect) {
                pillarBg = 'rgba(22,163,74,0.15)';
                pillarBorder = 'rgba(22,163,74,0.5)';
              } else if (isWrong) {
                pillarBg = 'rgba(220,38,38,0.08)';
                pillarBorder = 'rgba(220,38,38,0.3)';
              } else {
                pillarBg = tournamentFinished ? `${pos.color}25` : anySelected && val ? pos.bg : 'var(--color-bg)';
                pillarBorder = tournamentFinished ? `${pos.color}40` : anySelected && val ? `${pos.color}30` : 'var(--color-border)';
              }
            } else {
              pillarBg = anySelected && val ? pos.bg : 'var(--color-bg)';
              pillarBorder = anySelected && val ? `${pos.color}30` : 'var(--color-border)';
            }

            // Score color
            const scoreColor = isCorrect ? 'var(--color-success)' : isWrong ? 'var(--color-error)' : (val || tournamentFinished ? pos.color : 'var(--color-text-light)');

            return (
              <div key={pos.key} style={{ textAlign: 'center', flex: 1, minWidth: 0 }}>
                {/* Medal emoji */}
                <div style={{ fontSize: isChamp ? 24 : 18, lineHeight: 1, marginBottom: 6 }}>
                  {pos.emoji}
                </div>

                {/* Flag or placeholder */}
                <div style={{ marginBottom: 6, height: 28, display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
                  {val ? (
                    <>
                      <TeamFlag teamId={val} size={isChamp ? 40 : 32} />
                      {status !== 'pending' && (
                        <div style={{ position: 'absolute', right: isChamp ? 'calc(50% - 28px)' : 'calc(50% - 24px)', top: -6 }}>
                          <StatusBadge status={status} />
                        </div>
                      )}
                    </>
                  ) : (
                    <div style={{
                      width: isChamp ? 40 : 32, height: isChamp ? 28 : 24,
                      borderRadius: 4, background: tournamentFinished ? 'rgba(255,255,255,0.1)' : 'var(--color-border-light)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 10, color: tournamentFinished ? 'rgba(255,255,255,0.3)' : 'var(--color-text-light)',
                    }}>
                      ?
                    </div>
                  )}
                </div>

                {/* Team name */}
                <div style={{
                  fontSize: 12, fontWeight: 700,
                  color: isCorrect ? 'var(--color-success)' : isWrong ? (tournamentFinished ? 'rgba(255,255,255,0.35)' : 'var(--color-text-muted)') : val ? textColor : (tournamentFinished ? 'rgba(255,255,255,0.4)' : 'var(--color-text-muted)'),
                  textDecoration: isWrong ? 'line-through' : 'none',
                  marginBottom: 8, minHeight: 18,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {val ? getTeamName(val) : '—'}
                </div>

                {/* Pedestal */}
                <div className="podium-pillar" style={{
                  height: pos.height,
                  ['--desktop-h' as string]: `${pos.desktopH}px`,
                  background: pillarBg,
                  border: `2px solid ${pillarBorder}`,
                  borderRadius: '10px 10px 0 0',
                  borderBottom: 'none',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  padding: '4px 6px',
                  transition: 'all 0.3s ease',
                }}>
                  <span style={{
                    fontSize: 10, fontWeight: 800, letterSpacing: '0.06em',
                    color: scoreColor,
                    textTransform: 'uppercase', lineHeight: 1, marginBottom: 3,
                  }}>
                    {pos.shortLabel}
                  </span>
                  <span style={{
                    fontSize: 16, fontWeight: 900,
                    color: scoreColor,
                    lineHeight: 1,
                  }}>
                    {isCorrect ? `+${pos.points}` : isWrong ? '0' : `+${pos.points}`}
                  </span>
                  <span style={{
                    fontSize: 8, fontWeight: 600, marginTop: 2,
                    color: scoreColor,
                    opacity: 0.7,
                  }}>
                    {isCorrect ? 'pts' : isWrong ? 'pts' : 'pts'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ═══ SELECTION DROPDOWNS ═══ */}
      <div style={{
        background: 'var(--color-card)',
        border: '1px solid var(--color-border-light)',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-sm)',
        overflow: 'hidden',
      }}>
        {POSITIONS.map((pos, i) => {
          const val = selections[pos.key as keyof typeof selections];
          const available = getAvailable(pos.key);
          const status = getStatus(pos.key, val);
          const isCorrect = status === 'correct';
          const isWrong = status === 'wrong';

          // Row background based on status
          let rowBg: string;
          if (isCorrect) rowBg = 'var(--color-success-bg)';
          else if (isWrong) rowBg = 'var(--color-error-bg)';
          else if (val) rowBg = `${pos.color}06`;
          else rowBg = 'transparent';

          return (
            <div
              key={pos.key}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '14px 16px',
                borderBottom: i < POSITIONS.length - 1 ? '1px solid var(--color-border-light)' : 'none',
                background: rowBg,
                transition: 'background 0.2s ease',
              }}
            >
              <span style={{ fontSize: 20, flexShrink: 0 }}>{pos.emoji}</span>

              <div style={{ flex: '0 0 100px' }}>
                <div className="flex items-center" style={{ gap: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: isCorrect ? 'var(--color-success)' : isWrong ? 'var(--color-error)' : pos.color }}>
                    {pos.label}
                  </span>
                  {status !== 'pending' && <StatusBadge status={status} />}
                </div>
                <div style={{
                  fontSize: 11,
                  color: isCorrect ? 'var(--color-success)' : isWrong ? 'var(--color-text-muted)' : 'var(--color-text-muted)',
                  fontWeight: isCorrect ? 700 : 400,
                }}>
                  {isCorrect ? `+${pos.points} pts` : isWrong ? '0 pts' : `${pos.points} pts`}
                </div>
              </div>

              <div style={{ flex: 1, position: 'relative' }}>
                {val && (
                  <span
                    className={`fi fis fi-${getCountryCode(val)}`}
                    style={{
                      position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                      width: 20, height: 14, borderRadius: 2, zIndex: 1,
                      boxShadow: '0 0 0 1px rgba(0,0,0,0.08)',
                      opacity: isWrong ? 0.4 : 1,
                    }}
                  />
                )}
                <select
                  value={val}
                  onChange={(e) => setSelections({ ...selections, [pos.key]: e.target.value })}
                  disabled={hasResults && status !== 'pending'}
                  style={{
                    width: '100%',
                    padding: val ? '10px 32px 10px 40px' : '10px 32px 10px 14px',
                    background: hasResults && status !== 'pending' ? 'var(--color-bg)' : 'var(--color-bg)',
                    color: isWrong ? 'var(--color-text-muted)' : 'var(--color-text)',
                    border: `1.5px solid ${isCorrect ? 'rgba(22,163,74,0.4)' : isWrong ? 'rgba(220,38,38,0.3)' : val ? `${pos.color}40` : 'var(--color-border)'}`,
                    borderRadius: 'var(--radius-sm)',
                    fontSize: 13, outline: 'none',
                    cursor: hasResults && status !== 'pending' ? 'not-allowed' : 'pointer',
                    opacity: hasResults && status !== 'pending' ? 0.7 : 1,
                    appearance: 'none',
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2394A3B8' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 12px center',
                    transition: 'border-color 0.15s ease',
                  }}
                  onFocus={(e) => { if (!(hasResults && status !== 'pending')) e.currentTarget.style.borderColor = pos.color; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = isCorrect ? 'rgba(22,163,74,0.4)' : isWrong ? 'rgba(220,38,38,0.3)' : val ? `${pos.color}40` : 'var(--color-border)'; }}
                >
                  <option value="">Seleccionar equipo</option>
                  {available.map((t: Team) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
            </div>
          );
        })}
      </div>

      {/* ═══ SCORE SUMMARY (when results exist) ═══ */}
      {hasResults && (
        <div style={{
          marginTop: 16, padding: '12px 16px',
          background: 'var(--color-card)',
          border: '1px solid var(--color-border-light)',
          borderRadius: 'var(--radius-md)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)' }}>
            Puntos de podio obtenidos
          </span>
          <span style={{
            fontSize: 18, fontWeight: 800, fontVariantNumeric: 'tabular-nums',
            color: (user?.podium_score ?? 0) > 0 ? 'var(--color-success)' : 'var(--color-text-muted)',
          }}>
            {user?.podium_score ?? 0} pts
          </span>
        </div>
      )}

      {/* ��══ SAVE BUTTON ═══ */}
      {!tournamentFinished && (
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            width: '100%', marginTop: 20,
            padding: '13px 0',
            background: 'var(--color-fifa-blue)',
            color: '#fff', border: 'none',
            borderRadius: 'var(--radius-sm)',
            fontSize: 14, fontWeight: 700,
            cursor: saving ? 'wait' : 'pointer',
            opacity: saving ? 0.6 : 1,
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => { if (!saving) e.currentTarget.style.background = 'var(--color-fifa-blue-hover)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--color-fifa-blue)'; }}
        >
          {saving ? 'Guardando...' : 'Guardar Podio'}
        </button>
      )}
    </div>
  );
}
