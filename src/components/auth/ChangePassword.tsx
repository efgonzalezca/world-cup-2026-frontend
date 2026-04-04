import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import { updateUserApi } from '../../api/users';
import AuthLayout, { AuthPasswordInput, AuthButton } from './AuthLayout';

export default function ChangePassword() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({});
  const [touched, setTouched] = useState<{ password?: boolean; confirm?: boolean }>({});
  const [loading, setLoading] = useState(false);
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  const validate = (pw: string, cf: string) => {
    const e: { password?: string; confirm?: string } = {};
    if (!pw) e.password = 'Requerido';
    else if (pw.length < 6) e.password = 'Mínimo 6 caracteres';
    if (!cf) e.confirm = 'Requerido';
    else if (pw && cf !== pw) e.confirm = 'Las contraseñas no coinciden';
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ password: true, confirm: true });
    const v = validate(password, confirm);
    setErrors(v);
    if (Object.keys(v).length > 0) {
      toast.error('Corrige los campos marcados');
      return;
    }
    setLoading(true);
    try {
      await updateUserApi(user!.id, { password });
      updateUser({ is_temp_password: false });
      toast.success('Contraseña actualizada correctamente');
      setTimeout(() => navigate('/'), 1000);
    } catch (err: unknown) {
      toast.error((err as any)?.response?.data?.message || 'Error al cambiar contraseña');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Cambiar Contraseña" subtitle="Establece una nueva contraseña para continuar">
      <form onSubmit={handleSubmit} noValidate>
        <AuthPasswordInput
          label="Nueva contraseña" placeholder="••••••••"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (touched.password) {
              const v = validate(e.target.value, confirm);
              setErrors((prev) => ({ ...prev, password: v.password, confirm: confirm ? v.confirm : prev.confirm }));
            }
          }}
          onBlur={() => {
            setTouched((prev) => ({ ...prev, password: true }));
            setErrors((prev) => ({ ...prev, ...validate(password, confirm) }));
          }}
          error={touched.password ? errors.password : undefined}
        />
        <AuthPasswordInput
          label="Confirmar contraseña" placeholder="••••••••"
          value={confirm}
          onChange={(e) => {
            setConfirm(e.target.value);
            if (touched.confirm) {
              const v = validate(password, e.target.value);
              setErrors((prev) => ({ ...prev, confirm: v.confirm }));
            }
          }}
          onBlur={() => {
            setTouched((prev) => ({ ...prev, confirm: true }));
            setErrors((prev) => ({ ...prev, confirm: validate(password, confirm).confirm }));
          }}
          error={touched.confirm ? errors.confirm : undefined}
        />
        <AuthButton type="submit" loading={loading}>
          {loading ? 'Guardando...' : 'Cambiar contraseña'}
        </AuthButton>
      </form>
    </AuthLayout>
  );
}
