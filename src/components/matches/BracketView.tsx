import { useQuery } from '@tanstack/react-query';
import { useState, useRef, useCallback, useEffect, memo } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import { FiChevronDown, FiChevronUp, FiChevronRight, FiChevronLeft } from 'react-icons/fi';
import { getMatchesApi } from '../../api/matches';
import type { Match, UserMatch, MatchPhase } from '../../types';
import { updatePredictionApi } from '../../api/users';
import { useAuth } from '../../context/AuthContext';
import { getCountryCode } from '../../utils/flags';
import MatchDetailModal from './MatchDetailModal';

// ─── Layout constants ────────────────────────────────────────────────────────
const MATCH_W = 185;
const CONN_W = 36;
const HEADER_H = 32;
const COLLAPSED_W = 36;

interface Props {
  predictions: UserMatch[];
  onPredictionUpdate: () => void;
}

// ─── SVG Connectors ──────────────────────────────────────────────────────────

const yOf = (i: number, N: number, h: number) => ((2 * i + 1) / (2 * N)) * h;

function ConvergeConnector({ fromN, toN, h }: { fromN: number; toN: number; h: number }) {
  const ratio = fromN / toN;
  const d: string[] = [];
  const mx = CONN_W / 2;
  for (let k = 0; k < toN; k++) {
    const parentY = yOf(k, toN, h);
    const c0 = yOf(k * ratio, fromN, h);
    const c1 = yOf(k * ratio + ratio - 1, fromN, h);
    for (let j = 0; j < ratio; j++) d.push(`M0 ${yOf(k * ratio + j, fromN, h)} H${mx}`);
    d.push(`M${mx} ${c0} V${c1}`);
    d.push(`M${mx} ${parentY} H${CONN_W}`);
  }
  return (
    <div style={{ paddingTop: HEADER_H, flexShrink: 0 }}>
      <svg width={CONN_W} height={h}><path d={d.join(' ')} stroke="var(--color-border)" strokeWidth={1.5} fill="none" /></svg>
    </div>
  );
}

function DivergeConnector({ fromN, toN, h }: { fromN: number; toN: number; h: number }) {
  const ratio = toN / fromN;
  const d: string[] = [];
  const mx = CONN_W / 2;
  for (let k = 0; k < fromN; k++) {
    const parentY = yOf(k, fromN, h);
    const c0 = yOf(k * ratio, toN, h);
    const c1 = yOf(k * ratio + ratio - 1, toN, h);
    d.push(`M0 ${parentY} H${mx}`);
    d.push(`M${mx} ${c0} V${c1}`);
    for (let j = 0; j < ratio; j++) d.push(`M${mx} ${yOf(k * ratio + j, toN, h)} H${CONN_W}`);
  }
  return (
    <div style={{ paddingTop: HEADER_H, flexShrink: 0 }}>
      <svg width={CONN_W} height={h}><path d={d.join(' ')} stroke="var(--color-border)" strokeWidth={1.5} fill="none" /></svg>
    </div>
  );
}

function LineConnector({ y, h }: { y: number; h: number }) {
  return (
    <div style={{ paddingTop: HEADER_H, flexShrink: 0 }}>
      <svg width={CONN_W} height={h}><line x1={0} y1={y} x2={CONN_W} y2={y} stroke="var(--color-border)" strokeWidth={1.5} /></svg>
    </div>
  );
}

// ─── Bracket MatchSlot ───────────────────────────────────────────────────────

const BracketSlot = memo(function BracketSlot({
  match, prediction, onPredictionUpdate,
}: { match: Match; prediction?: UserMatch; onPredictionUpdate: () => void }) {
  const { user } = useAuth();
  const savedLs = prediction?.local_score?.toString() ?? '';
  const savedVs = prediction?.visitor_score?.toString() ?? '';
  const [ls, setLs] = useState(savedLs);
  const [vs, setVs] = useState(savedVs);
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [justUpdated, setJustUpdated] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const prevData = useRef({
    lr: match.local_result, vr: match.visiting_result, hp: match.has_played,
    pls: prediction?.local_score, pvs: prediction?.visitor_score,
  });

  useEffect(() => { setLs(savedLs); setVs(savedVs); }, [savedLs, savedVs]);

  // Detect external updates (websocket): match results OR prediction changes
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

  const played = match.has_played;
  const isPast = new Date() >= new Date(match.match_date);
  const isLocked = played || isPast;
  const canPredict = !isLocked;
  const hasChanges = ls !== '' && vs !== '' && (ls !== savedLs || vs !== savedVs);
  const showActions = isEditing || hasChanges;

  const save = async () => {
    if (!user || !hasChanges || isLocked) return;
    setSaving(true);
    try {
      await updatePredictionApi(user.id, match.id, parseInt(ls), parseInt(vs));
      toast.success('Predicción actualizada');
      setJustSaved(true);
      setIsEditing(false);
      setTimeout(() => setJustSaved(false), 10000);
      onPredictionUpdate();
    } catch { toast.error('Error al guardar'); }
    finally { setSaving(false); }
  };

  const cancel = () => {
    setLs(savedLs);
    setVs(savedVs);
    setIsEditing(false);
  };

  const lCode = getCountryCode(match.local_team_id);
  const vCode = getCountryCode(match.visiting_team_id);
  const lWins = played && (match.local_result ?? -1) > (match.visiting_result ?? -1);
  const vWins = played && (match.visiting_result ?? -1) > (match.local_result ?? -1);

  const renderTeamRow = (local: boolean) => {
    const teamId = local ? match.local_team_id : match.visiting_team_id;
    const code = local ? lCode : vCode;
    const winner = local ? lWins : vWins;
    const score = local ? ls : vs;
    const setScore = local ? setLs : setVs;
    const predScore = local ? savedLs : savedVs;

    return (
      <div key={local ? 'local' : 'visitor'} style={{
        display: 'flex', alignItems: 'center', gap: 5,
        padding: '6px 8px',
        borderBottom: local ? '1px solid var(--color-border-light)' : 'none',
        background: winner ? 'rgba(0,23,58,0.05)' : 'transparent',
        minHeight: 32,
      }}>
        {code
          ? <span className={`fi fis fi-${code}`} style={{ width: 18, height: 14, borderRadius: 2, flexShrink: 0 }} />
          : <span style={{ width: 18, height: 12, borderRadius: 2, background: 'var(--color-border)', flexShrink: 0, display: 'inline-block' }} />
        }
        <span style={{
          flex: 1, fontSize: 11,
          fontWeight: winner ? 700 : 500,
          color: winner ? 'var(--color-text)' : 'var(--color-text-secondary)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {local
            ? (match.local_team?.name || teamId || 'TBD')
            : (match.visiting_team?.name || teamId || 'TBD')}
        </span>
        {played ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <span style={{
              fontSize: 10, fontWeight: 700, minWidth: 18, textAlign: 'center',
              color: 'var(--color-fifa-blue)',
              background: 'var(--color-fifa-blue-light)',
              borderRadius: 4, padding: '1px 3px',
              lineHeight: 1.4,
            }}>
              {predScore || '-'}
            </span>
            <span style={{
              fontSize: 12, fontWeight: winner ? 800 : 600, minWidth: 18, textAlign: 'center',
              color: winner ? 'var(--color-text)' : 'var(--color-text-secondary)',
              background: winner ? 'rgba(0,23,58,0.08)' : 'var(--color-bg)',
              borderRadius: 4, padding: '1px 3px',
              lineHeight: 1.4,
            }}>
              {(local ? match.local_result : match.visiting_result) ?? '-'}
            </span>
          </div>
        ) : (
          <input
            type="text" inputMode="numeric" pattern="[0-9]*" maxLength={2} value={score}
            onChange={(e) => { setScore(e.target.value.replace(/\D/g, '').slice(0, 2)); setJustSaved(false); }}
            disabled={!canPredict}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onFocus={() => { if (canPredict) setIsEditing(true); }}
            style={{
              width: 28, height: 24, textAlign: 'center', fontSize: 12, fontWeight: 700,
              border: `1.5px solid ${hasChanges || isEditing ? 'var(--color-fifa-blue)' : canPredict ? 'var(--color-border)' : 'var(--color-border-light)'}`,
              borderRadius: 4, padding: 0,
              background: canPredict ? 'var(--color-card)' : 'var(--color-bg)',
              color: 'var(--color-text)',
              outline: 'none', opacity: canPredict ? 1 : 0.35,
              cursor: canPredict ? 'text' : 'not-allowed',
            }}
          />
        )}
      </div>
    );
  };

  const handleCardClick = (e: React.MouseEvent) => {
    const tag = (e.target as HTMLElement).tagName;
    if (tag === 'INPUT' || tag === 'BUTTON') return;
    if (showActions) return; // don't open detail while editing
    setDetailOpen(true);
  };

  const matchDate = new Date(match.match_date);
  const dateStr = matchDate.toLocaleDateString('es', { day: 'numeric', month: 'short' });
  const timeStr = matchDate.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });

  return (
    <div style={{
      position: 'relative', width: MATCH_W,
      zIndex: showActions ? 10 : 1,
      ...(showActions ? { transform: 'scale(1.08)' } : {}),
      transition: 'transform 0.2s ease',
    }}>
      <div
        onClick={handleCardClick}
        style={{
          background: (justSaved || justUpdated) ? 'var(--color-success-bg)' : 'var(--color-card)',
          border: (justSaved || justUpdated)
            ? '1.5px solid var(--color-success)'
            : showActions
              ? '1.5px solid var(--color-fifa-blue)'
              : '1px solid var(--color-border)',
          borderRadius: showActions
            ? 'var(--radius-sm) var(--radius-sm) 0 0'
            : 'var(--radius-sm)',
          overflow: 'hidden',
          boxShadow: (justSaved || justUpdated)
            ? '0 0 0 2px var(--color-success-bg)'
            : showActions
              ? '0 2px 8px rgba(1,124,252,0.1)'
              : 'var(--shadow-sm)',
          cursor: showActions ? 'default' : 'pointer',
          transition: 'background 0.4s ease, border-color 0.4s ease, box-shadow 0.4s ease, border-radius 0.2s ease',
        }}
      >
        <div style={{
          padding: '3px 8px',
          fontSize: 9,
          color: 'var(--color-text-muted)',
          textAlign: 'center',
          borderBottom: '1px solid var(--color-border-light)',
          background: 'var(--color-bg)',
          fontWeight: 600,
          letterSpacing: '0.02em',
        }}>
          {dateStr} · {timeStr}
        </div>
        {renderTeamRow(true)}
        {renderTeamRow(false)}
      </div>

      {/* Action bar — attached below card like an extension */}
      {canPredict && showActions && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0,
          marginTop: -1,
          display: 'flex', gap: 4, padding: '5px 8px',
          background: 'var(--color-card)',
          borderLeft: '1.5px solid var(--color-fifa-blue)',
          borderRight: '1.5px solid var(--color-fifa-blue)',
          borderBottom: '1.5px solid var(--color-fifa-blue)',
          borderRadius: '0 0 var(--radius-sm) var(--radius-sm)',
          boxShadow: '0 4px 12px rgba(1,124,252,0.12)',
          zIndex: 11,
        }}>
          <button
            onClick={cancel}
            onMouseDown={(e) => e.stopPropagation()}
            style={{
              flex: 1, padding: '3px 0', borderRadius: 4,
              background: 'var(--color-bg)', color: 'var(--color-text-secondary)',
              border: '1px solid var(--color-border)', cursor: 'pointer',
              fontSize: 9, fontWeight: 600,
            }}
          >
            Cancelar
          </button>
          <button
            onClick={save}
            onMouseDown={(e) => e.stopPropagation()}
            disabled={saving || !hasChanges}
            style={{
              flex: 1, padding: '3px 0', borderRadius: 4,
              background: hasChanges ? 'var(--color-fifa-blue)' : 'var(--color-border)',
              color: '#fff',
              border: 'none', cursor: hasChanges ? 'pointer' : 'not-allowed',
              fontSize: 9, fontWeight: 700,
              opacity: saving ? 0.5 : 1,
            }}
          >
            {saving ? '...' : savedLs ? 'Actualizar' : 'Guardar'}
          </button>
        </div>
      )}

      {/* Saved confirmation — absolute overlay below card */}
      {justSaved && !hasChanges && !showActions && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0,
          padding: '4px 8px', textAlign: 'center',
          fontSize: 9, color: 'var(--color-success)', fontWeight: 600,
          background: 'var(--color-success-bg)',
          borderRadius: '0 0 6px 6px',
          border: '1px solid rgba(22,163,74,0.15)',
          borderTop: 'none',
          zIndex: 11,
        }}>
          Predicción guardada
        </div>
      )}

      {/* Points badge */}
      {played && (
        <div style={{
          position: 'absolute', top: -7, right: -5,
          background: (prediction?.points ?? 0) > 0 ? 'var(--color-success)' : 'var(--color-text-muted)',
          color: '#fff',
          fontSize: 9, fontWeight: 700, padding: '1px 5px',
          borderRadius: 99, border: '1.5px solid #fff',
        }}>
          +{prediction?.points ?? 0}
        </div>
      )}

      {detailOpen && createPortal(
        <MatchDetailModal match={match} prediction={prediction} onClose={() => setDetailOpen(false)} />,
        document.body,
      )}
    </div>
  );
});

// ─── Round column ────────────────────────────────────────────────────────────

function RoundCol({
  label, matches, predictions, onPredictionUpdate, h, collapsed, onToggle,
}: {
  label: string; matches: Match[]; predictions: UserMatch[];
  onPredictionUpdate: () => void; h: number; collapsed: boolean;
  onToggle: () => void;
}) {
  const allPlayed = matches.length > 0 && matches.every((m) => m.has_played);

  if (collapsed) {
    return (
      <div
        onClick={onToggle}
        style={{
          width: COLLAPSED_W, flexShrink: 0, cursor: 'pointer',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          paddingTop: HEADER_H, height: h + HEADER_H,
          justifyContent: 'center',
        }}
        title={`Expandir ${label}`}
      >
        <div style={{
          writingMode: 'vertical-rl', textOrientation: 'mixed',
          fontSize: 9, fontWeight: 700, textTransform: 'uppercase',
          letterSpacing: '0.05em', color: 'var(--color-text-muted)',
        }}>
          {label}
        </div>
        <FiChevronDown size={11} style={{ color: 'var(--color-text-muted)', marginTop: 6 }} />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
      <div
        onClick={allPlayed ? onToggle : undefined}
        style={{
          height: HEADER_H, display: 'flex', alignItems: 'center', gap: 3,
          fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
          letterSpacing: '0.06em', whiteSpace: 'nowrap',
          color: 'var(--color-text-muted)',
          cursor: allPlayed ? 'pointer' : 'default',
        }}
      >
        {label}
        {allPlayed && <FiChevronUp size={10} style={{ color: 'var(--color-text-muted)' }} />}
      </div>
      <div style={{
        height: h, display: 'flex', flexDirection: 'column',
        justifyContent: 'space-around', alignItems: 'center',
      }}>
        {matches.map((m) => (
          <BracketSlot
            key={m.id} match={m}
            prediction={predictions.find((p) => p.match_id === m.id)}
            onPredictionUpdate={onPredictionUpdate}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Mobile Bracket Slot ────────────────────────────────────────────────────

const MobileBracketSlot = memo(function MobileBracketSlot({
  match, prediction, onPredictionUpdate, highlighted = false,
}: { match: Match; prediction?: UserMatch; onPredictionUpdate: () => void; highlighted?: boolean }) {
  const { user } = useAuth();
  const savedLs = prediction?.local_score?.toString() ?? '';
  const savedVs = prediction?.visitor_score?.toString() ?? '';
  const [ls, setLs] = useState(savedLs);
  const [vs, setVs] = useState(savedVs);
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [justUpdated, setJustUpdated] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const prevData = useRef({
    lr: match.local_result, vr: match.visiting_result, hp: match.has_played,
    pls: prediction?.local_score, pvs: prediction?.visitor_score,
  });

  useEffect(() => { setLs(savedLs); setVs(savedVs); }, [savedLs, savedVs]);

  // Detect external updates (websocket): match results OR prediction changes
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

  const played = match.has_played;
  const isPast = new Date() >= new Date(match.match_date);
  const isLocked = played || isPast;
  const canPredict = !isLocked;
  const hasChanges = ls !== '' && vs !== '' && (ls !== savedLs || vs !== savedVs);
  const showActions = isEditing || hasChanges;

  const save = async () => {
    if (!user || !hasChanges || isLocked) return;
    setSaving(true);
    try {
      await updatePredictionApi(user.id, match.id, parseInt(ls), parseInt(vs));
      toast.success('Predicción actualizada');
      setJustSaved(true);
      setIsEditing(false);
      setTimeout(() => setJustSaved(false), 10000);
      onPredictionUpdate();
    } catch { toast.error('Error al guardar'); }
    finally { setSaving(false); }
  };

  const cancel = () => {
    setLs(savedLs);
    setVs(savedVs);
    setIsEditing(false);
  };

  const lCode = getCountryCode(match.local_team_id);
  const vCode = getCountryCode(match.visiting_team_id);
  const lWins = played && (match.local_result ?? -1) > (match.visiting_result ?? -1);
  const vWins = played && (match.visiting_result ?? -1) > (match.local_result ?? -1);

  const matchDate = new Date(match.match_date);
  const dateStr = matchDate.toLocaleDateString('es', { day: 'numeric', month: 'short' });
  const timeStr = matchDate.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });

  const handleCardClick = (e: React.MouseEvent) => {
    const tag = (e.target as HTMLElement).tagName;
    if (tag === 'INPUT' || tag === 'BUTTON') return;
    if (showActions) return;
    setDetailOpen(true);
  };

  const renderMobileTeamRow = (local: boolean) => {
    const teamId = local ? match.local_team_id : match.visiting_team_id;
    const code = local ? lCode : vCode;
    const winner = local ? lWins : vWins;
    const score = local ? ls : vs;
    const setScore = local ? setLs : setVs;
    const predScore = local ? savedLs : savedVs;

    return (
      <div key={local ? 'local' : 'visitor'} style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '8px 12px',
        borderBottom: local ? '1px solid var(--color-border-light)' : 'none',
        background: winner ? 'rgba(1,124,252,0.04)' : 'transparent',
        minHeight: 40,
      }}>
        {code
          ? <span className={`fi fis fi-${code}`} style={{ width: 22, height: 16, borderRadius: 3, flexShrink: 0, boxShadow: '0 0 0 1px rgba(0,0,0,0.08)' }} />
          : <span style={{ width: 22, height: 16, borderRadius: 3, background: 'var(--color-border)', flexShrink: 0, display: 'inline-block' }} />
        }
        <span style={{
          flex: 1, fontSize: 13,
          fontWeight: winner ? 700 : 500,
          color: winner ? 'var(--color-text)' : 'var(--color-text-secondary)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {local
            ? (match.local_team?.name || teamId || 'TBD')
            : (match.visiting_team?.name || teamId || 'TBD')}
        </span>
        {played ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{
              fontSize: 12, fontWeight: 700, minWidth: 22, textAlign: 'center',
              color: 'var(--color-fifa-blue)',
              background: 'var(--color-fifa-blue-light)',
              borderRadius: 5, padding: '2px 5px',
              lineHeight: 1.4,
            }}>
              {predScore || '-'}
            </span>
            <span style={{
              fontSize: 14, fontWeight: winner ? 800 : 600, minWidth: 24, textAlign: 'center',
              color: winner ? 'var(--color-text)' : 'var(--color-text-secondary)',
              background: winner ? 'rgba(0,23,58,0.08)' : 'var(--color-bg)',
              borderRadius: 5, padding: '2px 5px',
              lineHeight: 1.4,
            }}>
              {(local ? match.local_result : match.visiting_result) ?? '-'}
            </span>
          </div>
        ) : (
          <input
            type="text" inputMode="numeric" pattern="[0-9]*" maxLength={2} value={score}
            onChange={(e) => { setScore(e.target.value.replace(/\D/g, '').slice(0, 2)); setJustSaved(false); }}
            disabled={!canPredict}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onFocus={() => { if (canPredict) setIsEditing(true); }}
            style={{
              width: 34, height: 28, textAlign: 'center', fontSize: 14, fontWeight: 700,
              border: `1.5px solid ${hasChanges || isEditing ? 'var(--color-fifa-blue)' : canPredict ? 'var(--color-border)' : 'var(--color-border-light)'}`,
              borderRadius: 6, padding: 0,
              background: canPredict ? 'var(--color-card)' : 'var(--color-bg)',
              color: 'var(--color-text)',
              outline: 'none', opacity: canPredict ? 1 : 0.35,
              cursor: canPredict ? 'text' : 'not-allowed',
            }}
          />
        )}
      </div>
    );
  };

  return (
    <div style={{
      position: 'relative',
      zIndex: showActions ? 10 : 1,
      ...(showActions ? { transform: 'scale(1.03)' } : {}),
      transition: 'transform 0.2s ease',
    }}>
      <div
        onClick={handleCardClick}
        style={{
          background: (justSaved || justUpdated)
            ? 'var(--color-success-bg)'
            : highlighted
              ? 'var(--color-fifa-blue-light)'
              : 'var(--color-card)',
          border: (justSaved || justUpdated)
            ? '1.5px solid var(--color-success)'
            : highlighted
              ? '1.5px solid var(--color-fifa-blue)'
              : showActions
                ? '1.5px solid var(--color-fifa-blue)'
                : '1px solid var(--color-border)',
          borderRadius: 'var(--radius-sm)',
          overflow: 'hidden',
          boxShadow: (justSaved || justUpdated)
            ? '0 0 0 2px var(--color-success-bg)'
            : highlighted
              ? '0 0 0 2px var(--color-fifa-blue-light)'
              : showActions
                ? '0 6px 20px rgba(1,124,252,0.16)'
                : 'var(--shadow-sm)',
          cursor: showActions ? 'default' : 'pointer',
          transition: 'background 0.4s ease, border-color 0.4s ease, box-shadow 0.4s ease',
        }}
      >
        {/* Date header */}
        <div style={{
          padding: '4px 12px',
          fontSize: 10,
          color: 'var(--color-text-muted)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: '1px solid var(--color-border-light)',
          background: 'var(--color-bg)',
          fontWeight: 600,
          letterSpacing: '0.02em',
        }}>
          <span>{dateStr} · {timeStr}</span>
          {!showActions && <FiChevronRight size={12} style={{ color: 'var(--color-text-muted)' }} />}
        </div>

        {renderMobileTeamRow(true)}
        {renderMobileTeamRow(false)}

        {/* Action bar inside card */}
        {canPredict && showActions && (
          <div style={{
            display: 'flex', gap: 8, padding: '8px 12px',
            borderTop: '1px solid var(--color-border-light)',
            background: 'var(--color-bg)',
          }}>
            <button
              onClick={cancel}
              onMouseDown={(e) => e.stopPropagation()}
              style={{
                flex: 1, padding: '6px 0', borderRadius: 6,
                background: 'transparent', color: 'var(--color-text-secondary)',
                border: '1px solid var(--color-border)', cursor: 'pointer',
                fontSize: 12, fontWeight: 600,
              }}
            >
              Cancelar
            </button>
            <button
              onClick={save}
              onMouseDown={(e) => e.stopPropagation()}
              disabled={saving || !hasChanges}
              style={{
                flex: 1, padding: '6px 0', borderRadius: 6,
                background: hasChanges ? 'var(--color-fifa-blue)' : 'var(--color-border)',
                color: '#fff',
                border: 'none', cursor: hasChanges ? 'pointer' : 'not-allowed',
                fontSize: 12, fontWeight: 700,
                opacity: saving ? 0.5 : 1,
              }}
            >
              {saving ? 'Guardando...' : savedLs ? 'Actualizar' : 'Guardar'}
            </button>
          </div>
        )}

        {/* Saved confirmation inside card */}
        {justSaved && !hasChanges && !showActions && (
          <div style={{
            padding: '5px 12px', textAlign: 'center',
            fontSize: 11, color: 'var(--color-success)', fontWeight: 600,
            borderTop: '1px solid var(--color-border-light)',
            background: 'var(--color-success-bg)',
          }}>
            Predicción guardada
          </div>
        )}
      </div>

      {/* Points badge */}
      {played && (
        <div style={{
          position: 'absolute', top: -6, right: -4,
          background: (prediction?.points ?? 0) > 0 ? 'var(--color-success)' : 'var(--color-text-muted)',
          color: '#fff',
          fontSize: 10, fontWeight: 700, padding: '1px 6px',
          borderRadius: 99, border: '1.5px solid #fff',
        }}>
          +{prediction?.points ?? 0}
        </div>
      )}

      {detailOpen && createPortal(
        <MatchDetailModal match={match} prediction={prediction} onClose={() => setDetailOpen(false)} />,
        document.body,
      )}
    </div>
  );
});

// ─── Mobile Bracket Pair Connector ──────────────────────────────────────────

function BracketPairConnector({ cardCount }: { cardCount: number }) {
  const cardH = 97; // approximate height of each MobileBracketSlot card
  const gap = 6;
  const totalH = cardCount * cardH + (cardCount - 1) * gap;
  const midY = totalH / 2;
  const connW = 14;

  const d: string[] = [];
  for (let i = 0; i < cardCount; i++) {
    const y = i * (cardH + gap) + cardH / 2;
    d.push(`M${connW - 4} ${y} H${connW}`);
  }
  // Vertical line connecting all ticks
  const firstY = cardH / 2;
  const lastY = (cardCount - 1) * (cardH + gap) + cardH / 2;
  d.push(`M${connW - 4} ${firstY} V${lastY}`);
  // Arrow to the right from midpoint
  d.push(`M${connW - 4} ${midY} H2`);

  return (
    <svg
      width={connW}
      height={totalH}
      style={{ flexShrink: 0 }}
    >
      <path
        d={d.join(' ')}
        stroke="var(--color-border)"
        strokeWidth={1.5}
        fill="none"
        strokeLinecap="round"
      />
      <circle cx={2} cy={midY} r={2.5} fill="var(--color-fifa-blue)" />
    </svg>
  );
}

// ─── Phases ──────────────────────────────────────────────────────────────────
const KNOCKOUT_PHASES: MatchPhase[] = ['round_of_32', 'round_of_16', 'quarter', 'semi', 'third_place', 'final'];
const PHASE_SHORT: Record<string, string> = {
  round_of_32: 'Dieciseisavos', round_of_16: 'Octavos', quarter: 'Cuartos',
  semi: 'Semi', third_place: '3er Puesto', final: 'Final',
};
const COL_LABEL: Partial<Record<MatchPhase, string>> = {
  round_of_32: 'Dieciseisavos', round_of_16: 'Octavos', quarter: 'Cuartos',
  semi: 'Semifinal', final: 'Final', third_place: '3er Puesto',
};

// Bracket progression order for mobile navigation arrows
const PHASE_FLOW: MatchPhase[] = ['round_of_32', 'round_of_16', 'quarter', 'semi', 'final'];
const getPrevPhase = (p: MatchPhase): MatchPhase | null => {
  // 3rd place is a standalone match, not part of the bracket flow
  if (p === 'third_place') return null;
  const i = PHASE_FLOW.indexOf(p);
  return i > 0 ? PHASE_FLOW[i - 1] : null;
};
const getNextPhase = (p: MatchPhase): MatchPhase | null => {
  if (p === 'third_place') return null;
  const i = PHASE_FLOW.indexOf(p);
  return i >= 0 && i < PHASE_FLOW.length - 1 ? PHASE_FLOW[i + 1] : null;
};

// Phases ordered from center outward (what to collapse first when space is tight)
const COLLAPSE_PRIORITY: { side: 'left' | 'right'; phase: MatchPhase }[] = [
  { side: 'right', phase: 'round_of_32' },
  { side: 'left', phase: 'round_of_32' },
  { side: 'right', phase: 'round_of_16' },
  { side: 'left', phase: 'round_of_16' },
];

// ─── Main component ──────────────────────────────────────────────────────────

export default function BracketView({ predictions, onPredictionUpdate }: Props) {
  const [selectedPhase, setSelectedPhase] = useState<MatchPhase>('round_of_32');
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [highlightMatches, setHighlightMatches] = useState<Set<number>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);
  const matchRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeftRef = useRef(0);
  const hasDragged = useRef(false);

  const navigateToMatch = useCallback((targetPhase: MatchPhase, fromMatchIdx: number, direction: 'prev' | 'next') => {
    let targets: number[];
    if (direction === 'next') {
      // 2 matches converge into 1: match 0,1 → 0; match 2,3 → 1
      targets = [Math.floor(fromMatchIdx / 2)];
    } else {
      // 1 match expands to 2: match 0 → 0,1; match 1 → 2,3
      targets = [fromMatchIdx * 2, fromMatchIdx * 2 + 1];
    }

    setSelectedPhase(targetPhase);
    setHighlightMatches(new Set(targets));

    // Scroll to the first highlighted match after render
    requestAnimationFrame(() => {
      setTimeout(() => {
        const el = matchRefs.current.get(targets[0]);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 50);
    });

    // Clear highlight after animation
    setTimeout(() => setHighlightMatches(new Set()), 2200);
  }, []);

  const { data: matches = [] } = useQuery({
    queryKey: ['matches'],
    queryFn: () => getMatchesApi().then((r) => r.data),
  });

  const byPhase = useCallback((phase: MatchPhase) => matches.filter((m) => m.phase === phase), [matches]);
  const leftOf = (phase: MatchPhase) => { const a = byPhase(phase); return a.slice(0, Math.ceil(a.length / 2)); };
  const rightOf = (phase: MatchPhase) => { const a = byPhase(phase); return a.slice(Math.ceil(a.length / 2)); };

  // Smart collapse: only collapse completed phases that are far from center
  // and only if viewport can't fit everything
  useEffect(() => {
    if (matches.length === 0) return;
    const vw = window.innerWidth;
    // Full bracket width: 4 round cols * 2 sides + center + connectors
    const fullW = (MATCH_W * 9) + (CONN_W * 8) + 16; // approximate
    if (vw >= fullW) return; // everything fits, no collapse needed

    const auto: Record<string, boolean> = {};
    let savedWidth = 0;
    const needed = fullW - vw;

    for (const { side, phase } of COLLAPSE_PRIORITY) {
      if (savedWidth >= needed) break;
      const pm = byPhase(phase);
      // Only auto-collapse phases that are fully played
      if (pm.length > 0 && pm.every((m) => m.has_played)) {
        auto[`${side}_${phase}`] = true;
        savedWidth += MATCH_W + CONN_W - COLLAPSED_W;
      }
    }
    if (Object.keys(auto).length > 0) {
      setCollapsed(auto);
    }
  }, [matches, byPhase]);

  const toggle = useCallback((key: string) => {
    setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  // Grab-to-scroll — skip if target is interactive
  const onMouseDown = (e: React.MouseEvent) => {
    const tag = (e.target as HTMLElement).tagName;
    if (tag === 'INPUT' || tag === 'BUTTON') return;
    const el = scrollRef.current;
    if (!el) return;
    isDragging.current = true;
    hasDragged.current = false;
    startX.current = e.pageX - el.offsetLeft;
    scrollLeftRef.current = el.scrollLeft;
    el.style.cursor = 'grabbing';
    el.style.userSelect = 'none';
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || !scrollRef.current) return;
    const x = e.pageX - scrollRef.current.offsetLeft;
    const diff = x - startX.current;
    if (Math.abs(diff) > 3) hasDragged.current = true;
    scrollRef.current.scrollLeft = scrollLeftRef.current - diff;
  };
  const onMouseUp = () => {
    isDragging.current = false;
    if (scrollRef.current) {
      scrollRef.current.style.cursor = 'grab';
      scrollRef.current.style.userSelect = 'auto';
    }
  };

  const H = 720;
  const sfY = yOf(0, 1, H);
  const finalMatch = byPhase('final')[0];
  const thirdMatch = byPhase('third_place')[0];

  // Mobile
  const mobileMatches = byPhase(selectedPhase).sort(
    (a, b) => new Date(a.match_date).getTime() - new Date(b.match_date).getTime()
  );

  const isCollapsed = (side: string, phase: string) => !!collapsed[`${side}_${phase}`];

  const renderCol = (side: 'left' | 'right', phase: MatchPhase) => {
    const key = `${side}_${phase}`;
    const ms = side === 'left' ? leftOf(phase) : rightOf(phase);
    return (
      <RoundCol
        key={key} label={COL_LABEL[phase]!} matches={ms}
        predictions={predictions} onPredictionUpdate={onPredictionUpdate}
        h={H} collapsed={!!collapsed[key]} onToggle={() => toggle(key)}
      />
    );
  };

  const showConn = (side: 'left' | 'right', from: MatchPhase, to: MatchPhase) =>
    !isCollapsed(side, from) && !isCollapsed(side, to);

  return (
    <>
      {/* ── Desktop bracket ── */}
      <div
        ref={scrollRef}
        className="hidden xl:block"
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        style={{
          overflowX: 'auto', paddingBottom: 24, cursor: 'grab',
          scrollbarWidth: 'none',
        }}
      >
        <div style={{ display: 'inline-flex', alignItems: 'flex-start' }}>

          {/* LEFT: R32 → R16 → QF → SF */}
          {renderCol('left', 'round_of_32')}
          {showConn('left', 'round_of_32', 'round_of_16') && <ConvergeConnector fromN={8} toN={4} h={H} />}
          {renderCol('left', 'round_of_16')}
          {showConn('left', 'round_of_16', 'quarter') && <ConvergeConnector fromN={4} toN={2} h={H} />}
          {renderCol('left', 'quarter')}
          {!isCollapsed('left', 'quarter') && <ConvergeConnector fromN={2} toN={1} h={H} />}
          {renderCol('left', 'semi')}
          <LineConnector y={sfY} h={H} />

          {/* CENTER: Final + 3rd place */}
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0,
            width: MATCH_W + 16,
          }}>
            <div style={{
              height: HEADER_H, display: 'flex', alignItems: 'center',
              fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
              letterSpacing: '0.07em', color: 'var(--color-fifa-blue)',
            }}>Final</div>
            <div style={{ height: H, position: 'relative', width: MATCH_W }}>
              {finalMatch && (
                <div style={{ position: 'absolute', top: sfY - 36, left: 0, width: MATCH_W }}>
                  <BracketSlot match={finalMatch} prediction={predictions.find((p) => p.match_id === finalMatch.id)} onPredictionUpdate={onPredictionUpdate} />
                </div>
              )}
              <div style={{ position: 'absolute', top: sfY + 48, left: 0, right: 0, borderTop: '1px dashed var(--color-border)' }} />
              {thirdMatch && (
                <div style={{ position: 'absolute', top: sfY + 60, left: 0, width: MATCH_W }}>
                  <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-bronze)', marginBottom: 4, textAlign: 'center' }}>
                    {COL_LABEL.third_place}
                  </div>
                  <BracketSlot match={thirdMatch} prediction={predictions.find((p) => p.match_id === thirdMatch.id)} onPredictionUpdate={onPredictionUpdate} />
                </div>
              )}
            </div>
          </div>

          <LineConnector y={sfY} h={H} />

          {/* RIGHT: SF → QF → R16 → R32 */}
          {renderCol('right', 'semi')}
          {!isCollapsed('right', 'quarter') && <DivergeConnector fromN={1} toN={2} h={H} />}
          {renderCol('right', 'quarter')}
          {showConn('right', 'round_of_16', 'quarter') && <DivergeConnector fromN={2} toN={4} h={H} />}
          {renderCol('right', 'round_of_16')}
          {showConn('right', 'round_of_32', 'round_of_16') && <DivergeConnector fromN={4} toN={8} h={H} />}
          {renderCol('right', 'round_of_32')}
        </div>
      </div>

      {/* ── Mobile/Tablet: bracket-style tabbed phases ── */}
      <div className="xl:hidden">
        {/* Phase tabs */}
        <div className="flex overflow-x-auto" style={{ borderBottom: '2px solid var(--color-border-light)', marginBottom: 16, scrollbarWidth: 'none' }}>
          {KNOCKOUT_PHASES.map((phase) => {
            const active = selectedPhase === phase;
            if (!byPhase(phase).length) return null;
            return (
              <button key={phase} onClick={() => setSelectedPhase(phase)}
                className="flex-shrink-0 cursor-pointer border-none bg-transparent"
                style={{
                  padding: '10px 14px', fontSize: 13,
                  color: active ? 'var(--color-fifa-blue)' : 'var(--color-text-secondary)',
                  fontWeight: active ? 700 : 500,
                  borderBottom: active ? '2px solid var(--color-fifa-blue)' : '2px solid transparent',
                  marginBottom: -2, whiteSpace: 'nowrap', transition: 'color 0.15s ease',
                }}
              >
                {PHASE_SHORT[phase]}
              </button>
            );
          })}
        </div>

        {/* Phase header with stats */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 16, padding: '0 2px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              fontSize: 15, fontWeight: 700, color: 'var(--color-text)',
              letterSpacing: '-0.01em',
            }}>
              {COL_LABEL[selectedPhase]}
            </span>
            <span style={{
              fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 500,
            }}>
              {mobileMatches.length} partidos
            </span>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {(() => {
              const p = mobileMatches.filter((m) => m.has_played).length;
              const n = mobileMatches.length - p;
              return (
                <>
                  {n > 0 && <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 99, background: 'rgba(230,81,0,0.08)', color: '#E65100' }}>{n} pend.</span>}
                  {p > 0 && <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 99, background: 'var(--color-success-bg)', color: 'var(--color-success)' }}>{p} jugados</span>}
                </>
              );
            })()}
          </div>
        </div>

        {mobileMatches.length === 0 ? (
          <div style={{
            padding: 40, textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 13,
            background: 'var(--color-card)', border: '1px solid var(--color-border-light)',
            borderRadius: 'var(--radius-md)',
          }}>
            No hay partidos en esta fase
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {(() => {
              // Group matches in pairs for bracket visualization
              const pairSize = selectedPhase === 'final' || selectedPhase === 'third_place' ? 1 : 2;
              const pairs: Match[][] = [];
              for (let i = 0; i < mobileMatches.length; i += pairSize) {
                pairs.push(mobileMatches.slice(i, i + pairSize));
              }

              const prevPhase = getPrevPhase(selectedPhase);
              const nextPhase = getNextPhase(selectedPhase);
              const hasPrev = prevPhase && byPhase(prevPhase).length > 0;
              const hasNext = nextPhase && byPhase(nextPhase).length > 0;

              // Clear refs for this render
              matchRefs.current.clear();

              // Global match index counter across all pairs
              let globalMatchIdx = 0;

              return pairs.map((pair, pairIdx) => (
                <div key={pairIdx}>
                  {/* Pair label */}
                  {pairSize > 1 && (
                    <div style={{
                      fontSize: 9, fontWeight: 700, textTransform: 'uppercase',
                      letterSpacing: '0.08em', color: 'var(--color-text-muted)',
                      marginBottom: 6, paddingLeft: 2,
                    }}>
                      Llave {pairIdx + 1}
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'stretch', gap: 0 }}>
                    {/* Bracket connector */}
                    {pair.length > 1 && (
                      <div style={{
                        display: 'flex', alignItems: 'center',
                        flexShrink: 0, width: 16, position: 'relative',
                      }}>
                        <BracketPairConnector cardCount={pair.length} />
                      </div>
                    )}

                    {/* Match cards with per-match arrows */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
                      {pair.map((m) => {
                        const matchIdx = globalMatchIdx++;
                        const isHL = highlightMatches.has(matchIdx);

                        return (
                          <div
                            key={m.id}
                            style={{ display: 'flex', alignItems: 'center', gap: 0 }}
                          >
                            {/* ← Previous phase */}
                            {hasPrev ? (
                              <button
                                onClick={() => navigateToMatch(prevPhase, matchIdx, 'prev')}
                                style={{
                                  width: 26, height: 26, flexShrink: 0,
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  background: 'var(--color-card)',
                                  border: '1px solid var(--color-border)',
                                  borderRadius: '50%',
                                  cursor: 'pointer',
                                  color: 'var(--color-text-secondary)',
                                  marginRight: 4,
                                  boxShadow: 'var(--shadow-sm)',
                                }}
                                title={`Ver ${PHASE_SHORT[prevPhase]}`}
                              >
                                <FiChevronLeft size={13} />
                              </button>
                            ) : (
                              <div style={{ width: 0, flexShrink: 0 }} />
                            )}

                            {/* Card */}
                            <div
                              ref={(el) => { if (el) matchRefs.current.set(matchIdx, el); }}
                              style={{ flex: 1, minWidth: 0 }}
                            >
                              <MobileBracketSlot
                                match={m}
                                prediction={predictions.find((p) => p.match_id === m.id)}
                                onPredictionUpdate={onPredictionUpdate}
                                highlighted={isHL}
                              />
                            </div>

                            {/* → Next phase */}
                            {hasNext ? (
                              <button
                                onClick={() => navigateToMatch(nextPhase, matchIdx, 'next')}
                                style={{
                                  width: 26, height: 26, flexShrink: 0,
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  background: 'var(--color-card)',
                                  border: '1px solid var(--color-border)',
                                  borderRadius: '50%',
                                  cursor: 'pointer',
                                  color: 'var(--color-text-secondary)',
                                  marginLeft: 4,
                                  boxShadow: 'var(--shadow-sm)',
                                }}
                                title={`Ver ${PHASE_SHORT[nextPhase]}`}
                              >
                                <FiChevronRight size={13} />
                              </button>
                            ) : (
                              <div style={{ width: 0, flexShrink: 0 }} />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ));
            })()}
          </div>
        )}
      </div>
    </>
  );
}
