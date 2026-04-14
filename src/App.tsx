import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import ErrorBoundary from './components/common/ErrorBoundary';
import Layout from './components/layout/Layout';
import LoginForm from './components/auth/LoginForm';
import RegisterForm from './components/auth/RegisterForm';
import ForgotPassword from './components/auth/ForgotPassword';
import ChangePassword from './components/auth/ChangePassword';

const MatchesPage = lazy(() => import('./pages/MatchesPage'));
const RankingPage = lazy(() => import('./pages/RankingPage'));
const PodiumPage = lazy(() => import('./pages/PodiumPage'));
const TeamsPage = lazy(() => import('./pages/TeamsPage'));
const SimulatorPage = lazy(() => import('./pages/SimulatorPage'));
const RulesPage = lazy(() => import('./pages/RulesPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000,
      retry: 1,
    },
  },
});

function PageLoader() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: 200,
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: '50%',
        border: '3px solid var(--color-border)',
        borderTopColor: 'var(--color-fifa-blue)',
        animation: 'spin 0.8s linear infinite',
      }} />
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <SocketProvider>
            <BrowserRouter>
              <Toaster
                position="top-right"
                richColors
                toastOptions={{
                  style: { fontSize: 13 },
                  duration: 4000,
                }}
              />
              <Routes>
                <Route path="/login" element={<LoginForm />} />
                <Route path="/register" element={<RegisterForm />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/change-password" element={<ChangePassword />} />

                <Route element={<Layout />}>
                  <Route path="/" element={<Suspense fallback={<PageLoader />}><MatchesPage /></Suspense>} />
                  <Route path="/ranking" element={<Suspense fallback={<PageLoader />}><RankingPage /></Suspense>} />
                  <Route path="/podium" element={<Suspense fallback={<PageLoader />}><PodiumPage /></Suspense>} />
                  <Route path="/teams" element={<Suspense fallback={<PageLoader />}><TeamsPage /></Suspense>} />
                  <Route path="/simulator" element={<Suspense fallback={<PageLoader />}><SimulatorPage /></Suspense>} />
                  <Route path="/rules" element={<Suspense fallback={<PageLoader />}><RulesPage /></Suspense>} />
                  <Route path="/admin" element={<Suspense fallback={<PageLoader />}><AdminPage /></Suspense>} />
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </BrowserRouter>
          </SocketProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
