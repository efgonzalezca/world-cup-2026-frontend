import { useState } from 'react';
import AdminMatches from './AdminMatches';
import AdminUsers from './AdminUsers';

type AdminTab = 'matches' | 'users';

const TABS: { key: AdminTab; label: string }[] = [
  { key: 'matches', label: 'Resultados' },
  { key: 'users', label: 'Usuarios' },
];

export default function AdminPanel() {
  const [tab, setTab] = useState<AdminTab>('matches');

  return (
    <div>
      <h2 className="text-2xl font-bold" style={{ color: 'var(--color-text)', marginBottom: 24 }}>
        Panel de Administración
      </h2>

      {/* Section tabs */}
      <div style={{ borderBottom: '2px solid var(--color-border-light)', marginBottom: 24 }}>
        <div className="flex" style={{ gap: 4 }}>
          {TABS.map(({ key, label }) => {
            const active = tab === key;
            return (
              <button
                key={key}
                onClick={() => setTab(key)}
                style={{
                  padding: '12px 18px', fontSize: 14,
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
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {tab === 'matches' ? <AdminMatches /> : <AdminUsers />}
    </div>
  );
}
