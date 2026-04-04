import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { resetPasswordApi } from '../../api/auth';
import AuthLayout, { AuthInput, AuthButton, AuthLink } from './AuthLayout';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [touched, setTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const navigate = useNavigate();

  const validateEmail = (v: string) => {
    if (!v) return 'Requerido';
    if (!/\S+@\S+\.\S+/.test(v)) return 'Correo inválido';
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    const err = validateEmail(email);
    setEmailError(err);
    if (err) return;

    setLoading(true);
    try {
      await resetPasswordApi(email);
      setSent(true);
      toast.success('Contraseña temporal enviada al correo');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al solicitar recuperación');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Recuperar Contraseña" subtitle="Ingresa tu correo para recibir una contraseña temporal">
      {sent ? (
        <div style={{ textAlign: 'center' }}>
          {/* Success state */}
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: 'rgba(45,226,177,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px', fontSize: 24,
          }}>
            ✓
          </div>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, marginBottom: 24, lineHeight: 1.5 }}>
            Se envió una contraseña temporal a <strong style={{ color: '#fff' }}>{email}</strong>. Revisa tu bandeja de entrada.
          </p>
          <AuthButton onClick={() => navigate('/login')}>
            Ir al login
          </AuthButton>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate>
          <AuthInput
            label="Correo electrónico"
            type="email"
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (touched) setEmailError(validateEmail(e.target.value));
            }}
            onBlur={() => { setTouched(true); setEmailError(validateEmail(email)); }}
            error={touched ? emailError : undefined}
          />
          <AuthButton type="submit" loading={loading}>
            {loading ? 'Enviando...' : 'Enviar contraseña temporal'}
          </AuthButton>
        </form>
      )}

      <div style={{ textAlign: 'center', marginTop: 20 }}>
        <AuthLink onClick={() => navigate('/login')}>
          Volver al login
        </AuthLink>
      </div>
    </AuthLayout>
  );
}
