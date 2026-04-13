import { useEffect, useMemo, useState, useRef, useCallback, memo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getRankingApi } from '../../api/users';
import { getMatchesApi } from '../../api/matches';
import { useSocket } from '../../hooks/useSocket';
import { useAuth } from '../../context/AuthContext';
import { FiTrendingUp, FiCheckCircle, FiActivity } from 'react-icons/fi';

const API_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000`;

type TournamentState = 'upcoming' | 'live' | 'in_progress' | 'finished';

function getTournamentState(matches: { has_played: boolean; match_date: string }[]): TournamentState {
  if (!matches.length) return 'upcoming';
  const now = new Date();
  const allPlayed = matches.every((m) => m.has_played);
  if (allPlayed) return 'finished';
  const anyLive = matches.some((m) => !m.has_played && now >= new Date(m.match_date));
  if (anyLive) return 'live';
  const anyPlayed = matches.some((m) => m.has_played);
  return anyPlayed ? 'in_progress' : 'upcoming';
}

const STATE_BADGE: Record<TournamentState, { label: string; icon: typeof FiTrendingUp; color: string; bg: string; pulse?: boolean }> = {
  upcoming:    { label: 'Próximamente', icon: FiActivity,    color: 'var(--color-text-muted)',  bg: 'var(--color-card-alt)' },
  in_progress: { label: 'En curso',     icon: FiTrendingUp,  color: 'var(--color-fifa-blue)',   bg: 'var(--color-fifa-blue-light)' },
  live:        { label: 'En vivo',      icon: FiActivity,    color: '#F59E0B',                  bg: 'rgba(245,158,11,0.1)', pulse: true },
  finished:    { label: 'Finalizado',   icon: FiCheckCircle, color: 'var(--color-success)',     bg: 'var(--color-success-bg)' },
};

function resolveAvatar(src: string | null | undefined): string | null {
  if (!src) return null;
  return `${API_URL}${src}`;
}

function Avatar({ nickname, image, size = 34, color = 'var(--color-fifa-blue)', bg = 'var(--color-fifa-blue-light)' }: {
  nickname: string; image?: string | null; size?: number; color?: string; bg?: string;
}) {
  const src = resolveAvatar(image);
  if (src) {
    return <img src={src} alt="" style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />;
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: bg, color,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.38, fontWeight: 700, flexShrink: 0,
    }}>
      {nickname.charAt(0).toUpperCase()}
    </div>
  );
}

const MEDAL_EMOJI: Record<number, string> = { 0: '\uD83E\uDD47', 1: '\uD83E\uDD48', 2: '\uD83E\uDD49' };

interface RankingEntry {
  id: string;
  nickname: string;
  score: number;
  podium_score: number;
  total_score: number;
  profile_image?: string | null;
}

const RankingRow = memo(function RankingRow({ entry, index, isCurrentUser }: {
  entry: RankingEntry; index: number; isCurrentUser: boolean;
}) {
  return (
    <div
      className="flex items-center"
      style={{
        padding: '10px 16px',
        background: isCurrentUser
          ? 'rgba(1,124,252,0.08)'
          : index < 3
            ? index === 0 ? 'rgba(245,158,11,0.04)' : index === 1 ? 'rgba(148,163,184,0.04)' : 'rgba(217,119,6,0.04)'
            : index % 2 === 0 ? 'transparent' : 'var(--color-bg)',
        borderLeft: isCurrentUser ? '3px solid var(--color-fifa-blue)' : '3px solid transparent',
      }}
    >
      {/* Position */}
      <div style={{ width: 32, flexShrink: 0, textAlign: 'center' }}>
        {index < 3 ? (
          <span style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 24, height: 24, borderRadius: '50%', fontSize: 11, fontWeight: 700,
            background: index === 0 ? 'var(--color-gold-bg)' : index === 1 ? 'var(--color-silver-bg)' : 'var(--color-bronze-bg)',
            color: index === 0 ? 'var(--color-gold)' : index === 1 ? 'var(--color-silver)' : 'var(--color-bronze)',
          }}>
            {index + 1}
          </span>
        ) : (
          <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{index + 1}</span>
        )}
      </div>

      {/* Avatar + Name */}
      <div className="flex items-center" style={{ flex: 1, gap: 8, paddingLeft: 8, minWidth: 0 }}>
        <Avatar nickname={entry.nickname} image={entry.profile_image} size={30} />
        <span style={{
          fontSize: 13, fontWeight: isCurrentUser ? 800 : index < 3 ? 700 : 600,
          color: isCurrentUser ? 'var(--color-fifa-blue)' : 'var(--color-text)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {entry.nickname}
          {isCurrentUser && <span style={{ fontSize: 10, marginLeft: 4, opacity: 0.7 }}>(Tú)</span>}
        </span>
      </div>

      {/* Points columns */}
      <div style={{
        width: 52, textAlign: 'center', fontSize: 13, fontVariantNumeric: 'tabular-nums', flexShrink: 0,
        color: 'var(--color-text-secondary)',
      }}>
        {entry.score}
      </div>
      <div style={{
        width: 52, textAlign: 'center', fontSize: 13, fontVariantNumeric: 'tabular-nums', flexShrink: 0,
        color: entry.podium_score > 0 ? 'var(--color-fifa-magenta)' : 'var(--color-text-muted)',
        fontWeight: entry.podium_score > 0 ? 700 : 400,
      }}>
        {entry.podium_score}
      </div>
      <div style={{
        width: 56, textAlign: 'center', fontSize: 14, fontWeight: 800, fontVariantNumeric: 'tabular-nums', flexShrink: 0,
        color: index === 0 ? 'var(--color-gold)' : index === 1 ? 'var(--color-silver)' : index === 2 ? 'var(--color-bronze)' : 'var(--color-fifa-blue)',
      }}>
        {entry.total_score}
      </div>
    </div>
  );
});

export default function RankingTable() {
  const { user } = useAuth();
  const [tick, setTick] = useState(0);
  const tableRef = useRef<HTMLDivElement>(null);
  const [showStickyBar, setShowStickyBar] = useState(false);

  const { data: ranking, refetch } = useQuery({
    queryKey: ['ranking'],
    queryFn: () => getRankingApi().then((r) => r.data),
  });

  const { data: allMatches, refetch: refetchMatches } = useQuery({
    queryKey: ['matches-all'],
    queryFn: () => getMatchesApi().then((r) => r.data),
    staleTime: 30_000,
  });

  useSocket({
    'ranking.updated': () => refetch(),
    'score.updated': () => { refetch(); refetchMatches(); },
    'match.result': () => { refetchMatches(); refetch(); },
  });

  const nextKickoff = useMemo(() => {
    if (!allMatches?.length) return null;
    const now = Date.now();
    const upcoming = allMatches
      .filter((m) => !m.has_played && new Date(m.match_date).getTime() > now)
      .map((m) => new Date(m.match_date).getTime());
    return upcoming.length ? Math.min(...upcoming) : null;
  }, [allMatches, tick]);

  useEffect(() => {
    if (!nextKickoff) return;
    const delay = nextKickoff - Date.now() + 1000;
    if (delay <= 0) { setTick((t) => t + 1); return; }
    const safeDelay = Math.min(delay, 2_147_483_647);
    const timer = setTimeout(() => {
      setTick((t) => t + 1);
      refetchMatches();
    }, safeDelay);
    return () => clearTimeout(timer);
  }, [nextKickoff, refetchMatches]);

  // Find current user's position
  const currentUserIndex = useMemo(
    () => ranking?.findIndex((e) => e.id === user?.id) ?? -1,
    [ranking, user?.id],
  );
  const currentUserEntry = currentUserIndex >= 0 ? ranking![currentUserIndex] : null;

  // Detect if user row is visible in the table
  const userRowRef = useRef<HTMLDivElement>(null);

  const checkVisibility = useCallback(() => {
    if (!userRowRef.current || !tableRef.current) {
      setShowStickyBar(currentUserIndex > 5);
      return;
    }
    const tableRect = tableRef.current.getBoundingClientRect();
    const rowRect = userRowRef.current.getBoundingClientRect();
    const isVisible = rowRect.top >= tableRect.top - 10 && rowRect.bottom <= window.innerHeight + 10;
    setShowStickyBar(!isVisible);
  }, [currentUserIndex]);

  useEffect(() => {
    checkVisibility();
    window.addEventListener('scroll', checkVisibility, { passive: true });
    return () => window.removeEventListener('scroll', checkVisibility);
  }, [checkVisibility]);

  const tournamentState = getTournamentState(allMatches || []);
  const badge = STATE_BADGE[tournamentState];
  const isFinished = tournamentState === 'finished';

  const top3 = ranking?.slice(0, 3) || [];

  const podiumConfig = [
    { index: 1, label: '2do', color: 'var(--color-silver)', bg: 'var(--color-silver-bg)', height: 80, desktopH: 110, order: 1 },
    { index: 0, label: '1ro', color: 'var(--color-gold)',   bg: 'var(--color-gold-bg)',   height: 100, desktopH: 140, order: 2 },
    { index: 2, label: '3ro', color: 'var(--color-bronze)', bg: 'var(--color-bronze-bg)', height: 64,  desktopH: 88,  order: 3 },
  ];

  const BadgeIcon = badge.icon;

  return (
    <div style={{ maxWidth: 860, margin: '0 auto' }}>
      {/* HEADER */}
      <div className="flex items-center justify-between" style={{ marginBottom: 24 }}>
        <div>
          <h2 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>Clasificación</h2>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)', marginTop: 2 }}>
            {isFinished ? 'Resultado final del torneo' : 'Ranking en tiempo real'}
          </p>
        </div>
        <div className="flex items-center gap-2" style={{
          padding: '6px 14px', borderRadius: 99,
          background: badge.bg, color: badge.color,
          fontSize: 12, fontWeight: 600,
          animation: badge.pulse ? 'badgePulse 2s ease-in-out infinite' : undefined,
        }}>
          {badge.pulse && (
            <span style={{
              width: 8, height: 8, borderRadius: '50%',
              background: badge.color,
              animation: 'pulse 2s infinite',
              flexShrink: 0,
            }} />
          )}
          {!badge.pulse && <BadgeIcon size={14} />}
          <span>{badge.label}</span>
        </div>
      </div>

      {/* PODIUM */}
      {top3.length >= 3 && (
        <div style={{
          background: isFinished ? 'var(--color-fifa-gradient)' : 'var(--color-card)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: isFinished ? 'var(--shadow-lg)' : 'var(--shadow-sm)',
          border: isFinished ? 'none' : '1px solid var(--color-border-light)',
          padding: '28px 16px 16px',
          marginBottom: 24,
          position: 'relative',
          overflow: 'hidden',
        }}>
          {isFinished && (
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 28, lineHeight: 1 }}>{'\uD83C\uDFC6'}</div>
              <div style={{
                fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
                letterSpacing: '0.15em', color: 'var(--color-fifa-teal)', marginTop: 6,
              }}>
                Podio de Campeones
              </div>
            </div>
          )}

          <div className="flex items-end justify-center" style={{ gap: 10 }}>
            {podiumConfig.map(({ index, label, color, bg, height, desktopH, order }) => {
              const entry = top3[index];
              if (!entry) return null;
              const isChamp = index === 0;
              const isCurrent = entry.id === user?.id;
              const textColor = isFinished ? '#fff' : 'var(--color-text)';
              const scoreColor = isFinished ? 'var(--color-fifa-teal)' : color;
              const pillarBg = isFinished ? `${color}30` : bg;
              const pillarBorder = isFinished ? `${color}50` : `${color}20`;

              return (
                <div key={entry.id} className="flex flex-col items-center" style={{ order, flex: 1, minWidth: 0, maxWidth: 160 }}>
                  <div style={{ fontSize: isChamp ? 24 : 18, lineHeight: 1, marginBottom: 4 }}>
                    {MEDAL_EMOJI[index]}
                  </div>
                  <div style={{ position: 'relative' }}>
                    <Avatar
                      nickname={entry.nickname}
                      image={entry.profile_image}
                      size={isChamp ? 56 : 44}
                      color={color}
                      bg={isFinished ? `${color}30` : bg}
                    />
                    {isFinished && isChamp && (
                      <div style={{
                        position: 'absolute', top: -8, left: '50%', transform: 'translateX(-50%)',
                        fontSize: 18, lineHeight: 1,
                      }}>
                        {'\uD83D\uDC51'}
                      </div>
                    )}
                  </div>
                  <div style={{
                    fontSize: 12, fontWeight: isCurrent ? 800 : 700,
                    color: isCurrent && !isFinished ? 'var(--color-fifa-blue)' : textColor,
                    marginTop: 6, marginBottom: 2,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    maxWidth: '100%', textAlign: 'center',
                  }}>
                    {entry.nickname}
                    {isCurrent && <span style={{ fontSize: 9, marginLeft: 3, opacity: 0.7 }}>(Tú)</span>}
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: scoreColor, marginBottom: 8, fontVariantNumeric: 'tabular-nums' }}>
                    {entry.total_score}
                    <span style={{ fontSize: 10, fontWeight: 600, marginLeft: 2, opacity: 0.7 }}>pts</span>
                  </div>
                  <div className="podium-pillar" style={{
                    width: '100%',
                    height,
                    background: pillarBg, borderRadius: '10px 10px 0 0',
                    display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
                    paddingBottom: 10,
                    border: `1px solid ${pillarBorder}`,
                    borderBottom: 'none',
                    ['--desktop-h' as string]: `${desktopH}px`,
                  }}>
                    <span style={{
                      fontSize: 11, fontWeight: 800, textTransform: 'uppercase',
                      letterSpacing: '0.1em', color,
                    }}>
                      {label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* STICKY BAR - shows current user's position when scrolled past */}
      {showStickyBar && currentUserEntry && (
        <div
          onClick={() => userRowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
          style={{
            position: 'sticky', top: 56, zIndex: 30,
            background: 'var(--color-primary)',
            borderRadius: 10,
            padding: '8px 16px',
            marginBottom: 12,
            display: 'flex', alignItems: 'center',
            cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
            animation: 'fadeIn 0.2s ease',
          }}
        >
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: 'rgba(1,124,252,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 800, color: '#fff', flexShrink: 0,
          }}>
            {currentUserIndex + 1}
          </div>
          <div className="flex items-center" style={{ flex: 1, gap: 8, paddingLeft: 10, minWidth: 0 }}>
            <Avatar nickname={currentUserEntry.nickname} image={currentUserEntry.profile_image} size={26}
              color="#fff" bg="rgba(1,124,252,0.3)" />
            <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>
              {currentUserEntry.nickname}
            </span>
          </div>
          <div style={{ fontSize: 15, fontWeight: 900, color: 'var(--color-fifa-teal)', fontVariantNumeric: 'tabular-nums' }}>
            {currentUserEntry.total_score}
            <span style={{ fontSize: 10, fontWeight: 600, marginLeft: 2, opacity: 0.7 }}>pts</span>
          </div>
        </div>
      )}

      {/* TABLE */}
      <div ref={tableRef} style={{
        background: 'var(--color-card)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-sm)',
        border: '1px solid var(--color-border-light)',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div className="flex items-center" style={{
          padding: '10px 16px',
          borderBottom: '1px solid var(--color-border)',
          fontSize: 10, fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '0.08em',
          color: 'var(--color-text-muted)',
        }}>
          <div style={{ width: 32, flexShrink: 0, textAlign: 'center' }}>#</div>
          <div style={{ flex: 1, paddingLeft: 8 }}>Participante</div>
          <div style={{ width: 52, textAlign: 'center', flexShrink: 0 }}>Pts</div>
          <div style={{ width: 52, textAlign: 'center', flexShrink: 0 }}>Podio</div>
          <div style={{ width: 56, textAlign: 'center', flexShrink: 0 }}>Total</div>
        </div>

        {/* Rows */}
        {ranking?.map((entry, index) => {
          const isCurrentUser = entry.id === user?.id;
          return (
            <div
              key={entry.id}
              ref={isCurrentUser ? userRowRef : undefined}
              style={{
                borderBottom: index < (ranking?.length || 0) - 1 ? '1px solid var(--color-border-light)' : 'none',
              }}
            >
              <RankingRow entry={entry} index={index} isCurrentUser={isCurrentUser} />
            </div>
          );
        })}

        {(!ranking || ranking.length === 0) && (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 13 }}>
            No hay participantes registrados
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}