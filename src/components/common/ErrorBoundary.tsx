import { Component, type ErrorInfo, type ReactNode } from 'react';
import { FiAlertTriangle, FiRefreshCw } from 'react-icons/fi';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', {
      error: error.message,
      stack: error.stack,
      componentStack: info.componentStack,
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--color-bg, #F8FAFC)',
          padding: 24,
        }}>
          <div style={{
            maxWidth: 440,
            width: '100%',
            background: 'var(--color-card, #fff)',
            borderRadius: 16,
            boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
            padding: '40px 32px',
            textAlign: 'center',
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              background: 'rgba(220,38,38,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px',
            }}>
              <FiAlertTriangle size={28} color="#DC2626" />
            </div>

            <h2 style={{
              fontSize: 20, fontWeight: 700,
              color: 'var(--color-text, #1e293b)',
              marginBottom: 8,
            }}>
              Algo salio mal
            </h2>

            <p style={{
              fontSize: 14,
              color: 'var(--color-text-muted, #64748b)',
              marginBottom: 24,
              lineHeight: 1.5,
            }}>
              Ha ocurrido un error inesperado. Puedes intentar recargar la pagina o volver al inicio.
            </p>

            {this.state.error && (
              <details style={{
                marginBottom: 24,
                textAlign: 'left',
                background: 'var(--color-bg, #f8fafc)',
                borderRadius: 8,
                padding: '12px 16px',
                border: '1px solid var(--color-border-light, #e2e8f0)',
              }}>
                <summary style={{
                  fontSize: 12, fontWeight: 600,
                  color: 'var(--color-text-muted, #64748b)',
                  cursor: 'pointer',
                }}>
                  Detalles del error
                </summary>
                <pre style={{
                  fontSize: 11,
                  color: '#DC2626',
                  marginTop: 8,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  maxHeight: 120,
                  overflow: 'auto',
                }}>
                  {this.state.error.message}
                </pre>
              </details>
            )}

            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button
                onClick={this.handleReset}
                style={{
                  padding: '10px 20px',
                  borderRadius: 10,
                  border: '1px solid var(--color-border, #cbd5e1)',
                  background: 'var(--color-card, #fff)',
                  color: 'var(--color-text, #1e293b)',
                  fontSize: 13, fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Intentar de nuevo
              </button>
              <button
                onClick={this.handleReload}
                style={{
                  padding: '10px 20px',
                  borderRadius: 10,
                  border: 'none',
                  background: 'var(--color-fifa-blue, #017CFC)',
                  color: '#fff',
                  fontSize: 13, fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                <FiRefreshCw size={14} />
                Recargar pagina
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}