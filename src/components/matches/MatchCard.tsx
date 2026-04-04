import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { FiUsers } from 'react-icons/fi';
import type { Match, UserMatch } from '../../types';
import { updatePredictionApi } from '../../api/users';
import { useAuth } from '../../context/AuthContext';
import { getCountryCode } from '../../utils/flags';
import MatchDetailModal from './MatchDetailModal';

interface Props {
  match: Match;
  prediction?: UserMatch;
  onPredictionUpdate?: () => void;
}

type MatchState = 'forecast' | 'live' | 'finished';

function getMatchState(match: Match): MatchState {
  if (match.has_played) return 'finished';
  if (new Date() >= new Date(match.match_date)) return 'live';
  return 'forecast';
}

const STATE_CONFIG: Record<MatchState, { label: string; color: string; bg: string }> = {
  forecast: { label: 'Pronóstico', color: '#E65100', bg: 'rgba(230,81,0,0.1)' },
  live:     { label: 'En vivo',    color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
  finished: { label: 'Finalizado', color: '#16A34A', bg: 'rgba(22,163,74,0.1)' },
};

function Flag({ teamId, size = 40 }: { teamId: string | null; size?: number }) {
  const code = getCountryCode(teamId);
  const h = Math.round(size * 0.72);
  if (!code) return <div style={{ width: size, height: h, borderRadius: 4, background: 'var(--color-border)' }} />;
  return <span className={`fi fis fi-${code}`} style={{ width: size, height: h, borderRadius: 4, display: 'inline-block', boxShadow: '0 1px 3px rgba(0,0,0,0.12)' }} />;
}

export default function MatchCard({ match, prediction, onPredictionUpdate }: Props) {
  const { user } = useAuth();
  const savedLs = prediction?.local_score?.toString() ?? '';
  const savedVs = prediction?.visitor_score?.toString() ?? '';

  const [ls, setLs] = useState(savedLs);
  const [vs, setVs] = useState(savedVs);
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);

  useEffect(() => { setLs(savedLs); setVs(savedVs); }, [savedLs, savedVs]);

  const state = getMatchState(match);
  const cfg = STATE_CONFIG[state];
  const isLocked = state !== 'forecast';
  const canPredict = !isLocked;
  const hasPrediction = ls !== '' && vs !== '';
  const hasChanges = hasPrediction && (ls !== savedLs || vs !== savedVs);

  const handleSave = async () => {
    if (!user || !hasChanges || isLocked) return;
    setSaving(true);
    try {
      await updatePredictionApi(user.id, match.id, parseInt(ls), parseInt(vs));
      toast.success('Predicción actualizada');
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 10000);
      onPredictionUpdate?.();
    } catch { toast.error('Error al guardar'); }
    finally { setSaving(false); }
  };

  const dateStr = new Date(match.match_date).toLocaleDateString('es-CO', {
    weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  });

  return (
    <>
      <div style={{
        background: 'var(--color-card)',
        borderRadius: 14,
        border: '1px solid var(--color-border)',
        boxShadow: 'var(--shadow-md)',
        overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
      }}>

        {/* ═══ HEADER: date + state badge ═══ */}
        <div style={{
          padding: '12px 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: '1px solid var(--color-border-light)',
        }}>
          <span style={{
            fontSize: 11, fontWeight: 500, color: 'var(--color-text-muted)',
            letterSpacing: '0.02em',
          }}>
            {dateStr}
          </span>
          <span style={{
            fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: cfg.color,
            background: cfg.bg,
            padding: '3px 10px',
            borderRadius: 99,
            lineHeight: 1.4,
          }}>
            {cfg.label}
          </span>
        </div>

        {/* ═══ TEAMS + SCORE ZONE ═══ */}
        <div style={{ padding: '24px 16px 20px', flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>

            {/* Local team */}
            <div style={{ flex: 1, textAlign: 'center', minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
                <Flag teamId={match.local_team_id} size={44} />
              </div>
              <div style={{
                fontSize: 13, fontWeight: 600, color: 'var(--color-text)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                lineHeight: 1.3,
              }}>
                {match.local_team?.name || 'Por definir'}
              </div>
            </div>

            {/* Center: score or VS */}
            <div style={{
              flexShrink: 0, textAlign: 'center',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              minWidth: 80,
            }}>
              {state === 'finished' ? (
                <div style={{
                  fontSize: 30, fontWeight: 900, color: 'var(--color-text)',
                  fontVariantNumeric: 'tabular-nums', letterSpacing: 2, lineHeight: 1,
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <span>{match.local_result}</span>
                  <span style={{ fontSize: 16, color: 'var(--color-text-muted)', fontWeight: 400 }}>-</span>
                  <span>{match.visiting_result}</span>
                </div>
              ) : state === 'live' ? (
                <div style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: '#F59E0B',
                    animation: 'pulse 2s infinite',
                  }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#F59E0B', textTransform: 'uppercase' }}>
                    En curso
                  </span>
                </div>
              ) : (
                <div style={{
                  width: 38, height: 38, borderRadius: '50%',
                  background: 'var(--color-primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 800, color: 'var(--color-fifa-teal)',
                }}>
                  VS
                </div>
              )}
            </div>

            {/* Visitor team */}
            <div style={{ flex: 1, textAlign: 'center', minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
                <Flag teamId={match.visiting_team_id} size={44} />
              </div>
              <div style={{
                fontSize: 13, fontWeight: 600, color: 'var(--color-text)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                lineHeight: 1.3,
              }}>
                {match.visiting_team?.name || 'Por definir'}
              </div>
            </div>
          </div>
        </div>

        {/* ═══ PREDICTION / INFO SECTION ═══ */}
        <div style={{
          padding: '16px 16px 18px',
          borderTop: '1px solid var(--color-border-light)',
          background: 'var(--color-bg)',
        }}>

          {/* Label */}
          <div style={{
            fontSize: 10, fontWeight: 700, color: 'var(--color-text-muted)',
            textTransform: 'uppercase', letterSpacing: '0.1em',
            textAlign: 'center', marginBottom: 10,
          }}>
            {state === 'forecast' ? 'Tu pronóstico' : 'Mi predicción'}
          </div>

          {/* Inputs */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            <input
              type="text" inputMode="numeric" pattern="[0-9]*" maxLength={2} value={ls}
              onChange={(e) => setLs(e.target.value.replace(/\D/g, '').slice(0, 2))}
              disabled={isLocked} placeholder="-"
              style={{
                width: 52, height: 44, textAlign: 'center',
                fontSize: 20, fontWeight: 800,
                background: isLocked ? 'var(--color-bg)' : 'var(--color-card)',
                color: 'var(--color-text)',
                border: `2px solid ${isLocked ? 'var(--color-border-light)' : hasChanges ? 'var(--color-fifa-blue)' : 'var(--color-border)'}`,
                borderRadius: 10, outline: 'none',
                opacity: isLocked ? 0.5 : 1,
                cursor: isLocked ? 'not-allowed' : 'text',
                transition: 'border-color 0.15s ease',
              }}
              onFocus={(e) => { if (!isLocked) e.target.style.borderColor = 'var(--color-fifa-blue)'; }}
              onBlur={(e) => { if (!isLocked) e.target.style.borderColor = hasChanges ? 'var(--color-fifa-blue)' : 'var(--color-border)'; }}
            />
            <span style={{ color: 'var(--color-text-light)', fontSize: 16, fontWeight: 300 }}>-</span>
            <input
              type="text" inputMode="numeric" pattern="[0-9]*" maxLength={2} value={vs}
              onChange={(e) => setVs(e.target.value.replace(/\D/g, '').slice(0, 2))}
              disabled={isLocked} placeholder="-"
              style={{
                width: 52, height: 44, textAlign: 'center',
                fontSize: 20, fontWeight: 800,
                background: isLocked ? 'var(--color-bg)' : 'var(--color-card)',
                color: 'var(--color-text)',
                border: `2px solid ${isLocked ? 'var(--color-border-light)' : hasChanges ? 'var(--color-fifa-blue)' : 'var(--color-border)'}`,
                borderRadius: 10, outline: 'none',
                opacity: isLocked ? 0.5 : 1,
                cursor: isLocked ? 'not-allowed' : 'text',
                transition: 'border-color 0.15s ease',
              }}
              onFocus={(e) => { if (!isLocked) e.target.style.borderColor = 'var(--color-fifa-blue)'; }}
              onBlur={(e) => { if (!isLocked) e.target.style.borderColor = hasChanges ? 'var(--color-fifa-blue)' : 'var(--color-border)'; }}
            />
          </div>

          {/* Save button — forecast state only */}
          {canPredict && (
            <button
              onClick={handleSave}
              disabled={saving || !hasChanges}
              style={{
                width: '100%', marginTop: 14,
                padding: '11px 0',
                background: hasChanges ? 'var(--color-fifa-blue)' : 'var(--color-border)',
                color: hasChanges ? '#fff' : 'var(--color-text-muted)',
                border: 'none', borderRadius: 10,
                fontSize: 13, fontWeight: 700,
                cursor: hasChanges ? 'pointer' : 'default',
                opacity: saving ? 0.6 : 1,
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => { if (hasChanges && !saving) e.currentTarget.style.background = 'var(--color-fifa-blue-hover)'; }}
              onMouseLeave={(e) => { if (hasChanges) e.currentTarget.style.background = 'var(--color-fifa-blue)'; }}
            >
              {saving ? 'Guardando...' : savedLs ? 'Actualizar predicción' : 'Guardar predicción'}
            </button>
          )}

          {/* Saved confirmation */}
          {justSaved && !hasChanges && (
            <div style={{
              marginTop: 10, textAlign: 'center',
              fontSize: 11, color: 'var(--color-success)', fontWeight: 600,
            }}>
              Predicción actualizada
            </div>
          )}

          {/* Points pill — finished state */}
          {state === 'finished' && prediction && (
            <div style={{ marginTop: 12, display: 'flex', justifyContent: 'center' }}>
              <span style={{
                fontSize: 12, fontWeight: 700,
                padding: '5px 14px', borderRadius: 99,
                color: prediction.points > 0 ? 'var(--color-success)' : 'var(--color-text-muted)',
                background: prediction.points > 0 ? 'var(--color-success-bg)' : 'var(--color-card)',
                border: `1px solid ${prediction.points > 0 ? 'rgba(22,163,74,0.2)' : 'var(--color-border)'}`,
              }}>
                +{prediction.points} puntos
              </span>
            </div>
          )}
        </div>

        {/* ═══ FOOTER: Ver detalles ═══ */}
        <button
          onClick={() => setDetailOpen(true)}
          style={{
            width: '100%', padding: '12px 16px',
            background: 'var(--color-primary)',
            border: 'none', borderTop: '1px solid rgba(255,255,255,0.06)',
            color: 'var(--color-fifa-teal)',
            fontSize: 12, fontWeight: 600,
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            transition: 'opacity 0.15s ease',
          }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = '0.85'}
          onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
        >
          <FiUsers size={13} />
          Ver Detalles...
        </button>
      </div>

      {detailOpen && (
        <MatchDetailModal match={match} prediction={prediction} onClose={() => setDetailOpen(false)} />
      )}
    </>
  );
}
