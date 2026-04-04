import client from './client';
import type { Match } from '../types';

export const getMatchesApi = (phase?: string) =>
  client.get<Match[]>('/matches', { params: phase ? { phase } : {} });

export const updateMatchResultApi = (matchId: string, local_result: number, visiting_result: number) =>
  client.patch<Match>(`/matches/${matchId}`, { local_result, visiting_result });
