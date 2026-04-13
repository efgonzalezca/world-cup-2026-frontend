import { useSocket } from './useSocket';
import { useAuth } from '../context/AuthContext';

/**
 * Listens for auth-related WebSocket events (profile updates, force logout).
 * Should be mounted once inside the authenticated layout.
 */
export function useAuthSocketEvents() {
  const { updateUser } = useAuth();

  useSocket({
    'profile.updated': (payload: { profileImage: string }) => {
      updateUser({ profile_image: payload.profileImage });
    },
    'force.logout': () => {
      if (sessionStorage.getItem('password_change_self')) {
        sessionStorage.removeItem('password_change_self');
        return;
      }
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      window.location.href = '/login?reason=password_changed';
    },
  });
}