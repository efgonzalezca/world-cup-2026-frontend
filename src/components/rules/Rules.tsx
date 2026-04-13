import { useState } from 'react';
import { FiChevronDown, FiChevronUp } from 'react-icons/fi';

interface Section {
  title: string;
  icon: string;
  content: React.ReactNode;
}

function Accordion({ section, open, onToggle }: { section: Section; open: boolean; onToggle: () => void }) {
  return (
    <div style={{
      background: 'var(--color-card)',
      border: '1px solid var(--color-border-light)',
      borderRadius: 'var(--radius-md)',
      boxShadow: 'var(--shadow-sm)',
      overflow: 'hidden',
    }}>
      <button
        onClick={onToggle}
        style={{
          width: '100%', textAlign: 'left',
          padding: '16px 18px',
          display: 'flex', alignItems: 'center', gap: 12,
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--color-text)',
        }}
      >
        <span style={{ fontSize: 18, flexShrink: 0 }}>{section.icon}</span>
        <span style={{ flex: 1, fontSize: 14, fontWeight: 600 }}>{section.title}</span>
        {open
          ? <FiChevronUp size={16} style={{ color: 'var(--color-fifa-blue)', flexShrink: 0 }} />
          : <FiChevronDown size={16} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
        }
      </button>
      {open && (
        <div style={{ padding: '0 18px 18px' }}>{section.content}</div>
      )}
    </div>
  );
}

function Badge({ pts, color }: { pts: number | string; color: string }) {
  return (
    <span style={{
      display: 'inline-block', padding: '2px 10px',
      borderRadius: 99, fontSize: 12, fontWeight: 700,
      background: color === 'gold' ? 'var(--color-gold-bg)'
        : color === 'success' ? 'var(--color-success-bg)'
        : color === 'silver' ? 'var(--color-silver-bg)'
        : color === 'bronze' ? 'var(--color-bronze-bg)'
        : 'var(--color-bg)',
      color: color === 'gold' ? 'var(--color-gold)'
        : color === 'success' ? 'var(--color-success)'
        : color === 'silver' ? 'var(--color-silver)'
        : color === 'bronze' ? 'var(--color-bronze)'
        : 'var(--color-text-muted)',
    }}>
      {pts} pts
    </span>
  );
}

function Row({ label, pts, color }: { label: string; pts: number | string; color: string }) {
  return (
    <div className="flex items-center justify-between" style={{ padding: '10px 14px', borderRadius: 'var(--radius-sm)', background: 'var(--color-bg)' }}>
      <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>{label}</span>
      <Badge pts={pts} color={color} />
    </div>
  );
}

export default function Rules() {
  const [openSection, setOpenSection] = useState<number | null>(0);

  const sections: (Section)[] = [
    {
      title: 'Sistema de Puntuación por Partido',
      icon: '⚽',
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 4, lineHeight: 1.5 }}>
            Cada partido otorga un máximo de <strong style={{ color: 'var(--color-text)' }}>7 puntos</strong>. La puntuación es idéntica para todas las fases.
          </p>
          <Row label="Acertar resultado (G / E / P)" pts={2} color="success" />
          <Row label="Acertar goles equipo local" pts={1} color="success" />
          <Row label="Acertar goles equipo visitante" pts={1} color="success" />
          <Row label="Bonus marcador exacto" pts={3} color="gold" />
          <Row label="Bonus empate no exacto" pts={1} color="gold" />
          <p style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2, lineHeight: 1.5, fontStyle: 'italic' }}>
            El bonus de empate se otorga cuando predices empate y el resultado es empate, pero no aciertas el marcador exacto. Equilibra que en empates no exactos nunca puedas obtener puntos por gol individual.
          </p>
          <div style={{
            marginTop: 4, padding: '10px 14px', borderRadius: 'var(--radius-sm)',
            background: 'var(--color-fifa-blue)', color: '#fff',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>Máximo por partido</span>
            <span style={{ fontSize: 16, fontWeight: 800 }}>7 pts</span>
          </div>
        </div>
      ),
    },
    {
      title: 'Puntos de Podio',
      icon: '🏆',
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 4, lineHeight: 1.5 }}>
            Se suman al total una vez finalizado el torneo.
          </p>
          <Row label="🥇 Campeón" pts={30} color="gold" />
          <Row label="🥈 Subcampeón" pts={20} color="silver" />
          <Row label="🥉 Tercer lugar" pts={10} color="bronze" />
        </div>
      ),
    },
    {
      title: 'Distribución de Premios',
      icon: '💰',
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 4, lineHeight: 1.5 }}>
            Distribución informativa según número de participantes.
          </p>
          <Row label="🥇 1er lugar" pts="50%" color="gold" />
          <Row label="🥈 2do lugar" pts="30%" color="silver" />
          <Row label="🥉 3er lugar" pts="20%" color="bronze" />
        </div>
      ),
    },
    {
      title: 'Ejemplos de Cálculo',
      icon: '📊',
      content: (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 4px', fontSize: 13 }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '8px 12px', fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Predicción</th>
                <th style={{ textAlign: 'center', padding: '8px 12px', fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Real</th>
                <th style={{ textAlign: 'center', padding: '8px 12px', fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Pts</th>
                <th style={{ textAlign: 'left', padding: '8px 12px', fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Desglose</th>
              </tr>
            </thead>
            <tbody>
              {[
                { pred: '2-1', real: '2-1', pts: 7, desc: 'Res(2) + L(1) + V(1) + Ex(3)', color: 'gold' },
                { pred: '1-1', real: '1-1', pts: 7, desc: 'Res(2) + L(1) + V(1) + Ex(3)', color: 'gold' },
                { pred: '0-0', real: '1-1', pts: 3, desc: 'Res(2) + Emp(1)', color: 'success' },
                { pred: '2-2', real: '3-3', pts: 3, desc: 'Res(2) + Emp(1)', color: 'success' },
                { pred: '2-0', real: '3-1', pts: 2, desc: 'Res(2)', color: 'success' },
                { pred: '2-1', real: '2-0', pts: 3, desc: 'Res(2) + L(1)', color: 'success' },
                { pred: '1-0', real: '0-2', pts: 0, desc: 'Nada', color: 'muted' },
              ].map((row, i) => (
                <tr key={i}>
                  <td style={{ padding: '8px 12px', background: 'var(--color-bg)', borderRadius: '6px 0 0 6px', fontWeight: 600, color: 'var(--color-text)' }}>{row.pred}</td>
                  <td style={{ padding: '8px 12px', background: 'var(--color-bg)', textAlign: 'center', color: 'var(--color-text-secondary)' }}>{row.real}</td>
                  <td style={{ padding: '8px 12px', background: 'var(--color-bg)', textAlign: 'center' }}>
                    <Badge pts={row.pts} color={row.color} />
                  </td>
                  <td style={{ padding: '8px 12px', background: 'var(--color-bg)', borderRadius: '0 6px 6px 0', fontSize: 11, color: 'var(--color-text-muted)' }}>{row.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ),
    },
    {
      title: 'Reglas Generales',
      icon: '📋',
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            'Las predicciones se bloquean al inicio de cada partido',
            'Puedes modificar tus predicciones sin límite antes del bloqueo',
            'La puntuación es uniforme para todas las fases del torneo',
            'El marcador válido es hasta el minuto 90 + tiempo adicional. Tiempo extra y penaltis no cuentan para el cálculo de puntos',
            'El ranking se actualiza en tiempo real al registrar resultados',
            'La predicción de podio tiene fecha límite por definir',
            'Puntaje total = puntaje de partidos + puntaje de podio',
          ].map((rule, i) => (
            <div key={i} className="flex items-start" style={{ gap: 10 }}>
              <span style={{
                width: 22, height: 22, borderRadius: '50%',
                background: 'var(--color-fifa-blue-light)',
                color: 'var(--color-fifa-blue)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700, flexShrink: 0,
                marginTop: 1,
              }}>
                {i + 1}
              </span>
              <span style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>{rule}</span>
            </div>
          ))}
        </div>
      ),
    },
  ];

  return (
    <div style={{ maxWidth: 780, margin: '0 auto' }}>
      <div>
        <h2 className="text-2xl font-bold" style={{ color: 'var(--color-text)', marginBottom: 8, textAlign: 'center' }}>
          Reglamento
        </h2>
        <p style={{ fontSize: 13, color: 'var(--color-text-muted)', textAlign: 'center', marginBottom: 20 }}>
          Conoce cómo se calculan los puntos y las reglas del torneo
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {sections.map((section, index) => (
            <Accordion
              key={index}
              section={section}
              open={openSection === index}
              onToggle={() => setOpenSection(openSection === index ? null : index)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
