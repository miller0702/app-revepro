import type { ExpoConfig } from 'expo/config';

const EAS_PROJECT_ID = '44e09983-b9ac-42e6-bd2a-1e4874c59822';

export default ({ config }: { config: ExpoConfig }): ExpoConfig => ({
  ...config,
  name: 'RESVEPRO',
  slug: 'resvepro',
  owner: 'miller07',
  extra: {
    ...config.extra,
    egwEnv: process.env.EGW_ENV ?? 'development',
    eas: {
      projectId: EAS_PROJECT_ID,
    },
  },
});
