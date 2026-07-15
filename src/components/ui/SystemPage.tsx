import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { AppIcon, type AppIconName } from './AppIcon';
import { Button } from './Button';
import { Screen } from './Screen';
import { typography, spacing, radius } from '../../theme/tokens';

type SystemAction = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
};

export interface SystemPageProps {
  icon: AppIconName;
  code?: string;
  title: string;
  message: string;
  primaryAction?: SystemAction;
  secondaryAction?: SystemAction;
  /** Acciones adicionales (p. ej. Reintentar debajo de descargas / estudio). */
  extraActions?: SystemAction[];
  style?: ViewStyle;
}

export function SystemPage({
  icon,
  code,
  title,
  message,
  primaryAction,
  secondaryAction,
  extraActions,
  style,
}: SystemPageProps) {
  const { colors } = useTheme();

  return (
    <Screen style={style ? { ...styles.screen, ...style } : styles.screen} padded={false}>
      <View style={styles.content}>
        <View style={[styles.iconWrap, { backgroundColor: colors.accentSoft, borderColor: colors.border }]}>
          <AppIcon name={icon} size={48} color={colors.primary} />
        </View>
        {code && (
          <Text style={[styles.code, { color: colors.primary }]}>{code}</Text>
        )}
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text>
        <View style={styles.actions}>
          {primaryAction && (
            <Button
              title={primaryAction.label}
              onPress={primaryAction.onPress}
              variant={primaryAction.variant}
              style={styles.btn}
            />
          )}
          {secondaryAction && (
            <Button
              title={secondaryAction.label}
              onPress={secondaryAction.onPress}
              variant={secondaryAction.variant ?? 'outline'}
              style={styles.btn}
            />
          )}
          {extraActions?.map((action) => (
            <Button
              key={action.label}
              title={action.label}
              onPress={action.onPress}
              variant={action.variant ?? 'ghost'}
              style={styles.btn}
            />
          ))}
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { justifyContent: 'center' },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
  },
  iconWrap: {
    width: 96,
    height: 96,
    borderRadius: radius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  code: { ...typography.label, marginBottom: spacing.sm },
  title: { ...typography.title, textAlign: 'center', marginBottom: spacing.md },
  message: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    maxWidth: 320,
    marginBottom: spacing.xl,
  },
  actions: { width: '100%', maxWidth: 320, gap: spacing.sm },
  btn: { width: '100%' },
});
