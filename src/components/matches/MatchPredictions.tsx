import { useQuery } from '@tanstack/react-query';
import { getMatchPredictionsApi } from '../../api/users';

interface Props {
  matchId: string;
  onClose: () => void;
}

export default function MatchPredictions({ matchId, onClose }: Props) {
  const { data: predictions, isLoading } = useQuery({
    queryKey: ['matchPredictions', matchId],
    queryFn: () => getMatchPredictionsApi(matchId).then((r) => r.data),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="w-full max-w-lg rounded-2xl p-6 max-h-[80vh] overflow-y-auto" style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-lg)' }}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>Predicciones</h3>
          <button onClick={onClose} className="cursor-pointer bg-transparent border-none text-xl" style={{ color: 'var(--color-text-muted)' }}>x</button>
        </div>

        {isLoading ? (
          <p style={{ color: 'var(--color-text-muted)' }}>Cargando...</p>
        ) : (
          <div className="space-y-2">
            {predictions?.data?.map((p) => (
              <div key={p.id} className="flex justify-between items-center p-3 rounded-lg" style={{ background: 'var(--color-bg)' }}>
                <span className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>{p.user?.nickname}</span>
                <div className="flex items-center gap-3">
                  <span className="text-sm" style={{ color: 'var(--color-text)' }}>
                    {p.local_score ?? '-'} - {p.visitor_score ?? '-'}
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded" style={{ background: 'var(--color-success-bg)', color: 'var(--color-success)' }}>
                    {p.points} pts
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
