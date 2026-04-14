import client from './client';
import type { PaginatedRanking, PaginatedMatchPredictions } from '../types';

export const getRankingApi = (page = 1, limit = 20) =>
  client.get<PaginatedRanking>('/users', { params: { page, limit } });

export const getMatchPredictionsApi = (matchId: string, page = 1, limit = 30) =>
  client.get<PaginatedMatchPredictions>(`/users/matches/${matchId}`, { params: { page, limit } });

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
