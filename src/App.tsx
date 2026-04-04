import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/layout/Layout';
import LoginForm from './components/auth/LoginForm';
import RegisterForm from './components/auth/RegisterForm';
import ForgotPassword from './components/auth/ForgotPassword';
import ChangePassword from './components/auth/ChangePassword';
import MatchesPage from './pages/MatchesPage';
import RankingPage from './pages/RankingPage';
import PodiumPage from './pages/PodiumPage';
import TeamsPage from './pages/TeamsPage';
import SimulatorPage from './pages/SimulatorPage';
import RulesPage from './pages/RulesPage';
import AdminPage from './pages/AdminPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
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
              <Route path="/" element={<MatchesPage />} />
              <Route path="/ranking" element={<RankingPage />} />
              <Route path="/podium" element={<PodiumPage />} />
              <Route path="/teams" element={<TeamsPage />} />
              <Route path="/simulator" element={<SimulatorPage />} />
              <Route path="/rules" element={<RulesPage />} />
              <Route path="/admin" element={<AdminPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
