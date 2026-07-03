import { useQuery } from '@tanstack/react-query';
import { platformApi, type AppSection } from '../api/platform';

const STALE_MS = 5 * 60 * 1000;

export function useAppSections() {
  return useQuery({
    queryKey: ['app-sections'],
    queryFn: async () => {
      const res = await platformApi.getAppSections();
      return res.data.data;
    },
    staleTime: STALE_MS,
  });
}

export function useAppSection(code: string): AppSection | undefined {
  const { data } = useAppSections();
  return data?.find((s) => s.code === code);
}
