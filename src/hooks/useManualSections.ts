import { useQuery } from '@tanstack/react-query';
import { platformApi, type AppManualSection } from '../api/platform';

const STALE_MS = 5 * 60 * 1000;

export function useManualSections() {
  return useQuery({
    queryKey: ['manual-sections'],
    queryFn: async () => {
      const res = await platformApi.getManualSections();
      return res.data.data as AppManualSection[];
    },
    staleTime: STALE_MS,
  });
}
