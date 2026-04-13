export default function Spinner({ size = 32, label }: { size?: number; label?: string }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: 40, gap: 12,
    }}>
      <div style={{
        width: size, height: size, borderRadius: '50%',
        border: '3px solid var(--color-border-light)',
        borderTopColor: 'var(--color-fifa-blue)',
        animation: 'spin 0.8s linear infinite',
      }} />
      {label && (
        <span style={{ fontSize: 13, color: 'var(--color-text-muted)', fontWeight: 500 }}>
          {label}
        </span>
      )}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}