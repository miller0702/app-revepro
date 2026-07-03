import { ActivityIndicator, Modal, StyleSheet, View } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

interface NavigationLoadingOverlayProps {
  visible: boolean;
}

export function NavigationLoadingOverlay({ visible }: NavigationLoadingOverlayProps) {
  const { colors, isDark } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => undefined}
    >
      <View
        style={[
          styles.overlay,
          {
            backgroundColor: isDark ? 'rgba(12, 15, 20, 0.28)' : 'rgba(247, 243, 236, 0.4)',
          },
        ]}
        accessibilityLabel="Cargando pantalla"
        accessibilityRole="progressbar"
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
