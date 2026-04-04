import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { registerApi } from '../../api/auth';
import AuthLayout, { AuthInput, AuthPasswordInput, AuthButton, AuthLink } from './AuthLayout';

type FieldKey = 'email' | 'nickname' | 'names' | 'surnames' | 'cellphone' | 'password' | 'confirmPassword';

function validate(form: Record<FieldKey, string>): Partial<Record<FieldKey, string>> {
  const e: Partial<Record<FieldKey, string>> = {};
  if (!form.email) e.email = 'Requerido';
  else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Correo inválido';
  if (!form.nickname) e.nickname = 'Requerido';
  else if (form.nickname.length < 3) e.nickname = 'Mínimo 3 caracteres';
  if (!form.names) e.names = 'Requerido';
  if (!form.surnames) e.surnames = 'Requerido';
  if (!form.cellphone) e.cellphone = 'Requerido';
  else if (!/^\d{10}$/.test(form.cellphone)) e.cellphone = 'Debe tener 10 dígitos';
  if (!form.password) e.password = 'Requerido';
  else if (form.password.length < 6) e.password = 'Mínimo 6 caracteres';
  if (!form.confirmPassword) e.confirmPassword = 'Requerido';
  else if (form.password && form.confirmPassword !== form.password) e.confirmPassword = 'Las contraseñas no coinciden';
  return e;
}

export default function RegisterForm() {
  const navigate = useNavigate();
  const [form, setForm] = useState<Record<FieldKey, string>>({
    email: '', nickname: '', names: '', surnames: '',
    cellphone: '', password: '', confirmPassword: '',
  });
  const [errors, setErrors] = useState<Partial<Record<FieldKey, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<FieldKey, boolean>>>({});
  const [loading, setLoading] = useState(false);

  const handleChange = (name: FieldKey, value: string) => {
    const next = { ...form, [name]: value };
    setForm(next);
    if (touched[name]) {
      const v = validate(next);
      setErrors((prev) => ({ ...prev, [name]: v[name] }));
    }
  };

  const handleBlur = (name: FieldKey) => {
    setTouched((prev) => ({ ...prev, [name]: true }));
    const v = validate(form);
    setErrors((prev) => ({ ...prev, [name]: v[name] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const v = validate(form);
    setErrors(v);
    const allKeys: FieldKey[] = ['email', 'nickname', 'names', 'surnames', 'cellphone', 'password', 'confirmPassword'];
    setTouched(Object.fromEntries(allKeys.map((k) => [k, true])));
    if (Object.keys(v).length > 0) {
      toast.error('Corrige los campos marcados');
      return;
    }
    setLoading(true);
    try {
      const { confirmPassword, ...data } = form;
      await registerApi(data);
      toast.success('Cuenta creada exitosamente. El administrador debe activarla.', { duration: 6000 });
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: unknown) {
      const msg = (err as any)?.response?.data?.message || 'Error al registrarse';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Crear Cuenta" subtitle="Regístrate para participar en la polla mundialista">
      <form onSubmit={handleSubmit} noValidate>
        <AuthInput
          label="Correo electrónico" type="email" placeholder="tu@email.com"
          value={form.email}
          onChange={(e) => handleChange('email', e.target.value)}
          onBlur={() => handleBlur('email')}
          error={touched.email ? errors.email : undefined}
        />
        <AuthInput
          label="Nickname (alias)" type="text" placeholder="Tu apodo"
          value={form.nickname}
          onChange={(e) => handleChange('nickname', e.target.value)}
          onBlur={() => handleBlur('nickname')}
          error={touched.nickname ? errors.nickname : undefined}
        />

        {/* Name row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <AuthInput
            label="Nombres" type="text" placeholder="Juan Carlos"
            value={form.names}
            onChange={(e) => handleChange('names', e.target.value)}
            onBlur={() => handleBlur('names')}
            error={touched.names ? errors.names : undefined}
          />
          <AuthInput
            label="Apellidos" type="text" placeholder="Perez Lopez"
            value={form.surnames}
            onChange={(e) => handleChange('surnames', e.target.value)}
            onBlur={() => handleBlur('surnames')}
            error={touched.surnames ? errors.surnames : undefined}
          />
        </div>

        {/* Phone — fixed Colombia +57 */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>
            Celular
          </label>
          <div style={{ display: 'flex', gap: 0 }}>
            {/* Fixed prefix */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '0 12px',
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRight: 'none',
              borderRadius: '10px 0 0 10px',
              color: 'rgba(255,255,255,0.7)',
              fontSize: 13, fontWeight: 500,
              whiteSpace: 'nowrap',
              userSelect: 'none',
            }}>
              <span style={{ fontSize: 15 }}>🇨🇴</span>
              <span>+57</span>
            </div>
            {/* Number input */}
            <input
              type="tel"
              placeholder="300 123 4567"
              value={form.cellphone}
              onChange={(e) => handleChange('cellphone', e.target.value.replace(/\D/g, '').slice(0, 10))}
              onBlur={() => handleBlur('cellphone')}
              maxLength={10}
              style={{
                flex: 1, padding: '12px 14px',
                background: 'rgba(255,255,255,0.07)',
                border: `1px solid ${touched.cellphone && errors.cellphone ? 'rgba(220,38,38,0.6)' : 'rgba(255,255,255,0.1)'}`,
                borderRadius: '0 10px 10px 0',
                color: '#fff', fontSize: 14, outline: 'none',
                transition: 'border-color 0.15s ease',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = touched.cellphone && errors.cellphone
                  ? 'rgba(220,38,38,0.8)' : 'var(--color-fifa-teal)';
              }}
            />
          </div>
          {touched.cellphone && errors.cellphone && (
            <div style={{ fontSize: 11, color: '#FCA5A5', marginTop: 4, paddingLeft: 2 }}>
              {errors.cellphone}
            </div>
          )}
        </div>

        <AuthPasswordInput
          label="Contraseña" placeholder="••••••••"
          value={form.password}
          onChange={(e) => handleChange('password', e.target.value)}
          onBlur={() => handleBlur('password')}
          error={touched.password ? errors.password : undefined}
        />
        <AuthPasswordInput
          label="Confirmar contraseña" placeholder="••••••••"
          value={form.confirmPassword}
          onChange={(e) => handleChange('confirmPassword', e.target.value)}
          onBlur={() => handleBlur('confirmPassword')}
          error={touched.confirmPassword ? errors.confirmPassword : undefined}
        />

        <AuthButton type="submit" loading={loading}>
          {loading ? 'Registrando...' : 'Registrarse'}
        </AuthButton>
      </form>

      <div style={{ textAlign: 'center', marginTop: 20 }}>
        <AuthLink onClick={() => navigate('/login')}>
          Ya tengo cuenta
        </AuthLink>
      </div>
    </AuthLayout>
  );
}
