import type { Match, MatchPhase } from '../types';

export function computeAliveTeams(matches: Match[]): {
  alive: Set<string>;
  eliminated: Set<string>;
} {
  const eliminated = new Set<string>();
  const alive = new Set<string>();

  for (const m of matches) {
    if (m.local_team_id) alive.add(m.local_team_id);
    if (m.visiting_team_id) alive.add(m.visiting_team_id);

    const loser = getLoser(m);
    if (loser) eliminated.add(loser);
  }

  for (const id of eliminated) alive.delete(id);

  return { alive, eliminated };
}

function getLoser(m: Match): string | null {
  if (
    m.phase === 'group' ||
    !m.has_played ||
    m.local_team_id == null ||
    m.visiting_team_id == null ||
    m.local_result == null ||
    m.visiting_result == null ||
    m.local_result === m.visiting_result
  ) {
    return null;
  }
  return m.local_result < m.visiting_result ? m.local_team_id : m.visiting_team_id;
}

const KNOCKOUT_CHAIN: MatchPhase[] = ['round_of_32', 'round_of_16', 'quarter', 'semi', 'final'];

export function getPreviousKnockoutPhase(phase: MatchPhase): MatchPhase | null {
  if (phase === 'third_place') return 'semi';
  const idx = KNOCKOUT_CHAIN.indexOf(phase);
  if (idx <= 0) return null;
  return KNOCKOUT_CHAIN[idx - 1];
}

export function computePhaseCandidates(matches: Match[], phase: MatchPhase): {
  candidates: Set<string> | null;
  eliminated: Set<string>;
} {
  const prev = getPreviousKnockoutPhase(phase);
  if (!prev) return { candidates: null, eliminated: new Set() };

  const prevMatches = matches.filter((m) => m.phase === prev);

  if (phase === 'third_place') {
    const losers = new Set<string>();
    for (const m of prevMatches) {
      const loser = getLoser(m);
      if (loser) losers.add(loser);
    }
    return { candidates: losers, eliminated: new Set() };
  }

  const candidates = new Set<string>();
  const eliminated = new Set<string>();
  for (const m of prevMatches) {
    if (m.local_team_id) candidates.add(m.local_team_id);
    if (m.visiting_team_id) candidates.add(m.visiting_team_id);
    const loser = getLoser(m);
    if (loser) eliminated.add(loser);
  }
  return { candidates, eliminated };
}