import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { communityApi } from '../api/community';
import { getLastSeenAnnouncementId, setLastSeenAnnouncementId } from '../storage/appExperience';

export function useAnnouncementNotice() {
  const [lastSeenId, setLastSeenId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    getLastSeenAnnouncementId().then((id) => {
      setLastSeenId(id);
      setReady(true);
    });
  }, []);

  const { data: latest } = useQuery({
    queryKey: ['latest-announcement'],
    queryFn: async () => {
      const res = await communityApi.getLatestAnnouncement();
      return res.data.data;
    },
    staleTime: 60_000,
    enabled: ready,
  });

  const isUnread = Boolean(latest?.id && latest.id !== lastSeenId);

  const markSeen = async () => {
    if (!latest?.id) return;
    await setLastSeenAnnouncementId(latest.id);
    setLastSeenId(latest.id);
  };

  return { latest, isUnread, markSeen, ready };
}
