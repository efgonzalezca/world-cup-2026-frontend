import { useState, type ReactNode } from 'react';
import { FiEye, FiEyeOff } from 'react-icons/fi';

/**
 * Shared shell for all auth screens.
 * FIFA dark gradient background, official logo, optional title/subtitle.
 */
export default function AuthLayout({
  children,
  title,
  subtitle,
  showLogo = true,
}: {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  showLogo?: boolean;
}) {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-8"
      style={{
        background: 'var(--color-fifa-gradient)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Dot pattern */}
      <div
        style={{
          position: 'absolute', inset: 0, opacity: 0.03,
          backgroundImage: `radial-gradient(circle at 25% 25%, #fff 1px, transparent 1px),
                            radial-gradient(circle at 75% 75%, #fff 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
          pointerEvents: 'none',
        }}
      />

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 420 }}>
        {/* Logo */}
        {showLogo && (
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <img
              src="/fifa-wc2026-white.png"
              alt="Copa Mundial de la FIFA 2026"
              style={{ height: 80, margin: '0 auto', display: 'block', objectFit: 'contain' }}
            />
          </div>
        )}

        {/* Card */}
        <div
          style={{
            background: 'rgba(255,255,255,0.06)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderRadius: 16,
            border: '1px solid rgba(255,255,255,0.08)',
            padding: '32px 28px',
          }}
        >
          {title && (
            <h2 style={{ color: '#fff', fontSize: 18, fontWeight: 700, textAlign: 'center', marginBottom: subtitle ? 4 : 24 }}>
              {title}
            </h2>
          )}
          {subtitle && (
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, textAlign: 'center', marginBottom: 24 }}>
              {subtitle}
            </p>
          )}
          {children}
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: 32, fontSize: 10, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.05em' }}>
          Copa Mundial de la FIFA 2026™ · Canada · Mexico · USA
        </div>
      </div>
    </div>
  );
}

// ─── Shared styles ────────────────────────────────────────────────────────────

const LABEL_STYLE: React.CSSProperties = {
  display: 'block', fontSize: 12, fontWeight: 500,
  color: 'rgba(255,255,255,0.5)', marginBottom: 6,
};

const INPUT_BASE: React.CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  background: 'rgba(255,255,255,0.07)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 10,
  color: '#fff',
  fontSize: 14,
  outline: 'none',
  transition: 'border-color 0.15s ease',
};

function borderColor(hasError: boolean, focused: boolean) {
  if (hasError) return focused ? 'rgba(220,38,38,0.8)' : 'rgba(220,38,38,0.6)';
  return focused ? 'var(--color-fifa-teal)' : 'rgba(255,255,255,0.1)';
}

function ErrorMsg({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <div style={{ fontSize: 11, color: '#FCA5A5', marginTop: 4, paddingLeft: 2 }}>{msg}</div>;
}

// ─── Text input ───────────────────────────────────────────────────────────────

export function AuthInput({
  label,
  error,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string }) {
  const hasError = !!error;
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={LABEL_STYLE}>{label}</label>
      <input
        {...props}
        style={{
          ...INPUT_BASE,
          borderColor: borderColor(hasError, false),
          ...props.style,
        }}
        onFocus={(e) => {
          e.target.style.borderColor = borderColor(hasError, true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          e.target.style.borderColor = borderColor(hasError, false);
          props.onBlur?.(e);
        }}
      />
      <ErrorMsg msg={error} />
    </div>
  );
}

// ─── Password input with eye toggle ───────────────────────────────────────────

export function AuthPasswordInput({
  label,
  error,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string }) {
  const [visible, setVisible] = useState(false);
  const hasError = !!error;
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={LABEL_STYLE}>{label}</label>
      <div style={{ position: 'relative' }}>
        <input
          {...props}
          type={visible ? 'text' : 'password'}
          style={{
            ...INPUT_BASE,
            paddingRight: 42,
            borderColor: borderColor(hasError, false),
            ...props.style,
          }}
          onFocus={(e) => {
            e.target.style.borderColor = borderColor(hasError, true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            e.target.style.borderColor = borderColor(hasError, false);
            props.onBlur?.(e);
          }}
        />
        <button
          type="button"
          onClick={() => setVisible(!visible)}
          tabIndex={-1}
          style={{
            position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'rgba(255,255,255,0.35)', padding: 4,
            display: 'flex', alignItems: 'center',
          }}
        >
          {visible ? <FiEyeOff size={16} /> : <FiEye size={16} />}
        </button>
      </div>
      <ErrorMsg msg={error} />
    </div>
  );
}

// ─── Select ───────────────────────────────────────────────────────────────────

export function AuthSelect({
  label,
  error,
  options,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  error?: string;
  options: { value: string; label: string }[];
}) {
  const hasError = !!error;
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={LABEL_STYLE}>{label}</label>
      <select
        {...props}
        style={{
          ...INPUT_BASE,
          appearance: 'none',
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='rgba(255,255,255,0.4)' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 14px center',
          paddingRight: 36,
          borderColor: borderColor(hasError, false),
          cursor: 'pointer',
          ...props.style,
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = borderColor(hasError, true);
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = borderColor(hasError, false);
        }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} style={{ background: '#00173A', color: '#fff' }}>
            {o.label}
          </option>
        ))}
      </select>
      <ErrorMsg msg={error} />
    </div>
  );
}

// ─── Server error banner ──────────────────────────────────────────────────────

export function AuthError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <div style={{
      background: 'rgba(220,38,38,0.12)',
      border: '1px solid rgba(220,38,38,0.25)',
      color: '#FCA5A5', padding: '10px 14px',
      borderRadius: 10, fontSize: 13, marginBottom: 16,
      textAlign: 'center',
    }}>
      {message}
    </div>
  );
}

// ─── Shared button ────────────────────────────────────────────────────────────

export function AuthButton({
  children,
  loading,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }) {
  return (
    <button
      {...props}
      disabled={loading || props.disabled}
      style={{
        width: '100%',
        padding: '13px 0',
        background: 'var(--color-fifa-teal)',
        color: 'var(--color-primary)',
        border: 'none',
        borderRadius: 10,
        fontSize: 14,
        fontWeight: 700,
        cursor: loading ? 'wait' : 'pointer',
        opacity: loading || props.disabled ? 0.6 : 1,
        transition: 'all 0.15s ease',
        ...props.style,
      }}
      onMouseEnter={(e) => {
        if (!loading) e.currentTarget.style.background = 'var(--color-fifa-teal-dark)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'var(--color-fifa-teal)';
      }}
    >
      {children}
    </button>
  );
}

// ─── Shared link button ───────────────────────────────────────────────────────

export function AuthLink({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      style={{
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        color: 'rgba(255,255,255,0.4)',
        fontSize: 13,
        transition: 'color 0.15s ease',
        ...props.style,
      }}
      onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-fifa-teal)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; }}
    >
      {children}
    </button>
  );
}
