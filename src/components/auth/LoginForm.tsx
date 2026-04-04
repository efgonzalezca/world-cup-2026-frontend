import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import { AuthInput, AuthPasswordInput, AuthButton, AuthLink, AuthError } from './AuthLayout';

const TOURNAMENT_START = new Date('2026-06-11T19:00:00Z');

function useCountdown(target: Date) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const diff = Math.max(0, target.getTime() - now);
  return {
    days:    Math.floor(diff / 86_400_000),
    hours:   Math.floor((diff % 86_400_000) / 3_600_000),
    minutes: Math.floor((diff % 3_600_000) / 60_000),
    seconds: Math.floor((diff % 60_000) / 1000),
    started: diff <= 0,
  };
}

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [serverError, setServerError] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [touched, setTouched] = useState<{ email?: boolean; password?: boolean }>({});
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const countdown = useCountdown(TOURNAMENT_START);

  // Show toast if user was force-logged out (read from URL query param)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const reason = params.get('reason');
    if (reason === 'password_changed') {
      // Clean URL without reload
      window.history.replaceState({}, '', '/login');
      const timer = setTimeout(() => {
        toast.info('Tu sesión fue cerrada porque la contraseña fue cambiada desde otro dispositivo.', { duration: 8000 });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const validate = (e: string, p: string) => {
    const err: { email?: string; password?: string } = {};
    if (!e) err.email = 'Requerido';
    else if (!/\S+@\S+\.\S+/.test(e)) err.email = 'Correo inválido';
    if (!p) err.password = 'Requerido';
    return err;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ email: true, password: true });
    const v = validate(email, password);
    setErrors(v);
    if (Object.keys(v).length > 0) return;

    setServerError('');
    setLoading(true);
    try {
      const data = await login(email, password);
      toast.success(`Bienvenido, ${data.user?.nickname || ''}!`);
      navigate(data.is_temp_password ? '/change-password' : '/');
    } catch (err: unknown) {
      const msg =
        (err as any)?.response?.data?.message
        || (err instanceof Error ? err.message : null)
        || 'Credenciales incorrectas';
      setServerError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const CountdownUnit = ({ value, label }: { value: number; label: string }) => (
    <div style={{ textAlign: 'center', minWidth: 44 }}>
      <div style={{
        fontSize: 24, fontWeight: 800, lineHeight: 1,
        color: '#fff', fontVariantNumeric: 'tabular-nums',
      }}>
        {String(value).padStart(2, '0')}
      </div>
      <div style={{
        fontSize: 8, fontWeight: 600, color: 'rgba(255,255,255,0.4)',
        textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 3,
      }}>
        {label}
      </div>
    </div>
  );

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-6"
      style={{
        background: 'var(--color-fifa-gradient)',
        position: 'relative',
      }}
    >
      {/* Geometric pattern */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.03,
        backgroundImage: `radial-gradient(circle at 25% 25%, #fff 1px, transparent 1px),
                          radial-gradient(circle at 75% 75%, #fff 1px, transparent 1px)`,
        backgroundSize: '40px 40px',
        pointerEvents: 'none',
      }} />

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 400 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <img
            src="/fifa-wc2026-white.png"
            alt="Copa Mundial de la FIFA 2026"
            style={{ height: 72, margin: '0 auto', display: 'block', objectFit: 'contain' }}
          />
        </div>

        {/* Countdown */}
        {!countdown.started && (
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div style={{
              fontSize: 10, fontWeight: 600, color: 'var(--color-fifa-teal)',
              textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 8,
            }}>
              Faltan para el inicio
            </div>
            <div className="flex items-center justify-center" style={{ gap: 4 }}>
              <CountdownUnit value={countdown.days} label="Días" />
              <span style={{ fontSize: 18, fontWeight: 300, color: 'rgba(255,255,255,0.2)', marginTop: -12 }}>:</span>
              <CountdownUnit value={countdown.hours} label="Horas" />
              <span style={{ fontSize: 18, fontWeight: 300, color: 'rgba(255,255,255,0.2)', marginTop: -12 }}>:</span>
              <CountdownUnit value={countdown.minutes} label="Min" />
              <span style={{ fontSize: 18, fontWeight: 300, color: 'rgba(255,255,255,0.2)', marginTop: -12 }}>:</span>
              <CountdownUnit value={countdown.seconds} label="Seg" />
            </div>
          </div>
        )}

        {/* Login card */}
        <div style={{
          background: 'rgba(255,255,255,0.06)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRadius: 16,
          border: '1px solid rgba(255,255,255,0.08)',
          padding: '24px 24px',
        }}>
          <h2 style={{ color: '#fff', fontSize: 18, fontWeight: 700, textAlign: 'center', marginBottom: 4 }}>
            Polla Mundialista
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, textAlign: 'center', marginBottom: 24 }}>
            Inicia sesión para registrar tus predicciones
          </p>

          <AuthError message={serverError} />

          <form onSubmit={handleSubmit} noValidate>
            <AuthInput
              label="Correo electrónico"
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setServerError('');
                if (touched.email) setErrors((prev) => ({ ...prev, email: validate(e.target.value, password).email }));
              }}
              onBlur={() => {
                setTouched((prev) => ({ ...prev, email: true }));
                setErrors((prev) => ({ ...prev, email: validate(email, password).email }));
              }}
              error={touched.email ? errors.email : undefined}
            />
            <AuthPasswordInput
              label="Contraseña"
              placeholder="••••••••"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setServerError('');
                if (touched.password) setErrors((prev) => ({ ...prev, password: validate(email, e.target.value).password }));
              }}
              onBlur={() => {
                setTouched((prev) => ({ ...prev, password: true }));
                setErrors((prev) => ({ ...prev, password: validate(email, password).password }));
              }}
              error={touched.password ? errors.password : undefined}
            />
            <AuthButton type="submit" loading={loading}>
              {loading ? 'Ingresando...' : 'Ingresar'}
            </AuthButton>
          </form>

          <div style={{ marginTop: 20, textAlign: 'center' }}>
            <AuthLink onClick={() => navigate('/forgot-password')}>
              Olvidé mi contraseña
            </AuthLink>
          </div>
        </div>

        {/* Register */}
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13 }}>No tienes cuenta? </span>
          <button
            onClick={() => navigate('/register')}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--color-fifa-teal)', fontSize: 13, fontWeight: 600,
            }}
          >
            Registrarse
          </button>
        </div>

        {/* Footer */}
        <div style={{
          textAlign: 'center', marginTop: 20,
          fontSize: 10, color: 'rgba(255,255,255,0.2)',
          letterSpacing: '0.05em',
        }}>
          Copa Mundial de la FIFA 2026™ · Canadá · México · USA
        </div>
      </div>
    </div>
  );
}
