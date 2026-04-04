import { useQuery } from '@tanstack/react-query';
import { useState, useRef, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { getMatchesApi } from '../../api/matches';
import type { Match, UserMatch, MatchPhase } from '../../types';
import { updatePredictionApi } from '../../api/users';
import { useAuth } from '../../context/AuthContext';
import { getCountryCode } from '../../utils/flags';
import MatchRow from './MatchRow';
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

function BracketSlot({
  match, prediction, onPredictionUpdate,
}: { match: Match; prediction?: UserMatch; onPredictionUpdate: () => void }) {
  const { user } = useAuth();
  const savedLs = prediction?.local_score?.toString() ?? '';
  const savedVs = prediction?.visitor_score?.toString() ?? '';
  const [ls, setLs] = useState(savedLs);
  const [vs, setVs] = useState(savedVs);
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);

  useEffect(() => { setLs(savedLs); setVs(savedVs); }, [savedLs, savedVs]);

  const played = match.has_played;
  const isPast = new Date() >= new Date(match.match_date);
  const isLocked = played || isPast;
  const canPredict = !isLocked;
  const hasChanges = ls !== '' && vs !== '' && (ls !== savedLs || vs !== savedVs);

  const save = async () => {
    if (!user || !hasChanges || isLocked) return;
    setSaving(true);
    try {
      await updatePredictionApi(user.id, match.id, parseInt(ls), parseInt(vs));
      toast.success('Predicción actualizada');
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 10000);
      onPredictionUpdate();
    } catch { toast.error('Error al guardar'); }
    finally { setSaving(false); }
  };

  const lCode = getCountryCode(match.local_team_id);
  const vCode = getCountryCode(match.visiting_team_id);
  const lWins = played && (match.local_result ?? -1) > (match.visiting_result ?? -1);
  const vWins = played && (match.visiting_result ?? -1) > (match.local_result ?? -1);

  const TeamRow = ({ local }: { local: boolean }) => {
    const teamId = local ? match.local_team_id : match.visiting_team_id;
    const code = local ? lCode : vCode;
    const winner = local ? lWins : vWins;
    const score = local ? ls : vs;
    const setScore = local ? setLs : setVs;
    const predScore = local ? savedLs : savedVs;

    return (
      <div style={{
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
          {teamId ?? 'TBD'}
        </span>
        {played ? (
          <>
            <span style={{
              fontSize: 11, fontWeight: 600, minWidth: 16, textAlign: 'center',
              color: 'var(--color-text-muted)',
            }}>
              {predScore || '-'}
            </span>
            <span style={{
              fontSize: 12, fontWeight: winner ? 800 : 600, minWidth: 16, textAlign: 'center',
              color: winner ? 'var(--color-text)' : 'var(--color-text-muted)',
              borderLeft: '1px solid var(--color-border-light)', paddingLeft: 5,
            }}>
              {(local ? match.local_result : match.visiting_result) ?? '-'}
            </span>
          </>
        ) : (
          <input
            type="text" inputMode="numeric" pattern="[0-9]*" maxLength={2} value={score}
            onChange={(e) => { setScore(e.target.value.replace(/\D/g, '').slice(0, 2)); setJustSaved(false); }}
            disabled={!canPredict}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            style={{
              width: 28, height: 24, textAlign: 'center', fontSize: 12, fontWeight: 700,
              border: `1.5px solid ${hasChanges ? 'var(--color-fifa-blue)' : canPredict ? 'var(--color-border)' : 'var(--color-border-light)'}`,
              borderRadius: 4, padding: 0,
              background: canPredict ? 'var(--color-card)' : 'var(--color-bg)',
              color: 'var(--color-text)',
              outline: 'none', opacity: canPredict ? 1 : 0.35,
              cursor: canPredict ? 'text' : 'not-allowed',
            }}
            onFocus={(e) => { if (canPredict) e.target.style.borderColor = 'var(--color-fifa-blue)'; }}
            onBlur={(e) => { if (canPredict) e.target.style.borderColor = hasChanges ? 'var(--color-fifa-blue)' : 'var(--color-border)'; }}
          />
        )}
      </div>
    );
  };

  const handleCardClick = (e: React.MouseEvent) => {
    const tag = (e.target as HTMLElement).tagName;
    if (tag === 'INPUT' || tag === 'BUTTON') return;
    setDetailOpen(true);
  };

  return (
    <div style={{ position: 'relative', width: MATCH_W }}>
      <div
        onClick={handleCardClick}
        style={{
          background: 'var(--color-card)',
          border: justSaved ? '1.5px solid var(--color-success)' : '1px solid var(--color-border)',
          borderRadius: 'var(--radius-sm)',
          overflow: 'hidden',
          boxShadow: justSaved ? '0 0 0 2px var(--color-success-bg)' : 'var(--shadow-sm)',
          cursor: 'pointer',
          transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
        }}
      >
        <TeamRow local={true} />
        <TeamRow local={false} />
      </div>

      {/* Save button — full width below card */}
      {canPredict && hasChanges && (
        <button
          onClick={save}
          onMouseDown={(e) => e.stopPropagation()}
          disabled={saving}
          style={{
            width: '100%', marginTop: 3,
            padding: '4px 0', borderRadius: 4,
            background: 'var(--color-fifa-blue)', color: '#fff',
            border: 'none', cursor: 'pointer',
            fontSize: 10, fontWeight: 700,
            opacity: saving ? 0.5 : 1,
            transition: 'opacity 0.15s ease',
          }}
        >
          {saving ? 'Guardando...' : savedLs ? 'Actualizar' : 'Guardar'}
        </button>
      )}

      {/* Saved confirmation */}
      {justSaved && !hasChanges && (
        <div style={{
          marginTop: 3, textAlign: 'center',
          fontSize: 9, color: 'var(--color-success)', fontWeight: 600,
        }}>
          Predicción guardada
        </div>
      )}

      {/* Points badge */}
      {played && prediction && prediction.points > 0 && (
        <div style={{
          position: 'absolute', top: -7, right: -5,
          background: 'var(--color-success)', color: '#fff',
          fontSize: 9, fontWeight: 700, padding: '1px 5px',
          borderRadius: 99, border: '1.5px solid #fff',
        }}>
          +{prediction.points}
        </div>
      )}

      {detailOpen && <MatchDetailModal match={match} prediction={prediction} onClose={() => setDetailOpen(false)} />}
    </div>
  );
}

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
  const scrollRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeftRef = useRef(0);
  const hasDragged = useRef(false);

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

  const H = 600;
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

      {/* ── Mobile/Tablet: tabbed phases ── */}
      <div className="xl:hidden">
        <div className="flex overflow-x-auto" style={{ borderBottom: '2px solid var(--color-border-light)', marginBottom: 20, scrollbarWidth: 'none' }}>
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
                onMouseEnter={(e) => { if (!active) e.currentTarget.style.color = 'var(--color-text)'; }}
                onMouseLeave={(e) => { if (!active) e.currentTarget.style.color = active ? 'var(--color-fifa-blue)' : 'var(--color-text-secondary)'; }}
              >
                {PHASE_SHORT[phase]}
              </button>
            );
          })}
        </div>

        <div className="flex items-center" style={{ gap: 10, marginBottom: 14 }}>
          <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{mobileMatches.length} partidos</span>
          {(() => {
            const p = mobileMatches.filter((m) => m.has_played).length;
            const n = mobileMatches.length - p;
            return (
              <>
                {n > 0 && <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 10px', borderRadius: 99, background: 'rgba(230,81,0,0.1)', color: '#E65100' }}>{n} pendientes</span>}
                {p > 0 && <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 10px', borderRadius: 99, background: 'var(--color-success-bg)', color: 'var(--color-success)' }}>{p} jugados</span>}
              </>
            );
          })()}
        </div>

        {mobileMatches.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 13, background: 'var(--color-card)', border: '1px solid var(--color-border-light)', borderRadius: 'var(--radius-md)' }}>
            No hay partidos en esta fase
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2" style={{ gap: 12 }}>
            {mobileMatches.map((m) => (
              <div key={m.id} style={{ background: 'var(--color-card)', border: '1px solid var(--color-border-light)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
                <MatchRow match={m} prediction={predictions.find((p) => p.match_id === m.id)} onPredictionUpdate={onPredictionUpdate} />
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
