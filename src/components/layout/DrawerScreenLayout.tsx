import { View, Text, StyleSheet, ScrollView, type ScrollViewProps } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { useScreenTopInset } from '../../hooks/useSafeAreaLayout';
import { DrawerBackButton } from '../navigation/DrawerBackButton';
import { HEADER_ROW_GAP, SCREEN_PADDING_X } from '../../theme/layout';
import { spacing, typography } from '../../theme/tokens';

interface DrawerScreenLayoutProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  scroll?: boolean;
  contentContainerStyle?: ScrollViewProps['contentContainerStyle'];
}

export function DrawerScreenLayout({
  title,
  subtitle,
  children,
  scroll = true,
  contentContainerStyle,
}: DrawerScreenLayoutProps) {
  const { colors } = useTheme();
  const topInset = useScreenTopInset();

  const header = (
    <View style={[styles.header, { paddingTop: topInset }]}>
      <View style={styles.headerRow}>
        <DrawerBackButton />
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          {subtitle ? (
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
          ) : null}
        </View>
      </View>
    </View>
  );

  if (!scroll) {
    return (
      <View style={[styles.flex, { backgroundColor: colors.background }]}>
        {header}
        <View style={styles.body}>{children}</View>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.flex, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
      keyboardShouldPersistTaps="handled"
    >
      {header}
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scrollContent: { paddingBottom: spacing.xxl, paddingHorizontal: SCREEN_PADDING_X },
  header: { paddingHorizontal: SCREEN_PADDING_X, paddingBottom: spacing.md },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: HEADER_ROW_GAP },
  headerText: { flex: 1 },
  title: { ...typography.display, fontSize: 26, lineHeight: 32 },
  subtitle: { fontSize: 14, lineHeight: 20, marginTop: 4 },
  body: { flex: 1, paddingHorizontal: SCREEN_PADDING_X },
});
