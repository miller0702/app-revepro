import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFIX = 'egw:';

function key(name: string) {
  return `${PREFIX}${name}`;
}

export async function getString(name: string): Promise<string | undefined> {
  const value = await AsyncStorage.getItem(key(name));
  return value ?? undefined;
}

export async function setString(name: string, value: string): Promise<void> {
  await AsyncStorage.setItem(key(name), value);
}

export async function removeString(name: string): Promise<void> {
  await AsyncStorage.removeItem(key(name));
}

export async function getNumber(name: string): Promise<number | undefined> {
  const value = await getString(name);
  if (value == null) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export async function setNumber(name: string, value: number): Promise<void> {
  await setString(name, String(value));
}

export async function getLastSync(): Promise<string | undefined> {
  return getString('lastSync');
}

export async function setLastSync(iso: string): Promise<void> {
  await setString('lastSync', iso);
}
