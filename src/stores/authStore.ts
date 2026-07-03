import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { authApi, LoginPayload, RegisterPayload } from '../api/auth';
import { usersApi } from '../api/users';
import {
  isAuthHttpError,
  isNetworkError,
  refreshAccessToken,
  shouldClearSessionAfterRefreshFailure,
} from '../api/tokenRefresh';
import {
  clearCachedSessionUser,
  getCachedSessionUser,
  setCachedSessionUser,
  type CachedSessionUser,
} from '../storage/sessionStorage';
import { setAccessTokenCache } from '../lib/accessTokenCache';
import { prepareImageForUpload } from '../utils/prepareImageForUpload';
import type { CoverFocus } from '../utils/coverFocus';

interface User extends CachedSessionUser {}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginPayload) => Promise<void>;
  register: (data: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  clearSession: () => Promise<void>;
  restoreSession: () => Promise<void>;
  refreshSessionIfNeeded: () => Promise<void>;
  setUser: (user: User) => void;
  uploadAvatar: (uri: string, mimeType: string, fileName: string, sourceWidth?: number) => Promise<void>;
  removeAvatar: () => Promise<void>;
  uploadCover: (
    uri: string,
    mimeType: string,
    fileName: string,
    sourceWidth?: number,
    focus?: CoverFocus,
  ) => Promise<void>;
  updateCoverFocus: (focus: CoverFocus) => Promise<void>;
  removeCover: () => Promise<void>;
}

async function persistAuthTokens(accessToken: string, refreshToken: string) {
  await SecureStore.setItemAsync('accessToken', accessToken);
  await SecureStore.setItemAsync('refreshToken', refreshToken);
  setAccessTokenCache(accessToken);
}

async function fetchAndCacheUser(): Promise<User> {
  const res = await usersApi.getMe();
  const user = res.data.data as User;
  await setCachedSessionUser(user);
  return user;
}

async function hasStoredRefreshToken(): Promise<boolean> {
  return Boolean(await SecureStore.getItemAsync('refreshToken'));
}

function applyAuthenticatedUser(set: (partial: Partial<AuthState>) => void, user: User) {
  set({ user, isAuthenticated: true, isLoading: false });
}

async function tryRefreshOrClear(clearSession: () => Promise<void>): Promise<boolean> {
  const refreshed = await refreshAccessToken();
  if (refreshed.ok) return true;
  if (shouldClearSessionAfterRefreshFailure(refreshed)) {
    await clearSession();
  }
  return false;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  login: async (data) => {
    const res = await authApi.login(data);
    const { accessToken, refreshToken, user } = res.data.data;
    await persistAuthTokens(accessToken, refreshToken);
    await setCachedSessionUser(user);
    set({ user, isAuthenticated: true });
  },

  register: async (data) => {
    const res = await authApi.register(data);
    const { accessToken, refreshToken, user } = res.data.data;
    await persistAuthTokens(accessToken, refreshToken);
    await setCachedSessionUser(user);
    set({ user, isAuthenticated: true });
  },

  clearSession: async () => {
    await SecureStore.deleteItemAsync('accessToken');
    await SecureStore.deleteItemAsync('refreshToken');
    setAccessTokenCache(null);
    await clearCachedSessionUser();
    const { clearFeedCache } = await import('../storage/feedCache');
    await clearFeedCache();
    set({ user: null, isAuthenticated: false });
  },

  logout: async () => {
    await get().clearSession();
  },

  restoreSession: async () => {
    const clearSession = get().clearSession;

    try {
      const [accessToken, refreshToken, cachedUser] = await Promise.all([
        SecureStore.getItemAsync('accessToken'),
        SecureStore.getItemAsync('refreshToken'),
        getCachedSessionUser(),
      ]);

      if (!accessToken && !refreshToken) {
        setAccessTokenCache(null);
        set({ isLoading: false, isAuthenticated: false });
        return;
      }

      if (accessToken) {
        setAccessTokenCache(accessToken);
      }

      if (cachedUser) {
        applyAuthenticatedUser(set, cachedUser);
      }

      if (!accessToken && refreshToken) {
        const ok = await tryRefreshOrClear(clearSession);
        if (!ok) {
          set({ isLoading: false, isAuthenticated: false });
          return;
        }
      }

      const user = await fetchAndCacheUser();
      applyAuthenticatedUser(set, user);
    } catch (error) {
      const cachedUser = await getCachedSessionUser();
      const stillHasRefresh = await hasStoredRefreshToken();

      if (stillHasRefresh && isNetworkError(error)) {
        if (cachedUser) {
          applyAuthenticatedUser(set, cachedUser);
        } else {
          set({ isAuthenticated: true, isLoading: false });
        }
        return;
      }

      if (isAuthHttpError(error) && stillHasRefresh) {
        const ok = await tryRefreshOrClear(clearSession);
        if (ok) {
          try {
            const user = await fetchAndCacheUser();
            applyAuthenticatedUser(set, user);
            return;
          } catch (retryError) {
            if (isNetworkError(retryError) && cachedUser) {
              applyAuthenticatedUser(set, cachedUser);
              return;
            }
          }
        }
      }

      if (!stillHasRefresh) {
        await clearSession();
      }

      set({ isLoading: false, isAuthenticated: false });
    }
  },

  refreshSessionIfNeeded: async () => {
    if (!(await hasStoredRefreshToken())) return;

    const refreshed = await refreshAccessToken();
    if (!refreshed.ok) {
      if (shouldClearSessionAfterRefreshFailure(refreshed)) {
        await get().clearSession();
      }
      return;
    }

    try {
      const user = await fetchAndCacheUser();
      set({ user, isAuthenticated: true });
    } catch (error) {
      if (isAuthHttpError(error) && (await hasStoredRefreshToken())) {
        const retry = await refreshAccessToken();
        if (!retry.ok && shouldClearSessionAfterRefreshFailure(retry)) {
          await get().clearSession();
        }
      }
    }
  },

  setUser: (user) => {
    void setCachedSessionUser(user);
    set({ user });
  },

  uploadAvatar: async (uri, mimeType, fileName, sourceWidth?: number) => {
    const prepared = await prepareImageForUpload(uri, fileName, mimeType, 'avatar', sourceWidth);
    const formData = new FormData();
    formData.append('file', {
      uri: prepared.uri,
      name: prepared.fileName,
      type: prepared.mimeType,
    } as unknown as Blob);

    const res = await usersApi.uploadAvatar(formData);
    const { avatarId, avatarUrl } = res.data.data;
    const current = get().user;
    if (current) {
      const next = { ...current, avatarId, avatarUrl };
      await setCachedSessionUser(next);
      set({ user: next });
    }
  },

  removeAvatar: async () => {
    await usersApi.deleteAvatar();
    const current = get().user;
    if (current) {
      const next = { ...current, avatarId: null, avatarUrl: null };
      await setCachedSessionUser(next);
      set({ user: next });
    }
  },

  uploadCover: async (uri, mimeType, fileName, sourceWidth, focus) => {
    const prepared = await prepareImageForUpload(uri, fileName, mimeType, 'cover', sourceWidth);
    const formData = new FormData();
    formData.append('file', {
      uri: prepared.uri,
      name: prepared.fileName,
      type: prepared.mimeType,
    } as unknown as Blob);

    const res = await usersApi.uploadCover(formData);
    let coverFocusX = res.data.data.coverFocusX;
    let coverFocusY = res.data.data.coverFocusY;
    const { coverId, coverUrl } = res.data.data;

    if (focus && (focus.x !== coverFocusX || focus.y !== coverFocusY)) {
      const focusRes = await usersApi.updateCoverFocus(focus);
      coverFocusX = focusRes.data.data.coverFocusX;
      coverFocusY = focusRes.data.data.coverFocusY;
    }

    const current = get().user;
    if (current) {
      const next = { ...current, coverId, coverUrl, coverFocusX, coverFocusY };
      await setCachedSessionUser(next);
      set({ user: next });
    }
  },

  updateCoverFocus: async (focus) => {
    const res = await usersApi.updateCoverFocus(focus);
    const { coverFocusX, coverFocusY } = res.data.data;
    const current = get().user;
    if (current) {
      const next = { ...current, coverFocusX, coverFocusY };
      await setCachedSessionUser(next);
      set({ user: next });
    }
  },

  removeCover: async () => {
    await usersApi.deleteCover();
    const current = get().user;
    if (current) {
      const next = {
        ...current,
        coverId: null,
        coverUrl: null,
        coverFocusX: 50,
        coverFocusY: 50,
      };
      await setCachedSessionUser(next);
      set({ user: next });
    }
  },
}));
