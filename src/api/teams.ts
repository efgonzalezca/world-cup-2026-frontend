import client from './client';
import type { Team, TournamentGroup } from '../types';

export const getTeamsApi = (group?: string) =>
  client.get<Team[]>('/teams', { params: group ? { group } : {} });

export const getGroupsApi = () =>
  client.get<TournamentGroup[]>('/teams/groups');
