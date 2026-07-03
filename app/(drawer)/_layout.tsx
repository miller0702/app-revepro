import { Drawer } from 'expo-router/drawer';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useTheme } from '../../src/hooks/useTheme';
import { DrawerContent } from '../../src/components/navigation/DrawerContent';
import { OnboardingTutorial } from '../../src/components/onboarding/OnboardingTutorial';

export default function DrawerLayout() {
  const { colors } = useTheme();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <OnboardingTutorial />
      <Drawer
        drawerContent={(props) => <DrawerContent {...props} />}
        screenOptions={{
          headerShown: false,
          drawerType: 'front',
          drawerStyle: {
            width: 300,
            backgroundColor: colors.surface,
          },
          overlayColor: 'rgba(0,0,0,0.45)',
          swipeEnabled: true,
        }}
      >
        <Drawer.Screen name="(tabs)" options={{ drawerItemStyle: { display: 'none' } }} />
        <Drawer.Screen name="study-center" options={{ drawerItemStyle: { display: 'none' } }} />
        <Drawer.Screen name="downloads" options={{ drawerItemStyle: { display: 'none' } }} />
        <Drawer.Screen name="goals" options={{ drawerItemStyle: { display: 'none' } }} />
        <Drawer.Screen name="settings" options={{ drawerItemStyle: { display: 'none' } }} />
        <Drawer.Screen name="manual" options={{ drawerItemStyle: { display: 'none' } }} />
        <Drawer.Screen name="requirements" options={{ drawerItemStyle: { display: 'none' } }} />
      </Drawer>
    </GestureHandlerRootView>
  );
}
