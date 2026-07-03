import { useCallback } from 'react';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../stores/authStore';

export function useOpenUserProfile() {
  const router = useRouter();
  const myId = useAuthStore((s) => s.user?.id);

  return useCallback(
    (userId: string) => {
      if (!userId) return;
      if (userId === myId) {
        router.push('/(drawer)/(tabs)/profile');
        return;
      }
      router.push(`/user/${userId}`);
    },
    [myId, router],
  );
}
