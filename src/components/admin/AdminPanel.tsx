import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getMatchesApi, updateMatchResultApi } from '../../api/matches';
import { getGroupsApi } from '../../api/teams';
import { PHASE_LABELS } from '../../utils/scoring';
import { getCountryCode } from '../../utils/flags';
import type { Match } from '../../types';

const PHASES = Object.keys(PHASE_LABELS);

function Flag({ teamId, size = 26 }: { teamId: string | null; size?: number }) {
  const code = getCountryCode(teamId);
  const h = Math.round(size * 0.72);
  if (!code) return <span style={{ width: size, height: h, borderRadius: 3, background: 'var(--color-border)', display: 'inline-block', flexShrink: 0 }} />;
  return <span className={`fi fis fi-${code}`} style={{ width: size, height: h, borderRadius: 3, flexShrink: 0, boxShadow: '0 0 0 1px rgba(0,0,0,0.08)' }} />;
}

function AdminMatchRow({ match, onSave }: { match: Match; onSave: () => void }) {
  const [local, setLocal] = useState('');
  const [visiting, setVisiting] = useState('');
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  const played = match.has_played;
  const hasInputs = local !== '' && visiting !== '';

  const handleSubmit = async () => {
    if (!hasInputs) return;
    setSaving(true);
    try {
      await updateMatchResultApi(match.id, parseInt(local), parseInt(visiting));
      toast.success(`Resultado registrado: ${match.local_team?.name || 'TBD'} ${local} - ${visiting} ${match.visiting_team?.name || 'TBD'}`);
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 10000);
      onSave();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al registrar resultado');
    } finally {
      setSaving(false);
    }
  };

  const dateStr = new Date(match.match_date).toLocaleDateString('es-CO', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  });
  const groupLabel = match.group_code ? `G${match.group_code}` : '';

  const SaveButton = () => {
    if (played) return null;
    if (hasInputs) {
      return (
        <button onClick={handleSubmit} disabled={saving} style={{
          width: 22, height: 22, borderRadius: '50%',
          background: 'var(--color-fifa-blue)', color: '#fff',
          border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 700,
          opacity: saving ? 0.5 : 1,
        }}>
          {saving ? '·' : '✓'}
        </button>
      );
    }
    return null;
  };

  return (
    <div
      style={{
        padding: '10px 16px',
        borderBottom: '1px solid var(--color-border-light)',
        transition: 'background 0.5s ease',
        background: justSaved ? 'var(--color-success-bg)' : 'transparent',
        borderLeft: justSaved
          ? '3px solid var(--color-success)'
          : `3px solid ${played ? '#16A34A' : 'transparent'}`,
      }}
      onMouseEnter={(e) => { if (!justSaved) e.currentTarget.style.background = 'var(--color-bg)'; }}
      onMouseLeave={(e) => { if (!justSaved) e.currentTarget.style.background = 'transparent'; }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>

        {/* Date + Group */}
        <div style={{ width: 72, flexShrink: 0 }}>
          <div style={{ fontSize: 10, color: 'var(--color-text-muted)', lineHeight: 1.4 }}>{dateStr}</div>
          {groupLabel && (
            <span style={{
              fontSize: 8, fontWeight: 700, color: '#fff',
              background: 'var(--color-primary)',
              padding: '1px 4px', borderRadius: 3, marginTop: 2, display: 'inline-block',
            }}>
              {groupLabel}
            </span>
          )}
        </div>

        {/* Matchup */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, minWidth: 0 }}>
          <span className="hidden sm:inline" style={{
            fontSize: 12, fontWeight: 600, color: 'var(--color-text)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            textAlign: 'right', flex: 1, minWidth: 0,
          }}>
            {match.local_team?.name || 'TBD'}
          </span>
          <span className="sm:hidden" style={{
            fontSize: 11, fontWeight: 700, color: 'var(--color-text)',
            whiteSpace: 'nowrap',
          }}>
            {match.local_team_id || 'TBD'}
          </span>
          <Flag teamId={match.local_team_id} size={22} />

          {played ? (
            /* Played: score flows naturally centered */
            <span style={{
              fontSize: 15, fontWeight: 800, color: 'var(--color-text)',
              fontVariantNumeric: 'tabular-nums', letterSpacing: 1, flexShrink: 0,
            }}>
              {match.local_result} - {match.visiting_result}
            </span>
          ) : (
            /* Pending: inputs + VS */
            <>
              <input
                type="text" inputMode="numeric" pattern="[0-9]*" maxLength={2} value={local}
                onChange={(e) => { setLocal(e.target.value.replace(/\D/g, '').slice(0, 2)); setJustSaved(false); }}
                style={{
                  width: 30, height: 28, textAlign: 'center', fontSize: 13, fontWeight: 700,
                  background: 'var(--color-card)', color: 'var(--color-text)',
                  border: `1.5px solid ${hasInputs ? 'var(--color-fifa-blue)' : 'var(--color-border)'}`,
                  borderRadius: 6, outline: 'none', flexShrink: 0,
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--color-fifa-blue)'}
                onBlur={(e) => e.target.style.borderColor = hasInputs ? 'var(--color-fifa-blue)' : 'var(--color-border)'}
              />
              <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                <span style={{
                  display: 'inline-block', width: 22, height: 22, lineHeight: '22px',
                  borderRadius: '50%', background: 'var(--color-primary)',
                  color: 'var(--color-fifa-teal)', fontSize: 7, fontWeight: 800,
                  textAlign: 'center',
                }}>VS</span>
                <SaveButton />
              </div>
              <input
                type="text" inputMode="numeric" pattern="[0-9]*" maxLength={2} value={visiting}
                onChange={(e) => { setVisiting(e.target.value.replace(/\D/g, '').slice(0, 2)); setJustSaved(false); }}
                style={{
                  width: 30, height: 28, textAlign: 'center', fontSize: 13, fontWeight: 700,
                  background: 'var(--color-card)', color: 'var(--color-text)',
                  border: `1.5px solid ${hasInputs ? 'var(--color-fifa-blue)' : 'var(--color-border)'}`,
                  borderRadius: 6, outline: 'none', flexShrink: 0,
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--color-fifa-blue)'}
                onBlur={(e) => e.target.style.borderColor = hasInputs ? 'var(--color-fifa-blue)' : 'var(--color-border)'}
              />
            </>
          )}

          <Flag teamId={match.visiting_team_id} size={22} />
          <span className="hidden sm:inline" style={{
            fontSize: 12, fontWeight: 600, color: 'var(--color-text)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            flex: 1, minWidth: 0,
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

        {/* Status badge */}
        <div style={{ flexShrink: 0, width: 52, textAlign: 'right' }}>
          {played && (
            <span style={{
              fontSize: 9, fontWeight: 600, padding: '2px 7px',
              borderRadius: 99, background: 'var(--color-success-bg)', color: 'var(--color-success)',
            }}>
              Jugado
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminPanel() {
  const queryClient = useQueryClient();
  const ALL_KEY = '__ALL__';
  const [selectedPhase, setSelectedPhase] = useState('group');
  const [selectedGroup, setSelectedGroup] = useState<string>(ALL_KEY);

  const { data: matches } = useQuery({
    queryKey: ['matches', selectedPhase],
    queryFn: () => getMatchesApi(selectedPhase).then((r) => r.data),
  });

  const { data: groups } = useQuery({
    queryKey: ['groups'],
    queryFn: () => getGroupsApi().then((r) => r.data),
  });

  const handleSaved = () => queryClient.invalidateQueries({ queryKey: ['matches'] });

  const sortByDate = (a: Match, b: Match) =>
    new Date(a.match_date).getTime() - new Date(b.match_date).getTime();

  const displayMatches = selectedPhase === 'group' && selectedGroup !== ALL_KEY
    ? [...(matches || [])].filter((m) => m.group_code === selectedGroup).sort(sortByDate)
    : [...(matches || [])].sort(sortByDate);

  const pendingCount = displayMatches.filter((m) => !m.has_played).length;
  const playedCount = displayMatches.filter((m) => m.has_played).length;

  return (
    <div>
      <h2 className="text-2xl font-bold" style={{ color: 'var(--color-text)', marginBottom: 24 }}>
        Administrar Resultados
      </h2>

      {/* Phase tabs */}
      <div style={{ borderBottom: '2px solid var(--color-border-light)', marginBottom: 24 }}>
        <div className="flex overflow-x-auto" style={{ scrollbarWidth: 'none', gap: 4 }}>
          {PHASES.map((phase) => {
            const active = selectedPhase === phase;
            return (
              <button
                key={phase}
                onClick={() => { setSelectedPhase(phase); if (phase === 'group') setSelectedGroup(ALL_KEY); }}
                style={{
                  padding: '12px 16px', fontSize: 13,
                  fontWeight: active ? 700 : 500,
                  color: active ? 'var(--color-fifa-blue)' : 'var(--color-text-secondary)',
                  borderBottom: active ? '2px solid var(--color-fifa-blue)' : '2px solid transparent',
                  marginBottom: -2,
                  background: 'none', border: 'none', cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'color 0.15s ease',
                }}
                onMouseEnter={(e) => { if (!active) e.currentTarget.style.color = 'var(--color-text)'; }}
                onMouseLeave={(e) => { if (!active) e.currentTarget.style.color = active ? 'var(--color-fifa-blue)' : 'var(--color-text-secondary)'; }}
              >
                {PHASE_LABELS[phase]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Group sub-tabs (only for group phase) */}
      {selectedPhase === 'group' && (
        <div style={{ borderBottom: '2px solid var(--color-border-light)', marginBottom: 20 }}>
          <div className="flex overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
            {/* "Todos" tab */}
            <button
              onClick={() => setSelectedGroup(ALL_KEY)}
              style={{
                padding: '8px 14px', fontSize: 13,
                fontWeight: selectedGroup === ALL_KEY ? 700 : 500,
                color: selectedGroup === ALL_KEY ? 'var(--color-fifa-blue)' : 'var(--color-text-secondary)',
                borderBottom: selectedGroup === ALL_KEY ? '2px solid var(--color-fifa-blue)' : '2px solid transparent',
                marginBottom: -2,
                background: 'none', border: 'none', cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              Todos
            </button>
            {/* Divider */}
            <div style={{ width: 1, margin: '6px 4px', background: 'var(--color-border)', flexShrink: 0 }} />
            {(groups || []).map((g) => {
              const active = selectedGroup === g.id;
              return (
                <button
                  key={g.id}
                  onClick={() => setSelectedGroup(g.id)}
                  style={{
                    padding: '8px 14px', fontSize: 13,
                    fontWeight: active ? 700 : 500,
                    color: active ? 'var(--color-fifa-blue)' : 'var(--color-text-secondary)',
                    borderBottom: active ? '2px solid var(--color-fifa-blue)' : '2px solid transparent',
                    marginBottom: -2,
                    background: 'none', border: 'none', cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Grupo {g.id}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Stats bar */}
      <div className="flex items-center" style={{ gap: 12, marginBottom: 16 }}>
        <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
          {displayMatches.length} partidos
        </span>
        {pendingCount > 0 && (
          <span style={{
            fontSize: 11, fontWeight: 600, padding: '2px 10px',
            borderRadius: 99, background: 'var(--color-warning)', color: '#fff',
          }}>
            {pendingCount} pendientes
          </span>
        )}
        {playedCount > 0 && (
          <span style={{
            fontSize: 11, fontWeight: 600, padding: '2px 10px',
            borderRadius: 99, background: 'var(--color-success-bg)', color: 'var(--color-success)',
          }}>
            {playedCount} jugados
          </span>
        )}
      </div>

      {/* Matches — 2-col grid on desktop, single list on mobile */}
      {displayMatches.length === 0 ? (
        <div style={{
          padding: 40, textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 13,
          background: 'var(--color-card)', border: '1px solid var(--color-border-light)',
          borderRadius: 'var(--radius-md)',
        }}>
          No hay partidos en esta fase
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2" style={{ gap: 12 }}>
          {displayMatches.map((match) => (
            <div key={match.id} style={{
              background: 'var(--color-card)',
              border: '1px solid var(--color-border-light)',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-sm)',
              overflow: 'hidden',
            }}>
              <AdminMatchRow match={match} onSave={handleSaved} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
