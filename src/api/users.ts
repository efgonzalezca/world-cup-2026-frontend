import client from './client';
import type {
  PaginatedRanking,
  PaginatedMatchPredictions,
  PaginatedAdminUsers,
  AdminUser,
  AdminUsersParams,
  UserResultsResponse
} from '../types';

export const getRankingApi = (page = 1, limit = 20) =>
  client.get<PaginatedRanking>('/users', { params: { page, limit } });

export const getMatchPredictionsApi = (matchId: string, page = 1, limit = 30) =>
  client.get<PaginatedMatchPredictions>(`/users/matches/${matchId}`, { params: { page, limit } });

export const updateUserApi = (userId: string, data: Record<string, unknown>) =>
  client.patch(`/users/${userId}`, data);

export const uploadAvatarApi = (userId: string, base64Image: string) =>
  client.post(`/users/${userId}/avatar`, { image: base64Image });

export const getUserMatchResultsApi = (userId: string) =>
  client.get<UserResultsResponse>(`/users/${userId}/matches/results`);

export const updatePredictionApi = (
  userId: string,
  matchId: string,
  local_score: number,
  visitor_score: number,
) => client.patch(`/users/${userId}/matches/${matchId}`, { local_score, visitor_score });

export const getAdminUsersApi = (params: AdminUsersParams = {}) =>
  client.get<PaginatedAdminUsers>('/users/admin', { params });

export const getAdminUserApi = (id: string) =>
  client.get<AdminUser>(`/users/admin/${id}`);

export const setUserActiveApi = (id: string, isActive: boolean) =>
  client.patch<AdminUser>(`/users/admin/${id}/status`, { is_active: isActive });
