import client from './client';
import type { RankingEntry, UserMatch } from '../types';

export const getRankingApi = () =>
  client.get<RankingEntry[]>('/users');

export const getMatchPredictionsApi = (matchId: string) =>
  client.get<UserMatch[]>(`/users/matches/${matchId}`);

export const updateUserApi = (userId: string, data: Record<string, unknown>) =>
  client.patch(`/users/${userId}`, data);

export const uploadAvatarApi = (userId: string, base64Image: string) =>
  client.post(`/users/${userId}/avatar`, { image: base64Image });

export const updatePredictionApi = (
  userId: string,
  matchId: string,
  local_score: number,
  visitor_score: number,
) => client.patch(`/users/${userId}/matches/${matchId}`, { local_score, visitor_score });
