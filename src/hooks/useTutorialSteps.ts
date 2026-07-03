import { useQuery } from '@tanstack/react-query';
import { platformApi, type AppTutorialStep } from '../api/platform';

const STALE_MS = 5 * 60 * 1000;

export function useTutorialSteps() {
  return useQuery({
    queryKey: ['tutorial-steps'],
    queryFn: async () => {
      const res = await platformApi.getTutorialSteps();
      return res.data.data as AppTutorialStep[];
    },
    staleTime: STALE_MS,
  });
}
