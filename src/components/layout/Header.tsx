import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  FiCalendar, FiBarChart2, FiAward, FiUsers,
  FiSliders, FiBookOpen, FiShield, FiLogOut,
  FiMenu, FiX, FiChevronsRight, FiChevronsLeft,
} from 'react-icons/fi';
import ProfileModal from './ProfileModal';

const API_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000`;

function resolveAvatar(src: string | null | undefined): string | null {
  if (!src) return null;
  return `${API_URL}${src}`;
}

const NAV_ITEMS = [
  { path: '/',           label: 'Partidos',      icon: FiCalendar  },
  { path: '/ranking',    label: 'Clasificación', icon: FiBarChart2 },
  { path: '/podium',     label: 'Podio',         icon: FiAward     },
  { path: '/teams',      label: 'Equipos',       icon: FiUsers     },
  { path: '/simulator',  label: 'Simulador',     icon: FiSliders   },
  { path: '/rules',      label: 'Reglamento',    icon: FiBookOpen  },
];

const ADMIN_ITEMS = [
  { path: '/admin', label: 'Administrar', icon: FiShield },
];

export const COLLAPSED_W = 64;
export const EXPANDED_W = 220;

export default function Sidebar() {
  const [expanded, setExpanded] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const { user, logout } = useAuth();
  const avatarUrl = resolveAvatar(user?.profile_image);
  const navigate = useNavigate();
  const location = useLocation();

  const items = user?.role === 'admin' ? [...NAV_ITEMS, ...ADMIN_ITEMS] : NAV_ITEMS;
  const isActive = (path: string) => location.pathname === path;

  const handleNav = (path: string) => {
    navigate(path);
    setMobileOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {/* ── Desktop sidebar — fixed, collapsible ── */}
      <aside
        className="hidden lg:flex flex-col fixed top-0 left-0 h-screen z-40"
        style={{
          width: expanded ? EXPANDED_W : COLLAPSED_W,
          background: 'var(--color-primary)',
          transition: 'width 0.2s cubic-bezier(0.4,0,0.2,1)',
          overflow: 'hidden',
        }}
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
      >
        {/* Logo */}
        <div
          className="flex items-center shrink-0"
          style={{
            padding: expanded ? '16px 14px 12px' : '16px 0 12px',
            justifyContent: 'center',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            transition: 'padding 0.2s ease',
          }}
        >
          <img
            src="/fifa-wc2026-white.png"
            alt="Copa Mundial de la FIFA 2026"
            style={{
              height: expanded ? 52 : 36,
              objectFit: 'contain',
              transition: 'height 0.2s ease',
            }}
          />
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto" style={{ padding: '8px 6px' }}>
          {items.map(({ path, label, icon: Icon }) => {
            const active = isActive(path);
            return (
              <button
                key={path}
                onClick={() => handleNav(path)}
                title={expanded ? undefined : label}
                className="w-full flex items-center cursor-pointer border-none text-sm font-medium"
                style={{
                  padding: expanded ? '9px 12px' : '9px 0',
                  justifyContent: expanded ? 'flex-start' : 'center',
                  gap: expanded ? 10 : 0,
                  borderRadius: 'var(--radius-sm)',
                  marginBottom: 2,
                  background: active ? 'rgba(1,124,252,0.18)' : 'transparent',
                  color: active ? '#fff' : 'rgba(255,255,255,0.5)',
                  borderLeft: expanded ? (active ? '3px solid var(--color-fifa-blue)' : '3px solid transparent') : 'none',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.07)';
                    e.currentTarget.style.color = 'rgba(255,255,255,0.85)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'rgba(255,255,255,0.5)';
                  }
                }}
              >
                <Icon size={18} style={{ flexShrink: 0 }} />
                <span style={{
                  opacity: expanded ? 1 : 0,
                  width: expanded ? 'auto' : 0,
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                  transition: 'opacity 0.15s ease 0.05s',
                }}>
                  {label}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Expand/Collapse toggle */}
        <div style={{ padding: '4px 6px', display: 'flex', justifyContent: expanded ? 'flex-end' : 'center' }}>
          <button
            onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
            className="flex items-center justify-center cursor-pointer border-none"
            style={{
              width: 28, height: 28, borderRadius: 'var(--radius-sm)',
              background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.35)',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(255,255,255,0.35)'; }}
            title={expanded ? 'Colapsar' : 'Expandir'}
          >
            {expanded ? <FiChevronsLeft size={14} /> : <FiChevronsRight size={14} />}
          </button>
        </div>

        {/* User + Logout */}
        <div style={{ padding: '8px 6px 12px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          {/* User — clickable to open profile */}
          <button
            onClick={() => setProfileOpen(true)}
            title={expanded ? undefined : 'Mi perfil'}
            className="w-full flex items-center border-none cursor-pointer"
            style={{
              padding: expanded ? '8px 10px' : '8px 0',
              justifyContent: expanded ? 'flex-start' : 'center',
              gap: expanded ? 10 : 0,
              marginBottom: 2,
              background: 'transparent',
              borderRadius: 'var(--radius-sm)',
              transition: 'background 0.15s ease',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '2px solid rgba(255,255,255,0.15)' }} />
            ) : (
              <div
                className="flex items-center justify-center text-xs font-bold shrink-0"
                style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--color-fifa-blue)', color: '#fff' }}
              >
                {user?.nickname?.charAt(0).toUpperCase()}
              </div>
            )}
            <div style={{
              opacity: expanded ? 1 : 0,
              width: expanded ? 'auto' : 0,
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              transition: 'opacity 0.15s ease 0.05s',
              textAlign: 'left',
            }}>
              <div className="text-sm font-semibold text-white truncate" style={{ maxWidth: 130 }}>
                {user?.nickname}
              </div>
              <div className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.35)', maxWidth: 130 }}>
                {user?.email}
              </div>
            </div>
          </button>

          {/* Logout */}
          <button
            onClick={handleLogout}
            title={expanded ? undefined : 'Cerrar sesión'}
            className="w-full flex items-center cursor-pointer border-none text-sm font-medium"
            style={{
              padding: expanded ? '9px 12px' : '9px 0',
              justifyContent: expanded ? 'flex-start' : 'center',
              gap: expanded ? 10 : 0,
              borderRadius: 'var(--radius-sm)',
              background: 'transparent',
              color: 'rgba(255,255,255,0.4)',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(220,38,38,0.15)';
              e.currentTarget.style.color = '#FCA5A5';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'rgba(255,255,255,0.4)';
            }}
          >
            <FiLogOut size={18} style={{ flexShrink: 0 }} />
            <span style={{
              opacity: expanded ? 1 : 0,
              width: expanded ? 'auto' : 0,
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              transition: 'opacity 0.15s ease 0.05s',
            }}>
              Cerrar sesión
            </span>
          </button>
        </div>
      </aside>

      {/* ── Mobile top bar ── */}
      <div
        className="lg:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between"
        style={{
          height: 56,
          padding: '0 16px',
          background: 'var(--color-primary)',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <img
          src="/fifa-wc2026-white.png"
          alt="Copa Mundial de la FIFA 2026"
          style={{ height: 36, objectFit: 'contain' }}
        />
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 cursor-pointer bg-transparent border-none"
          style={{ color: 'rgba(255,255,255,0.7)' }}
        >
          {mobileOpen ? <FiX size={22} /> : <FiMenu size={22} />}
        </button>
      </div>

      {/* ── Mobile sidebar overlay ── */}
      {mobileOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 z-40"
            style={{ background: 'rgba(0,0,0,0.5)' }}
            onClick={() => setMobileOpen(false)}
          />
          <aside
            className="lg:hidden fixed top-0 left-0 z-50 flex flex-col"
            style={{ width: EXPANDED_W, background: 'var(--color-primary)', height: '100dvh', overflow: 'hidden' }}
          >
            {/* Logo */}
            <div style={{ padding: '16px 14px 12px', borderBottom: '1px solid rgba(255,255,255,0.08)', textAlign: 'center' }}>
              <img
                src="/fifa-wc2026-white.png"
                alt="Copa Mundial de la FIFA 2026"
                style={{ height: 48, objectFit: 'contain' }}
              />
            </div>
            <nav className="flex-1 overflow-y-auto" style={{ padding: '8px 6px' }}>
              {items.map(({ path, label, icon: Icon }) => {
                const active = isActive(path);
                return (
                  <button
                    key={path}
                    onClick={() => handleNav(path)}
                    className="w-full flex items-center gap-3 cursor-pointer border-none text-sm font-medium text-left"
                    style={{
                      padding: '10px 12px', borderRadius: 'var(--radius-sm)', marginBottom: 2,
                      background: active ? 'rgba(1,124,252,0.18)' : 'transparent',
                      color: active ? '#fff' : 'rgba(255,255,255,0.55)',
                      borderLeft: active ? '3px solid var(--color-fifa-blue)' : '3px solid transparent',
                    }}
                  >
                    <Icon size={17} style={{ flexShrink: 0 }} />
                    {label}
                  </button>
                );
              })}
            </nav>
            <div style={{ padding: '8px 6px', paddingBottom: 'max(12px, env(safe-area-inset-bottom))', borderTop: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>
              <button
                onClick={() => { setMobileOpen(false); setProfileOpen(true); }}
                className="w-full flex items-center gap-3 cursor-pointer border-none text-left"
                style={{ padding: '8px 10px', marginBottom: 2, background: 'transparent', borderRadius: 'var(--radius-sm)' }}
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '2px solid rgba(255,255,255,0.15)' }} />
                ) : (
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ background: 'var(--color-fifa-blue)', color: '#fff' }}>
                    {user?.nickname?.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="overflow-hidden">
                  <div className="text-sm font-semibold text-white truncate">{user?.nickname}</div>
                  <div className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.35)' }}>{user?.email}</div>
                </div>
              </button>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 cursor-pointer border-none text-sm font-medium text-left"
                style={{ padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'transparent', color: 'rgba(255,255,255,0.4)' }}
              >
                <FiLogOut size={17} />
                Cerrar sesión
              </button>
            </div>
          </aside>
        </>
      )}

      {/* Profile modal */}
      {profileOpen && <ProfileModal onClose={() => setProfileOpen(false)} />}
    </>
  );
}
