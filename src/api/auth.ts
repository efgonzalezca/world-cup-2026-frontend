import client from './client';
import type { LoginResponse } from '../types';

export const loginApi = (email: string, password: string) =>
  client.post<LoginResponse>('/auth/login', { email, password });

export const registerApi = (data: {
  email: string;
  nickname: string;
  names: string;
  surnames: string;
  cellphone: string;
  password: string;
}) => client.post('/users', data);

export const resetPasswordApi = (email: string) =>
  client.post('/users/reset-password', { email });
