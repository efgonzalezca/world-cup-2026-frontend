import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AdminPanel from '../components/admin/AdminPanel';

export default function AdminPage() {
  const { user } = useAuth();
  if (user?.role !== 'admin') return <Navigate to="/" replace />;
  return <AdminPanel />;
}
