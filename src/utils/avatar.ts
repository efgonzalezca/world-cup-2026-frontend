const API_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000/api`;

export function resolveAvatar(src: string | null | undefined): string | null {
  if (!src) return null;
  const token = localStorage.getItem('token');
  const url = `${API_URL}${src}`;
  return token ? `${url}?token=${encodeURIComponent(token)}` : url;
}
