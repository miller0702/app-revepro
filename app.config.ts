export default ({ config }: { config: Record<string, unknown> }) => ({
  ...config,
  name: 'RESVEPRO',
  slug: 'resvepro',
  extra: {
    egwEnv: process.env.EGW_ENV ?? 'development',
  },
});
