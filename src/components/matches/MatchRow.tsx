import { useState, useEffect, useRef, memo } from 'react';
import { toast } from 'sonner';
import { FiChevronRight } from 'react-icons/fi';
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

const STATE_COLORS: Record<MatchState, string> = {
  forecast: '#E65100',
  live: '#F59E0B',
  finished: '#16A34A',
};

function Flag({ teamId, size = 22 }: { teamId: string | null; size?: number }) {
  const code = getCountryCode(teamId);
  const h = Math.round(size * 0.72);
  if (!code) return <span style={{ width: size, height: h, borderRadius: 3, background: 'var(--color-border)', display: 'inline-block', flexShrink: 0 }} />;
  return <span className={`fi fis fi-${code}`} style={{ width: size, height: h, borderRadius: 3, flexShrink: 0, boxShadow: '0 0 0 1px rgba(0,0,0,0.08)' }} />;
}

// Fixed dimensions for perfect alignment across all states
const SLOT = 30;  // score slot width
const SLOT_H = 28;
const MID = 32;   // center divider width

function MatchRow({ match, prediction, onPredictionUpdate }: Props) {
  const { user } = useAuth();
  const savedLs = prediction?.local_score?.toString() ?? '';
  const savedVs = prediction?.visitor_score?.toString() ?? '';

  const [localScore, setLocalScore] = useState(savedLs);
  const [visitorScore, setVisitorScore] = useState(savedVs);
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [justUpdated, setJustUpdated] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const prevData = useRef({
    lr: match.local_result, vr: match.visiting_result, hp: match.has_played,
    pls: prediction?.local_score, pvs: prediction?.visitor_score,
  });

  useEffect(() => { setLocalScore(savedLs); setVisitorScore(savedVs); }, [savedLs, savedVs]);

  // Detect external updates (websocket)
  useEffect(() => {
    const prev = prevData.current;
    const matchChanged = prev.lr !== match.local_result || prev.vr !== match.visiting_result || prev.hp !== match.has_played;
    const predChanged = prev.pls !== prediction?.local_score || prev.pvs !== prediction?.visitor_score;
    prevData.current = {
      lr: match.local_result, vr: match.visiting_result, hp: match.has_played,
      pls: prediction?.local_score, pvs: prediction?.visitor_score,
    };
    if ((matchChanged || predChanged) && !saving) {
      setJustUpdated(true);
      setTimeout(() => setJustUpdated(false), 4000);
    }
  }, [match.local_result, match.visiting_result, match.has_played, prediction?.local_score, prediction?.visitor_score, saving]);

  const state = getMatchState(match);
  const isLocked = state !== 'forecast';
  const canPredict = !isLocked;
  const hasChanges = localScore !== '' && visitorScore !== '' && (localScore !== savedLs || visitorScore !== savedVs);
  const finished = state === 'finished';

  const handleSave = async () => {
    if (!user || !hasChanges || isLocked) return;
    setSaving(true);
    try {
      await updatePredictionApi(user.id, match.id, parseInt(localScore), parseInt(visitorScore));
      toast.success('Predicción actualizada');
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 10000);
      onPredictionUpdate?.();
    } catch { toast.error('Error al guardar'); }
    finally { setSaving(false); }
  };

  const handleRowClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'BUTTON' || target.closest('button')) return;
    setDetailOpen(true);
  };

  const dateStr = new Date(match.match_date).toLocaleDateString('es-CO', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  });
  const groupLabel = match.group_code ? `G${match.group_code}` : '';
  const stateColor = STATE_COLORS[state];

  // ── Finished score block width = SLOT + MID + SLOT ──
  const SCORE_BLOCK = SLOT + MID + SLOT;

  // ── Input style (forecast/live state) ──
  const inputStyle = (changed: boolean): React.CSSProperties => ({
    width: SLOT, height: SLOT_H, textAlign: 'center', fontSize: 13, fontWeight: 700,
    background: isLocked ? 'var(--color-bg)' : 'var(--color-card)',
    color: 'var(--color-text)',
    border: `1.5px solid ${changed ? 'var(--color-fifa-blue)' : 'var(--color-border)'}`,
    borderRadius: 6, outline: 'none', flexShrink: 0,
    opacity: isLocked ? 0.4 : 1,
    cursor: isLocked ? 'not-allowed' : 'text',
  });

  return (
    <>
      <div
        onClick={handleRowClick}
        style={{
          padding: '10px 12px 10px 16px',
          borderBottom: '1px solid var(--color-border-light)',
          transition: 'background 0.5s ease, border-color 0.4s ease',
          background: (justUpdated || (justSaved && !hasChanges)) ? 'var(--color-success-bg)' : 'transparent',
          borderLeft: (justUpdated || (justSaved && !hasChanges))
            ? '3px solid var(--color-success)'
            : `3px solid ${stateColor}`,
          cursor: 'pointer',
        }}
        onMouseEnter={(e) => { if (!justSaved && !justUpdated) e.currentTarget.style.background = 'var(--color-bg)'; }}
        onMouseLeave={(e) => { if (!justSaved && !justUpdated) e.currentTarget.style.background = justUpdated ? 'var(--color-success-bg)' : 'transparent'; }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>

          {/* Date + Group — fixed width */}
          <div style={{ width: 72, flexShrink: 0 }}>
            <div style={{ fontSize: 10, color: 'var(--color-text-muted)', lineHeight: 1.4 }}>{dateStr}</div>
            {groupLabel && (
              <span style={{
                fontSize: 8, fontWeight: 700, color: '#fff',
                background: 'var(--color-primary)',
                padding: '1px 4px', borderRadius: 3, marginTop: 2, display: 'inline-block',
              }}>{groupLabel}</span>
            )}
          </div>

          {/*
            Unified layout: name flag [SLOT] [MID] [SLOT] flag name
            SLOT = 30px always (input or score span)
            MID  = 32px always (VS circle or save button)
          */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', minWidth: 0 }}>

            {/* Local: name + code + flag */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 4, minWidth: 0, justifyContent: 'flex-end' }}>
              <span className="hidden sm:inline" style={{
                fontSize: 12, fontWeight: 600, color: 'var(--color-text)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {match.local_team?.name || 'TBD'}
              </span>
              <span className="sm:hidden" style={{
                fontSize: 11, fontWeight: 700, color: 'var(--color-text)',
                whiteSpace: 'nowrap',
              }}>
                {match.local_team_id || 'TBD'}
              </span>
              <Flag teamId={match.local_team_id} />
            </div>

            {/* ── Finished: single cohesive score block ── */}
            {finished ? (
              <div style={{
                width: SCORE_BLOCK, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: 0,
                background: 'var(--color-bg)',
                borderRadius: 8,
                height: SLOT_H,
                padding: '0 2px',
              }}>
                <span style={{
                  flex: 1, textAlign: 'center',
                  fontSize: 15, fontWeight: 800, color: 'var(--color-text)',
                  fontVariantNumeric: 'tabular-nums', lineHeight: 1,
                }}>
                  {savedLs || '-'}
                </span>
                <span style={{
                  fontSize: 13, fontWeight: 400, color: 'var(--color-text-muted)',
                  lineHeight: 1, padding: '0 1px',
                }}>
                  -
                </span>
                <span style={{
                  flex: 1, textAlign: 'center',
                  fontSize: 15, fontWeight: 800, color: 'var(--color-text)',
                  fontVariantNumeric: 'tabular-nums', lineHeight: 1,
                }}>
                  {savedVs || '-'}
                </span>
              </div>
            ) : (
              <>
                {/* Local score input */}
                <input
                  type="text" inputMode="numeric" pattern="[0-9]*" maxLength={2}
                  value={localScore}
                  onChange={(e) => { setLocalScore(e.target.value.replace(/\D/g, '').slice(0, 2)); setJustSaved(false); }}
                  disabled={isLocked}
                  onClick={(e) => e.stopPropagation()}
                  style={inputStyle(hasChanges)}
                  onFocus={(e) => { if (!isLocked) e.target.style.borderColor = 'var(--color-fifa-blue)'; }}
                  onBlur={(e) => { if (!isLocked) e.target.style.borderColor = hasChanges ? 'var(--color-fifa-blue)' : 'var(--color-border)'; }}
                />

                {/* Center divider */}
                <div style={{
                  width: MID, flexShrink: 0,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                }}>
                  {state === 'live' ? (
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#F59E0B', animation: 'pulse 2s infinite' }} />
                  ) : (
                    <span style={{
                      display: 'inline-block', width: 20, height: 20, lineHeight: '20px',
                      borderRadius: '50%', background: 'var(--color-primary)',
                      color: 'var(--color-fifa-teal)', fontSize: 7, fontWeight: 800,
                      textAlign: 'center',
                    }}>VS</span>
                  )}
                  {canPredict && hasChanges && (
                    <button onClick={handleSave} disabled={saving} style={{
                      width: 18, height: 18, borderRadius: '50%',
                      background: 'var(--color-fifa-blue)', color: '#fff',
                      border: 'none', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 9, fontWeight: 700, opacity: saving ? 0.5 : 1,
                    }}>
                      {saving ? '·' : '✓'}
                    </button>
                  )}
                </div>

                {/* Visitor score input */}
                <input
                  type="text" inputMode="numeric" pattern="[0-9]*" maxLength={2}
                  value={visitorScore}
                  onChange={(e) => { setVisitorScore(e.target.value.replace(/\D/g, '').slice(0, 2)); setJustSaved(false); }}
                  disabled={isLocked}
                  onClick={(e) => e.stopPropagation()}
                  style={inputStyle(hasChanges)}
                  onFocus={(e) => { if (!isLocked) e.target.style.borderColor = 'var(--color-fifa-blue)'; }}
                  onBlur={(e) => { if (!isLocked) e.target.style.borderColor = hasChanges ? 'var(--color-fifa-blue)' : 'var(--color-border)'; }}
                />
              </>
            )}

            {/* Visitor: flag + name */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 4, minWidth: 0 }}>
              <Flag teamId={match.visiting_team_id} />
              <span className="hidden sm:inline" style={{
                fontSize: 12, fontWeight: 600, color: 'var(--color-text)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {match.visiting_team?.name || 'TBD'}
              </span>
              <span className="sm:hidden" style={{
                fontSize: 11, fontWeight: 700, color: 'var(--color-text)',
                whiteSpace: 'nowrap',
              }}>
                {match.visiting_team_id || 'TBD'}
              </span>
            </div>
          </div>

          {/* Points + chevron */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
            {finished && (
              <span style={{
                fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 99,
                color: (prediction?.points ?? 0) > 0 ? 'var(--color-success)' : 'var(--color-text-muted)',
                background: (prediction?.points ?? 0) > 0 ? 'var(--color-success-bg)' : 'var(--color-bg)',
              }}>
                +{prediction?.points ?? 0}
              </span>
            )}
            <FiChevronRight size={14} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
          </div>
        </div>
      </div>

      {detailOpen && <MatchDetailModal match={match} prediction={prediction} onClose={() => setDetailOpen(false)} />}
    </>
  );
}

export default memo(MatchRow);
