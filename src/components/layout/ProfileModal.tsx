import { useState, useRef } from 'react';
import { toast } from 'sonner';
import { FiCamera, FiX, FiCheck } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { updateUserApi, uploadAvatarApi } from '../../api/users';

const API_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000`;

function resolveAvatar(src: string | null | undefined): string | null {
  if (!src) return null;
  return `${API_URL}${src}`;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 12px',
  background: 'var(--color-bg)', color: 'var(--color-text)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-sm)',
  fontSize: 13, outline: 'none',
};

export default function ProfileModal({ onClose }: { onClose: () => void }) {
  const { user, updateUser } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  // Nickname
  const [nickname, setNickname] = useState(user?.nickname || '');
  const [savingNick, setSavingNick] = useState(false);
  const nickChanged = nickname !== user?.nickname && nickname.length >= 3;

  // Password
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [savingPw, setSavingPw] = useState(false);
  const pwMismatch = confirm.length > 0 && password.length > 0 && confirm !== password;
  const pwValid = password.length >= 6 && confirm === password;

  const avatarSrc = resolveAvatar(user?.profile_image);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 1024 * 1024) { toast.error('La imagen no puede superar 1MB'); return; }
    setUploading(true);
    try {
      const base64 = await fileToBase64(file);
      const { data } = await uploadAvatarApi(user.id, base64);
      updateUser({ profile_image: data.profile_image });
      toast.success('Foto actualizada');
    } catch { toast.error('Error al subir la imagen'); }
    finally { setUploading(false); if (fileRef.current) fileRef.current.value = ''; }
  };

  const handleNicknameSave = async () => {
    if (!user || !nickChanged) return;
    setSavingNick(true);
    try {
      await updateUserApi(user.id, { nickname });
      updateUser({ nickname });
      toast.success('Alias actualizado');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Error al actualizar alias');
    } finally { setSavingNick(false); }
  };

  const handlePasswordSave = async () => {
    if (!user || !pwValid) return;
    setSavingPw(true);
    try {
      sessionStorage.setItem('password_change_self', '1');
      await updateUserApi(user.id, { password });
      toast.success('Contraseña actualizada. Las demás sesiones fueron cerradas.');
      setPassword(''); setConfirm('');
    } catch { toast.error('Error al cambiar contraseña'); }
    finally { setSavingPw(false); }
  };

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100 }} />

      <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, zIndex: 101, pointerEvents: 'none' }}>
        <div style={{ width: '100%', maxWidth: 400, maxHeight: 'calc(100dvh - 32px)', overflowY: 'auto', background: 'var(--color-card)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)', pointerEvents: 'auto' }}>

          {/* Header */}
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--color-border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)' }}>Mi Perfil</span>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: 4 }}>
              <FiX size={18} />
            </button>
          </div>

          <div style={{ padding: '20px 20px 24px' }}>
            {/* Avatar */}
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ position: 'relative', display: 'inline-block' }}>
                {avatarSrc ? (
                  <img src={avatarSrc} alt="Avatar" style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--color-border-light)' }} />
                ) : (
                  <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--color-fifa-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, fontWeight: 700, color: '#fff' }}>
                    {user?.nickname?.charAt(0).toUpperCase()}
                  </div>
                )}
                <button onClick={() => fileRef.current?.click()} disabled={uploading} style={{ position: 'absolute', bottom: -2, right: -2, width: 26, height: 26, borderRadius: '50%', background: 'var(--color-fifa-blue)', color: '#fff', border: '2px solid var(--color-card)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: uploading ? 0.5 : 1 }}>
                  <FiCamera size={12} />
                </button>
                <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" onChange={handleFileChange} style={{ display: 'none' }} />
              </div>
              <div style={{ marginTop: 8, fontSize: 12, color: 'var(--color-text-muted)' }}>{user?.email}</div>
            </div>

            {/* Nickname */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 6 }}>Alias</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text" value={nickname} maxLength={20}
                  onChange={(e) => setNickname(e.target.value.replace(/\s/g, ''))}
                  style={{ ...inputStyle, flex: 1 }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--color-fifa-blue)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--color-border)'}
                />
                <button
                  onClick={handleNicknameSave}
                  disabled={!nickChanged || savingNick}
                  style={{ padding: '0 14px', background: 'var(--color-fifa-blue)', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', opacity: !nickChanged || savingNick ? 0.4 : 1, display: 'flex', alignItems: 'center' }}
                >
                  <FiCheck size={16} />
                </button>
              </div>
              {nickname.length > 0 && nickname.length < 3 && (
                <div style={{ fontSize: 11, color: 'var(--color-error)', marginTop: 4 }}>Mínimo 3 caracteres</div>
              )}
            </div>

            <div style={{ height: 1, background: 'var(--color-border-light)', margin: '0 0 20px' }} />

            {/* Password */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 6 }}>Cambiar contraseña</div>
              <input
                type={showPw ? 'text' : 'password'}
                placeholder="Nueva contraseña (mín. 6)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ ...inputStyle, marginBottom: 8 }}
                onFocus={(e) => e.target.style.borderColor = 'var(--color-fifa-blue)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--color-border)'}
              />
              <div>
                <input
                  type={showPw ? 'text' : 'password'}
                  placeholder="Confirmar contraseña"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  style={{ ...inputStyle, borderColor: pwMismatch ? 'var(--color-error)' : undefined }}
                  onFocus={(e) => e.target.style.borderColor = pwMismatch ? 'var(--color-error)' : 'var(--color-fifa-blue)'}
                  onBlur={(e) => e.target.style.borderColor = pwMismatch ? 'var(--color-error)' : 'var(--color-border)'}
                />
                {pwMismatch && (
                  <div style={{ fontSize: 11, color: 'var(--color-error)', marginTop: 4 }}>Las contraseñas no coinciden</div>
                )}
              </div>
              <div className="flex items-center justify-between" style={{ gap: 8, marginTop: 10 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 12, color: 'var(--color-text-muted)' }}>
                  <input type="checkbox" checked={showPw} onChange={() => setShowPw(!showPw)} style={{ accentColor: 'var(--color-fifa-blue)' }} />
                  Mostrar
                </label>
                <button
                  onClick={handlePasswordSave}
                  disabled={savingPw || !pwValid}
                  style={{ padding: '8px 16px', background: 'var(--color-fifa-blue)', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', fontSize: 12, fontWeight: 600, cursor: 'pointer', opacity: savingPw || !pwValid ? 0.4 : 1 }}
                >
                  {savingPw ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
