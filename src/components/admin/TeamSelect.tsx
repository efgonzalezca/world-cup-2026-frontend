import { useQuery } from '@tanstack/react-query';
import { getTeamsApi } from '../../api/teams';
import type { Team } from '../../types';

interface TeamSelectProps {
  value: string | null;
  onChange: (teamId: string | null) => void;
  excludeTeamId?: string | null;
  disabled?: boolean;
  eliminated?: Set<string>;
  candidates?: Set<string> | null;
}

export default function TeamSelect({ value, onChange, excludeTeamId, disabled, eliminated, candidates }: TeamSelectProps) {
  const { data: teams = [] } = useQuery({
    queryKey: ['teams'],
    queryFn: () => getTeamsApi().then((r) => r.data),
  });

  const allowed = candidates ? new Set(candidates) : null;
  if (allowed && value) allowed.add(value);

  const selectable = teams.filter((t) => t.id !== excludeTeamId && (!allowed || allowed.has(t.id)));
  const byName = (a: Team, b: Team) => a.name.localeCompare(b.name);

  const aliveTeams = selectable.filter((t) => !eliminated?.has(t.id)).sort(byName);
  const eliminatedTeams = eliminated
    ? selectable.filter((t) => eliminated.has(t.id)).sort(byName)
    : [];

  const renderOption = (t: Team) => (
    <option key={t.id} value={t.id}>
      {t.id} — {t.name}
    </option>
  );

  return (
    <select
      value={value ?? ''}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value === '' ? null : e.target.value)}
      style={{
        height: 28, minWidth: 0, maxWidth: '100%', flex: 1,
        fontSize: 12, fontWeight: 600,
        background: 'var(--color-card)', color: 'var(--color-text)',
        border: '1.5px solid var(--color-border)', borderRadius: 6,
        padding: '0 6px', outline: 'none', cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <option value="">— Sin asignar —</option>
      {eliminatedTeams.length > 0 ? (
        <>
          <optgroup label="Vivos">{aliveTeams.map(renderOption)}</optgroup>
          <optgroup label="Eliminados">{eliminatedTeams.map(renderOption)}</optgroup>
        </>
      ) : (
        aliveTeams.map(renderOption)
      )}
    </select>
  );
}