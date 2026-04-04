import { useQuery } from '@tanstack/react-query';
import { getTeamsApi } from '../api/teams';
import { getCountryCode } from '../utils/flags';

export default function TeamsPage() {
  const { data: teams, isLoading } = useQuery({
    queryKey: ['teams'],
    queryFn: () => getTeamsApi().then((r) => r.data),
  });

  if (isLoading) return <p style={{ color: 'var(--color-text-muted)', padding: 24 }}>Cargando equipos...</p>;

  const grouped = teams?.reduce((acc, t) => {
    if (!acc[t.group_code]) acc[t.group_code] = [];
    acc[t.group_code].push(t);
    return acc;
  }, {} as Record<string, typeof teams>);

  return (
    <div>
      <h2 className="text-2xl font-bold" style={{ color: 'var(--color-text)', marginBottom: 24 }}>
        Equipos
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {grouped && Object.entries(grouped).sort().map(([group, groupTeams]) => (
          <div
            key={group}
            style={{
              background: 'var(--color-card)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border-light)',
              boxShadow: 'var(--shadow-sm)',
              overflow: 'hidden',
            }}
          >
            {/* Group header */}
            <div
              style={{
                padding: '12px 16px',
                borderBottom: '1px solid var(--color-border-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-fifa-blue)' }}>
                Grupo {group}
              </span>
              <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                Ranking FIFA
              </span>
            </div>

            {/* Teams */}
            {groupTeams?.sort((a, b) => (a.fifa_rank || 999) - (b.fifa_rank || 999)).map((t, i) => {
              const code = getCountryCode(t.id);
              return (
                <div
                  key={t.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 16px',
                    borderBottom: i < (groupTeams?.length ?? 0) - 1 ? '1px solid var(--color-border-light)' : 'none',
                  }}
                >
                  {/* Flag */}
                  {code ? (
                    <span
                      className={`fi fis fi-${code}`}
                      style={{
                        width: 28,
                        height: 20,
                        borderRadius: 3,
                        flexShrink: 0,
                        boxShadow: '0 0 0 1px rgba(0,0,0,0.08)',
                      }}
                    />
                  ) : (
                    <span style={{ width: 28, height: 20, borderRadius: 3, background: 'var(--color-border)', flexShrink: 0 }} />
                  )}

                  {/* Code */}
                  <span style={{
                    fontSize: 11, fontWeight: 600, fontFamily: 'monospace',
                    color: 'var(--color-text-muted)', width: 30, flexShrink: 0,
                  }}>
                    {t.id}
                  </span>

                  {/* Name */}
                  <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text)', flex: 1 }}>
                    {t.name}
                  </span>

                  {/* FIFA Rank */}
                  <span style={{
                    fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)',
                    fontVariantNumeric: 'tabular-nums',
                  }}>
                    #{t.fifa_rank}
                  </span>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
