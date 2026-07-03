import 'react-native-gesture-handler';
import 'react-native-reanimated';
import { useEffect } from 'react';
import { Stack, useRouter, useRootNavigationState, useSegments } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuthStore } from '../src/stores/authStore';
import { AppThemeProvider } from '../src/providers/AppThemeProvider';
import { BootstrapGate } from '../src/components/BootstrapGate';
import { SessionKeepAlive } from '../src/components/SessionKeepAlive';
import { SystemGate } from '../src/components/SystemGate';
import { NavigationLoadingController } from '../src/components/NavigationLoadingController';
import { ToastProvider } from '../src/components/ui/ToastProvider';
import { configureNativeSplash } from '../src/utils/splash';
import { useTheme } from '../src/hooks/useTheme';
import { DrawerBackButton } from '../src/components/navigation/DrawerBackButton';

configureNativeSplash();

const queryClient = new QueryClient();

function isPublicRoute(segments: string[]) {
  const root = segments[0];
  return root === '(auth)' || root === '(system)' || root === '+not-found';
}

function AuthGate({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();
  const navigationState = useRootNavigationState();

  useEffect(() => {
    if (!navigationState?.key || isLoading) return;

    const root = segments[0];
    if (!root) return;

    if (root === '(system)') return;

    const inAuth = root === '(auth)';
    const inTerms = inAuth && segments[1] === 'terms';
    if (!isAuthenticated && !isPublicRoute(segments as string[])) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuth && !inTerms) {
      router.replace('/feed');
    }
  }, [navigationState?.key, isAuthenticated, isLoading, segments]);

  return <>{children}</>;
}

function detailHeaderOptions(title: string) {
  return {
    headerShown: true,
    title,
    headerBackVisible: false,
    headerBackButtonDisplayMode: 'minimal' as const,
    headerBackTitle: '',
    headerLeft: () => <DrawerBackButton variant="contained" />,
    headerLeftContainerStyle: { paddingLeft: 4 },
    headerTitleAlign: 'left' as const,
    headerShadowVisible: false,
  };
}

function RootStack() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerTitleStyle: { color: colors.text },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(drawer)" />
      <Stack.Screen name="(system)" />
      <Stack.Screen name="book/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="bible/index" options={{ headerShown: false }} />
      <Stack.Screen name="reader/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="podcast/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="video/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="post/[id]" options={detailHeaderOptions('Publicación')} />
      <Stack.Screen name="user/[id]" options={detailHeaderOptions('Perfil')} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
          <BootstrapGate>
            <AppThemeProvider>
              <ToastProvider />
              <NavigationLoadingController />
              <SystemGate />
              <SessionKeepAlive />
              <AuthGate>
                <RootStack />
              </AuthGate>
            </AppThemeProvider>
          </BootstrapGate>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
