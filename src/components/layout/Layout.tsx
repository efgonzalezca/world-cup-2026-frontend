import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAuthSocketEvents } from '../../hooks/useAuthSocketEvents';
import Header, { COLLAPSED_W } from './Header';

function AuthenticatedLayout() {
  useAuthSocketEvents();

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      <Header />

      <style>{`
        .app-main { transition: margin-left 0.2s ease; }
        @media (max-width: 1023px) { .app-main { padding-top: 56px; } }
        @media (min-width: 1024px) { .app-main { margin-left: ${COLLAPSED_W}px; } }

        .app-content {
          padding: 20px 20px 32px;
        }
        @media (min-width: 768px) {
          .app-content { padding: 24px 24px 40px; }
        }
        @media (min-width: 1024px) {
          .app-content { padding: 24px 24px 40px; }
        }
        @media (min-width: 1920px) {
          .app-content { max-width: 1800px; margin: 0 auto; padding: 28px 32px 48px; }
        }
      `}</style>

      <main className="app-main">
        <div className="app-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default function Layout() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return <AuthenticatedLayout />;
}