import { getString, setString } from './localStorage';

const TUTORIAL_KEY = 'tutorialCompleted';
const ANNOUNCEMENT_KEY = 'lastSeenAnnouncementId';

export async function isTutorialCompleted(): Promise<boolean> {
  const value = await getString(TUTORIAL_KEY);
  return value === 'true';
}

export async function setTutorialCompleted(completed: boolean): Promise<void> {
  await setString(TUTORIAL_KEY, completed ? 'true' : 'false');
}

export async function getLastSeenAnnouncementId(): Promise<string | null> {
  const value = await getString(ANNOUNCEMENT_KEY);
  return value ?? null;
}

export async function setLastSeenAnnouncementId(id: string): Promise<void> {
  await setString(ANNOUNCEMENT_KEY, id);
}
