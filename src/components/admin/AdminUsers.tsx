import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getAdminUsersApi, setUserActiveApi } from '../../api/users';
import { useAuth } from '../../context/AuthContext';
import ConfirmDialog from '../common/ConfirmDialog';
import type { AdminUser } from '../../types';

type StatusFilter = 'all' | 'active' | 'inactive';
type RoleFilter = '' | 'admin' | 'user';

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span style={{
      fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 99,
      background: active ? 'var(--color-success-bg)' : 'rgba(220,38,38,0.12)',
      color: active ? 'var(--color-success)' : 'var(--color-error, #DC2626)',
    }}>
      {active ? 'Activo' : 'Inactivo'}
    </span>
  );
}

function RoleBadge({ role }: { role: 'admin' | 'user' }) {
  return (
    <span style={{
      fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 99,
      background: role === 'admin' ? 'var(--color-primary)' : 'var(--color-border-light)',
      color: role === 'admin' ? '#fff' : 'var(--color-text-secondary)',
    }}>
      {role === 'admin' ? 'Admin' : 'Usuario'}
    </span>
  );
}

// Sliding window of page numbers centered on the current page (max 5).
function getPageWindow(current: number, total: number): number[] {
  if (total <= 1) return [1];
  const span = 5;
  let start = Math.max(1, current - Math.floor(span / 2));
  const end = Math.min(total, start + span - 1);
  start = Math.max(1, end - span + 1);
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

function PageButton({
  children, onClick, disabled = false, active = false, title,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  title?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-current={active ? 'page' : undefined}
      style={{
        minWidth: 32, height: 34, padding: '0 6px', fontSize: 13,
        fontWeight: active ? 700 : 500, borderRadius: 8, flexShrink: 0,
        border: `1px solid ${active ? 'var(--color-fifa-blue)' : 'var(--color-border)'}`,
        background: active ? 'var(--color-fifa-blue)' : 'var(--color-card)',
        color: active ? '#fff' : 'var(--color-text)',
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.4 : 1,
      }}
    >
      {children}
    </button>
  );
}

export default function AdminUsers() {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [role, setRole] = useState<RoleFilter>('');
  const [target, setTarget] = useState<AdminUser | null>(null);

  // Debounce search input
  useEffect(() => {
    const id = setTimeout(() => { setSearch(searchInput.trim()); setPage(1); }, 400);
    return () => clearTimeout(id);
  }, [searchInput]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-users', { page, limit, search, status, role }],
    queryFn: () => getAdminUsersApi({
      page,
      limit,
      search: search || undefined,
      status,
      role: role || undefined,
    }).then((r) => r.data),
    placeholderData: keepPreviousData,
  });

  const mutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => setUserActiveApi(id, isActive),
    onSuccess: (_res, vars) => {
      toast.success(vars.isActive ? 'Usuario activado' : 'Usuario desactivado');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['ranking'] });
      setTarget(null);
    },
    onError: (err) => {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(message || 'Error al actualizar el estado');
    },
  });

  const users = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;
  const total = data?.total ?? 0;

  const selectStyle: React.CSSProperties = {
    padding: '8px 10px', fontSize: 13, borderRadius: 8,
    background: 'var(--color-card)', color: 'var(--color-text)',
    border: '1px solid var(--color-border)', outline: 'none', cursor: 'pointer',
  };

  const ActionButton = ({ u }: { u: AdminUser }) => {
    const isSelf = u.id === currentUser?.id;
    return (
      <button
        onClick={() => setTarget(u)}
        disabled={isSelf}
        title={isSelf ? 'No puedes cambiar el estado de tu propia cuenta' : undefined}
        style={{
          padding: '5px 12px', fontSize: 12, fontWeight: 600, borderRadius: 6,
          border: 'none', cursor: isSelf ? 'not-allowed' : 'pointer',
          background: isSelf
            ? 'var(--color-border-light)'
            : u.is_active ? 'rgba(220,38,38,0.12)' : 'var(--color-success-bg)',
          color: isSelf
            ? 'var(--color-text-muted)'
            : u.is_active ? 'var(--color-error, #DC2626)' : 'var(--color-success)',
          opacity: isSelf ? 0.6 : 1,
        }}
      >
        {u.is_active ? 'Desactivar' : 'Activar'}
      </button>
    );
  };

  return (
    <div>
      {/* Filters bar */}
      <div className="flex flex-col sm:flex-row sm:items-center" style={{ gap: 10, marginBottom: 16 }}>
        <input
          type="text"
          placeholder="Buscar por nombre, nickname o email..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          style={{
            flex: 1, width: '100%', padding: '8px 12px', fontSize: 13, borderRadius: 8,
            background: 'var(--color-card)', color: 'var(--color-text)',
            border: '1px solid var(--color-border)', outline: 'none',
          }}
        />
        <div className="flex" style={{ gap: 10 }}>
          <select value={status} onChange={(e) => { setStatus(e.target.value as StatusFilter); setPage(1); }} style={{ ...selectStyle, flex: 1 }}>
            <option value="all">Todos los estados</option>
            <option value="active">Activos</option>
            <option value="inactive">Inactivos</option>
          </select>
          <select value={role} onChange={(e) => { setRole(e.target.value as RoleFilter); setPage(1); }} style={{ ...selectStyle, flex: 1 }}>
            <option value="">Todos los roles</option>
            <option value="admin">Administradores</option>
            <option value="user">Usuarios</option>
          </select>
        </div>
      </div>

      {isError ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-error, #DC2626)', fontSize: 13 }}>
          Error al cargar los usuarios
        </div>
      ) : isLoading ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 13 }}>
          Cargando usuarios...
        </div>
      ) : users.length === 0 ? (
        <div style={{
          padding: 40, textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 13,
          background: 'var(--color-card)', border: '1px solid var(--color-border-light)', borderRadius: 'var(--radius-md)',
        }}>
          No se encontraron usuarios
        </div>
      ) : (
        <>
          {/* Table */}
          <div style={{
            background: 'var(--color-card)', border: '1px solid var(--color-border-light)',
            borderRadius: 'var(--radius-md)', overflowX: 'auto',
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'var(--color-bg)', textAlign: 'left' }}>
                  {['Nickname', 'Nombre', 'Email', 'Teléfono', 'Rol', 'Estado', 'Score', 'Registro', ''].map((h, i) => (
                    <th key={i} style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} style={{ borderTop: '1px solid var(--color-border-light)' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--color-text)', whiteSpace: 'nowrap' }}>{u.nickname}</td>
                    <td style={{ padding: '10px 12px', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>{u.names} {u.surnames}</td>
                    <td style={{ padding: '10px 12px', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>{u.email}</td>
                    <td style={{ padding: '10px 12px', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>{u.cellphone}</td>
                    <td style={{ padding: '10px 12px' }}><RoleBadge role={u.role} /></td>
                    <td style={{ padding: '10px 12px' }}><StatusBadge active={u.is_active} /></td>
                    <td style={{ padding: '10px 12px', fontWeight: 700, color: 'var(--color-text)', fontVariantNumeric: 'tabular-nums' }}>{u.total_score}</td>
                    <td style={{ padding: '10px 12px', color: 'var(--color-text-muted)', fontSize: 12, whiteSpace: 'nowrap' }}>
                      {new Date(u.created_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'right' }}><ActionButton u={u} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex flex-wrap items-center justify-between" style={{ marginTop: 16, gap: 12 }}>
            <div className="flex items-center" style={{ gap: 10 }}>
              <span style={{ fontSize: 12, color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                {total} usuarios
              </span>
              <select
                value={limit}
                onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
                style={selectStyle}
              >
                <option value={10}>10 / página</option>
                <option value={20}>20 / página</option>
                <option value={50}>50 / página</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
              <PageButton onClick={() => setPage(1)} disabled={page <= 1} title="Primera página">«</PageButton>
              <PageButton onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} title="Anterior">‹</PageButton>
              {getPageWindow(page, totalPages).map((p) => (
                <PageButton key={p} onClick={() => setPage(p)} active={p === page}>
                  {p}
                </PageButton>
              ))}
              <PageButton onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} title="Siguiente">›</PageButton>
              <PageButton onClick={() => setPage(totalPages)} disabled={page >= totalPages} title="Última página">»</PageButton>
            </div>
          </div>
        </>
      )}

      <ConfirmDialog
        open={!!target}
        title={target?.is_active ? 'Desactivar usuario' : 'Activar usuario'}
        description={
          target?.is_active
            ? `¿Confirmas desactivar a "${target?.nickname}"? Se cerrará su sesión activa.`
            : `¿Confirmas activar a "${target?.nickname}"?`
        }
        confirmLabel={target?.is_active ? 'Desactivar' : 'Activar'}
        variant={target?.is_active ? 'danger' : 'primary'}
        loading={mutation.isPending}
        onConfirm={() => target && mutation.mutate({ id: target.id, isActive: !target.is_active })}
        onCancel={() => { if (!mutation.isPending) setTarget(null); }}
      />
    </div>
  );
}
