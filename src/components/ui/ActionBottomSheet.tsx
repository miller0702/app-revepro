import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../hooks/useTheme';
import { AppIcon, type AppIconName } from './AppIcon';
import { radius, spacing } from '../../theme/tokens';

export type ActionSheetOption = {
  key: string;
  label: string;
  icon?: AppIconName;
  iconColor?: string;
  destructive?: boolean;
  onPress: () => void;
};

type ActionBottomSheetProps = {
  visible: boolean;
  title: string;
  subtitle?: string;
  options: ActionSheetOption[];
  onClose: () => void;
};

export function ActionBottomSheet({
  visible,
  title,
  subtitle,
  options,
  onClose,
}: ActionBottomSheetProps) {
  const { colors, scaleFont } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Cerrar" />
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              paddingBottom: Math.max(insets.bottom, spacing.md),
            },
          ]}
        >
          <View style={[styles.handle, { backgroundColor: colors.border }]} />
          <Text style={[styles.title, { color: colors.text, fontSize: scaleFont(17) }]}>{title}</Text>
          {subtitle ? (
            <Text style={[styles.subtitle, { color: colors.textSecondary, fontSize: scaleFont(13) }]}>
              {subtitle}
            </Text>
          ) : null}

          <View style={[styles.optionsCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
            {options.map((option, index) => {
              const tone = option.destructive ? colors.error : colors.text;
              const iconColor = option.iconColor ?? (option.destructive ? colors.error : colors.primary);
              return (
                <Pressable
                  key={option.key}
                  onPress={() => {
                    onClose();
                    option.onPress();
                  }}
                  style={({ pressed }) => [
                    styles.option,
                    index < options.length - 1 && {
                      borderBottomWidth: StyleSheet.hairlineWidth,
                      borderBottomColor: colors.border,
                    },
                    pressed && styles.pressed,
                  ]}
                >
                  {option.icon ? (
                    <View style={[styles.optionIcon, { backgroundColor: colors.accentSoft }]}>
                      <AppIcon name={option.icon} size={20} color={iconColor} />
                    </View>
                  ) : null}
                  <Text style={[styles.optionLabel, { color: tone, fontSize: scaleFont(15) }]}>
                    {option.label}
                  </Text>
                  <AppIcon name="forward" size={16} color={colors.textSecondary} />
                </Pressable>
              );
            })}
          </View>

          <Pressable
            onPress={onClose}
            style={({ pressed }) => [
              styles.cancelBtn,
              { backgroundColor: colors.background, borderColor: colors.border },
              pressed && styles.pressed,
            ]}
          >
            <Text style={{ color: colors.text, fontSize: scaleFont(15), fontWeight: '700' }}>Cancelar</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

type ConfirmBottomSheetProps = {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onClose: () => void;
  loading?: boolean;
};

export function ConfirmBottomSheet({
  visible,
  title,
  message,
  confirmLabel = 'Eliminar',
  onConfirm,
  onClose,
  loading = false,
}: ConfirmBottomSheetProps) {
  const { colors, scaleFont } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Cerrar" />
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              paddingBottom: Math.max(insets.bottom, spacing.md),
            },
          ]}
        >
          <View style={[styles.handle, { backgroundColor: colors.border }]} />
          <View style={[styles.confirmIcon, { backgroundColor: colors.error + '18' }]}>
            <AppIcon name="trash" size={26} color={colors.error} />
          </View>
          <Text style={[styles.title, { color: colors.text, fontSize: scaleFont(17) }]}>{title}</Text>
          <Text style={[styles.confirmMessage, { color: colors.textSecondary, fontSize: scaleFont(14) }]}>
            {message}
          </Text>

          <Pressable
            onPress={onConfirm}
            disabled={loading}
            style={({ pressed }) => [
              styles.destructiveBtn,
              { backgroundColor: colors.error, opacity: loading || pressed ? 0.85 : 1 },
            ]}
          >
            <Text style={[styles.destructiveBtnText, { fontSize: scaleFont(15) }]}>{confirmLabel}</Text>
          </Pressable>

          <Pressable
            onPress={onClose}
            disabled={loading}
            style={({ pressed }) => [
              styles.cancelBtn,
              { backgroundColor: colors.background, borderColor: colors.border },
              pressed && styles.pressed,
            ]}
          >
            <Text style={{ color: colors.text, fontSize: scaleFont(15), fontWeight: '700' }}>Cancelar</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: 0,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    marginBottom: spacing.md,
  },
  title: { fontWeight: '800', textAlign: 'center' },
  subtitle: { textAlign: 'center', marginTop: spacing.xs, marginBottom: spacing.md, lineHeight: 19 },
  optionsCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  optionIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionLabel: { flex: 1, fontWeight: '600' },
  cancelBtn: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginTop: spacing.xs,
  },
  pressed: { opacity: 0.88 },
  confirmIcon: {
    width: 56,
    height: 56,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  confirmMessage: {
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.sm,
  },
  destructiveBtn: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    marginBottom: spacing.sm,
  },
  destructiveBtnText: { color: '#fff', fontWeight: '800' },
});
