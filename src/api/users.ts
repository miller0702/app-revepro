import { apiClient } from './client';
import type { CoverFocus } from '../utils/coverFocus';

export const usersApi = {
  uploadAvatar: (formData: FormData) =>
    apiClient.post<{ data: { avatarId: string; avatarUrl: string } }>('/users/me/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  deleteAvatar: () =>
    apiClient.delete<{ data: { avatarId: null; avatarUrl: null } }>('/users/me/avatar'),

  uploadCover: (formData: FormData) =>
    apiClient.post<{
      data: { coverId: string; coverUrl: string; coverFocusX: number; coverFocusY: number };
    }>('/users/me/cover', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  updateCoverFocus: (focus: CoverFocus) =>
    apiClient.patch<{
      data: { coverFocusX: number; coverFocusY: number; coverUrl: string | null };
    }>('/users/me/cover/focus', {
      coverFocusX: focus.x,
      coverFocusY: focus.y,
    }),

  deleteCover: () =>
    apiClient.delete<{
      data: { coverId: null; coverUrl: null; coverFocusX: number; coverFocusY: number };
    }>('/users/me/cover'),

  getMe: () => apiClient.get('/users/me'),
};
