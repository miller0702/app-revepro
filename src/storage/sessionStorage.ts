import { getString, setString, removeString } from './localStorage';

const SESSION_USER_KEY = 'sessionUser';

export interface CachedSessionUser {
  id: string;
  username?: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatarId?: string | null;
  avatarUrl?: string | null;
  coverId?: string | null;
  coverUrl?: string | null;
  coverFocusX?: number;
  coverFocusY?: number;
  roles?: string[];
}

export async function getCachedSessionUser(): Promise<CachedSessionUser | undefined> {
  const raw = await getString(SESSION_USER_KEY);
  if (!raw) return undefined;
  try {
    return JSON.parse(raw) as CachedSessionUser;
  } catch {
    return undefined;
  }
}

export async function setCachedSessionUser(user: CachedSessionUser): Promise<void> {
  await setString(SESSION_USER_KEY, JSON.stringify(user));
}

export async function clearCachedSessionUser(): Promise<void> {
  await removeString(SESSION_USER_KEY);
}
