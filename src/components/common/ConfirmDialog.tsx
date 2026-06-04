import { useEffect, useRef } from 'react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary';
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'primary',
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    cancelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) onCancel();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, loading, onCancel]);

  if (!open) return null;

  const confirmBg = variant === 'danger' ? 'var(--color-error, #DC2626)' : 'var(--color-fifa-blue)';

  return (
    <div
      role="presentation"
      onMouseDown={(e) => { if (e.target === e.currentTarget && !loading) onCancel(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-desc"
        style={{
          background: 'var(--color-card)',
          borderRadius: 'var(--radius-md, 12px)',
          boxShadow: 'var(--shadow-lg, 0 20px 40px rgba(0,0,0,0.25))',
          border: '1px solid var(--color-border-light)',
          width: '100%', maxWidth: 400,
          padding: 24,
        }}
      >
        <h3
          id="confirm-dialog-title"
          style={{ fontSize: 17, fontWeight: 700, color: 'var(--color-text)', marginBottom: 8 }}
        >
          {title}
        </h3>
        <p
          id="confirm-dialog-desc"
          style={{ fontSize: 14, color: 'var(--color-text-secondary)', lineHeight: 1.5, marginBottom: 24 }}
        >
          {description}
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            ref={cancelRef}
            onClick={onCancel}
            disabled={loading}
            style={{
              padding: '9px 16px', fontSize: 13, fontWeight: 600,
              borderRadius: 8, cursor: loading ? 'default' : 'pointer',
              background: 'var(--color-bg)', color: 'var(--color-text)',
              border: '1px solid var(--color-border)',
              opacity: loading ? 0.6 : 1,
            }}
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            style={{
              padding: '9px 16px', fontSize: 13, fontWeight: 600,
              borderRadius: 8, cursor: loading ? 'default' : 'pointer',
              background: confirmBg, color: '#fff', border: 'none',
              opacity: loading ? 0.6 : 1,
              minWidth: 96,
            }}
          >
            {loading ? '...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}