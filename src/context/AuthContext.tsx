import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from 'react';
import { io, type Socket } from 'socket.io-client';
import { loginApi } from '../api/auth';
import type { User, LoginResponse } from '../types';

const WS_URL = import.meta.env.VITE_WS_URL || `http://${window.location.hostname}:3000`;

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<LoginResponse>;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const socketRef = useRef<Socket | null>(null);
  const userIdRef = useRef<string | null>(user?.id ?? null);

  // Keep ref in sync
  userIdRef.current = user?.id ?? null;

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await loginApi(email, password);
    setUser(data.user);
    setToken(data.access_token);
    localStorage.setItem('user', JSON.stringify(data.user));
    localStorage.setItem('token', data.access_token);
    return data;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  }, []);

  const updateUser = useCallback((data: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...data };
      localStorage.setItem('user', JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Single WebSocket connection for auth events
  useEffect(() => {
    if (!token || !userIdRef.current) return;

    const userId = userIdRef.current;
    const socket = io(WS_URL, { transports: ['websocket'] });
    socketRef.current = socket;

    // Join user-specific room on connect
    socket.on('connect', () => {
      socket.emit('join', { userId });
    });

    socket.on('profile.updated', (payload: { profileImage: string }) => {
      updateUser({ profile_image: payload.profileImage });
    });

    socket.on('force.logout', () => {
      if (sessionStorage.getItem('password_change_self')) {
        sessionStorage.removeItem('password_change_self');
        return;
      }
      socket.disconnect();
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      window.location.href = '/login?reason=password_changed';
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token]);

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!token, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
