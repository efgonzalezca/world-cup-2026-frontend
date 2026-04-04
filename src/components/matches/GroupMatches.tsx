import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getMatchesApi } from '../../api/matches';
import { getGroupsApi } from '../../api/teams';
import MatchCard from './MatchCard';
import MatchRow from './MatchRow';
import type { UserMatch } from '../../types';

interface Props {
  predictions: UserMatch[];
  onPredictionUpdate: () => void;
}

const ALL_KEY = '__ALL__';

export default function GroupMatches({ predictions, onPredictionUpdate }: Props) {
  const [selectedGroup, setSelectedGroup] = useState<string>('A');

  const { data: groups } = useQuery({
    queryKey: ['groups'],
    queryFn: () => getGroupsApi().then((r) => r.data),
  });

  const { data: matches } = useQuery({
    queryKey: ['matches', 'group'],
    queryFn: () => getMatchesApi('group').then((r) => r.data),
  });

  const isAll = selectedGroup === ALL_KEY;
  const sortByDate = (a: { match_date: string }, b: { match_date: string }) =>
    new Date(a.match_date).getTime() - new Date(b.match_date).getTime();
  const filteredMatches = isAll
    ? [...(matches || [])].sort(sortByDate)
    : [...(matches || [])].filter((m) => m.group_code === selectedGroup).sort(sortByDate);
  const currentGroup = groups?.find((g) => g.id === selectedGroup);

  // "Todos" is just filteredMatches (already sorted by date, flat list)

  return (
    <div>
      {/* Group selector tabs + "Todos" */}
      <div
        className="flex overflow-x-auto"
        style={{
          borderBottom: '2px solid var(--color-border-light)',
          marginBottom: 24,
          scrollbarWidth: 'none',
        }}
      >
        {/* "Todos" tab first */}
        <button
          onClick={() => setSelectedGroup(ALL_KEY)}
          className="flex-shrink-0 cursor-pointer border-none bg-transparent font-medium"
          style={{
            padding: '10px 16px',
            fontSize: 13,
            color: isAll ? 'var(--color-fifa-blue)' : 'var(--color-text-secondary)',
            fontWeight: isAll ? 700 : 500,
            borderBottom: isAll ? '2px solid var(--color-fifa-blue)' : '2px solid transparent',
            marginBottom: -2,
            whiteSpace: 'nowrap',
            transition: 'color 0.15s ease',
          }}
          onMouseEnter={(e) => { if (!isAll) e.currentTarget.style.color = 'var(--color-text)'; }}
          onMouseLeave={(e) => { if (!isAll) e.currentTarget.style.color = 'var(--color-text-secondary)'; }}
        >
          Todos
        </button>

        {/* Divider */}
        <div style={{
          width: 1,
          margin: '8px 4px',
          background: 'var(--color-border)',
          flexShrink: 0,
        }} />

        {/* Individual group tabs */}
        {(groups || []).map((g) => {
          const active = selectedGroup === g.id;
          return (
            <button
              key={g.id}
              onClick={() => setSelectedGroup(g.id)}
              className="flex-shrink-0 cursor-pointer border-none bg-transparent font-medium"
              style={{
                padding: '10px 14px',
                fontSize: 13,
                color: active ? 'var(--color-fifa-blue)' : 'var(--color-text-secondary)',
                fontWeight: active ? 700 : 500,
                borderBottom: active ? '2px solid var(--color-fifa-blue)' : '2px solid transparent',
                marginBottom: -2,
                whiteSpace: 'nowrap',
                transition: 'color 0.15s ease',
              }}
              onMouseEnter={(e) => { if (!active) e.currentTarget.style.color = 'var(--color-text)'; }}
              onMouseLeave={(e) => { if (!active) e.currentTarget.style.color = 'var(--color-text-secondary)'; }}
            >
              Grupo {g.id}
            </button>
          );
        })}
      </div>

      {/* ── Individual group view ── */}
      {!isAll && (
        <>
          {/* Group teams strip */}
          {currentGroup && (
            <div className="flex items-center flex-wrap" style={{ gap: 6, marginBottom: 24 }}>
              <span
                className="text-xs font-bold uppercase"
                style={{ color: 'var(--color-text-muted)', letterSpacing: '0.08em', marginRight: 4 }}
              >
                {currentGroup.name}:
              </span>
              {currentGroup.teams?.map((t) => (
                <span
                  key={t.id}
                  className="text-xs font-medium"
                  style={{
                    padding: '3px 10px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--color-card)',
                    color: 'var(--color-text-secondary)',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  {t.name}
                </span>
              ))}
            </div>
          )}

          {/* Match grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filteredMatches.map((match) => (
              <MatchCard
                key={match.id}
                match={match}
                prediction={predictions.find((p) => p.match_id === match.id)}
                onPredictionUpdate={onPredictionUpdate}
              />
            ))}
          </div>
        </>
      )}

      {/* ── "Todos" view: 2-col grid on desktop, single list on mobile ── */}
      {isAll && (
        filteredMatches.length === 0 ? (
          <div style={{
            padding: 40, textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 13,
            background: 'var(--color-card)', border: '1px solid var(--color-border-light)',
            borderRadius: 'var(--radius-md)',
          }}>
            No hay partidos
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2" style={{ gap: 12 }}>
            {filteredMatches.map((match) => (
              <div key={match.id} style={{
                background: 'var(--color-card)',
                border: '1px solid var(--color-border-light)',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-sm)',
                overflow: 'hidden',
              }}>
                <MatchRow
                  match={match}
                  prediction={predictions.find((p) => p.match_id === match.id)}
                  onPredictionUpdate={onPredictionUpdate}
                />
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
