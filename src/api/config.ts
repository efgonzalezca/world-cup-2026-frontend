import client from './client';

export const getPodiumDeadlineApi = () =>
  client.get<{ podium_deadline: string | null }>('/config/podium-deadline');
