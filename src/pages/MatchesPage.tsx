import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../hooks/useSocket';
import GroupMatches from '../components/matches/GroupMatches';
import BracketView from '../components/matches/BracketView';
import type { UserMatch } from '../types';
import client from '../api/client';

export default function MatchesPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [view, setView] = useState<'groups' | 'bracket'>('groups');

  const { data: predictions = [], refetch } = useQuery({
    queryKey: ['myPredictions', user?.id],
    queryFn: () =>
      client.get<UserMatch[]>(`/users/${user!.id}/matches/all`).then((r) => r.data).catch(() => []),
    enabled: !!user,
  });

  useSocket({
    'prediction.saved': () => refetch(),
    'match.result': () => {
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      refetch();
    },
  }, user?.id);

  const tabs = [
    { key: 'groups' as const, label: 'Fase de Grupos' },
    { key: 'bracket' as const, label: 'Eliminatorias' },
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold" style={{ color: 'var(--color-text)', marginBottom: 24 }}>
        Partidos
      </h2>

      <div
        className="flex"
        style={{
          borderBottom: '2px solid var(--color-border-light)',
          marginBottom: 28,
          gap: 4,
        }}
      >
        {tabs.map(({ key, label }) => {
          const active = view === key;
          return (
            <button
              key={key}
              onClick={() => setView(key)}
              className="cursor-pointer bg-transparent border-none"
              style={{
                padding: '12px 20px',
                fontSize: 14,
                fontWeight: active ? 700 : 500,
                color: active ? 'var(--color-fifa-blue)' : 'var(--color-text-secondary)',
                borderBottom: active ? '2px solid var(--color-fifa-blue)' : '2px solid transparent',
                marginBottom: -2,
                transition: 'color 0.15s ease',
              }}
              onMouseEnter={(e) => { if (!active) e.currentTarget.style.color = 'var(--color-text)'; }}
              onMouseLeave={(e) => { if (!active) e.currentTarget.style.color = active ? 'var(--color-fifa-blue)' : 'var(--color-text-secondary)'; }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {view === 'groups' ? (
        <GroupMatches predictions={predictions} onPredictionUpdate={refetch} />
      ) : (
        <BracketView predictions={predictions} onPredictionUpdate={refetch} />
      )}
    </div>
  );
}
