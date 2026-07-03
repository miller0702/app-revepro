import { View, Text, StyleSheet, type LayoutChangeEvent } from 'react-native';
import type { ReactNode } from 'react';
import { useTheme } from '../../hooks/useTheme';
import { DrawerMenuButton } from './DrawerMenuButton';
import { HEADER_ROW_GAP, SCREEN_PADDING_X } from '../../theme/layout';
import { typography } from '../../theme/tokens';

interface ScreenHeaderProps {
  title: string;
  greeting?: string;
  subtitle?: string;
  topInset?: number;
  rightAction?: ReactNode;
  footer?: ReactNode;
  onHeightChange?: (height: number) => void;
}

export function ScreenHeader({
  title,
  greeting,
  subtitle,
  topInset = 0,
  rightAction,
  footer,
  onHeightChange,
}: ScreenHeaderProps) {
  const { colors } = useTheme();

  const onLayout = (event: LayoutChangeEvent) => {
    onHeightChange?.(event.nativeEvent.layout.height + topInset);
  };

  return (
    <View style={[styles.wrap, { paddingTop: topInset }]} onLayout={onLayout}>
      <View style={styles.row}>
        <DrawerMenuButton />
        <View style={styles.text}>
          {greeting ? (
            <Text style={[styles.greeting, { color: colors.textSecondary }]}>{greeting}</Text>
          ) : null}
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={[styles.subtitle, { color: colors.textSecondary }]} numberOfLines={2}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {rightAction ?? <View style={styles.rightPlaceholder} />}
      </View>
      {footer}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: SCREEN_PADDING_X,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: HEADER_ROW_GAP,
  },
  text: { flex: 1, minWidth: 0 },
  greeting: { ...typography.label, fontSize: 11 },
  title: { ...typography.display, fontSize: 26, lineHeight: 32, marginTop: 2, marginBottom: 2 },
  subtitle: { fontSize: 11, marginTop: 2, letterSpacing: 0.3, lineHeight: 16 },
  rightPlaceholder: { width: 44, height: 44 },
});
