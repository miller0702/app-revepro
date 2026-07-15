import { View, Text, Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { useModalTopInset } from '../../hooks/useSafeAreaLayout';
import { AppIcon } from './AppIcon';
import { spacing, typography } from '../../theme/tokens';

type ModalSafeScreenProps = {
  children: React.ReactNode;
  /** Fondo del área segura (debajo del status bar). */
  backgroundColor?: string;
  style?: StyleProp<ViewStyle>;
};

/**
 * Contenedor de Modal a pantalla: deja espacio bajo el status bar para controles.
 * Usar para sheets/pageSheet con toolbar (X). Fondos full-bleed van fuera o detrás.
 */
export function ModalSafeScreen({ children, backgroundColor, style }: ModalSafeScreenProps) {
  const topInset = useModalTopInset();
  return (
    <View style={[{ flex: 1, paddingTop: topInset, backgroundColor }, style]}>{children}</View>
  );
}

type ModalCloseHeaderProps = {
  title: string;
  onClose: () => void;
  closeDisabled?: boolean;
  right?: React.ReactNode;
};

/** Toolbar superior con botón X; el padre ya debe aplicar inset (ModalSafeScreen). */
export function ModalCloseHeader({ title, onClose, closeDisabled, right }: ModalCloseHeaderProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.toolbar, { borderBottomColor: colors.border }]}>
      <Pressable onPress={onClose} hitSlop={12} disabled={closeDisabled} accessibilityLabel="Cerrar">
        <AppIcon name="close" size={24} color={colors.text} />
      </Pressable>
      <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
        {title}
      </Text>
      {right ?? <View style={styles.spacer} />}
    </View>
  );
}

const styles = StyleSheet.create({
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: { ...typography.title, fontSize: 17, textAlign: 'center' },
  spacer: { width: 24 },
});
