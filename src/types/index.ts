export interface User {
  id: string;
  email: string;
  nickname: string;
  role: 'admin' | 'user';
  names: string;
  surnames: string;
  cellphone: string;
  score: number;
  podium_score: number;
  profile_image: string | null;
  is_active: boolean;
  is_temp_password: boolean;
  predictions?: UserMatch[];
  podium?: UserPodium;
}

export interface Team {
  id: string;
  name: string;
  image: string | null;
  fifa_rank: number;
  group_code: string;
  group?: TournamentGroup;
}

export interface TournamentGroup {
  id: string;
  name: string;
  teams?: Team[];
}

export interface Match {
  id: string;
  phase: MatchPhase;
  group_code: string | null;
  match_date: string;
  local_team_id: string | null;
  visiting_team_id: string | null;
  local_result: number | null;
  visiting_result: number | null;
  has_played: boolean;
  local_team: Team | null;
  visiting_team: Team | null;
  group: TournamentGroup | null;
}

export type MatchPhase = 'group' | 'round_of_32' | 'round_of_16' | 'quarter' | 'semi' | 'third_place' | 'final';

export interface UserMatch {
  id: string;
  user_id: string;
  match_id: string;
  local_score: number | null;
  visitor_score: number | null;
  points: number;
  discriminated_points: DiscriminatedPoints | null;
  user?: { id: string; nickname: string };
}

export interface DiscriminatedPoints {
  resultPoints: number;
  localScorePoints: number;
  visitorScorePoints: number;
  exactScoreBonus: number;
  drawBonus: number;
}

export interface UserPodium {
  id: string;
  user_id: string;
  champion_team_id: string | null;
  runner_up_team_id: string | null;
  third_place_team_id: string | null;
  champion_team?: Team;
  runner_up_team?: Team;
  third_place_team?: Team;
}

export interface RankingEntry {
  id: string;
  nickname: string;
  score: number;
  podium_score: number;
  total_score: number;
  profile_image?: string | null;
}

export interface LoginResponse {
  access_token: string;
  user: User;
  is_temp_password: boolean;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<LoginResponse>;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
}
