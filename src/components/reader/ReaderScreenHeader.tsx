import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../hooks/useTheme';
import { DrawerBackButton } from '../navigation/DrawerBackButton';
import { AppIcon } from '../ui/AppIcon';
import { spacing } from '../../theme/tokens';

interface ReaderScreenHeaderProps {
  bookTitle: string;
  chapterTitle: string;
  onOpenChapters: () => void;
}

export function ReaderScreenHeader({ bookTitle, chapterTitle, onOpenChapters }: ReaderScreenHeaderProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.wrap,
        {
          paddingTop: insets.top,
          backgroundColor: colors.background,
          borderBottomColor: colors.border,
        },
      ]}
    >
      <View style={styles.row}>
        <DrawerBackButton />
        <View style={styles.titles}>
          <Text style={[styles.chapterTitle, { color: colors.text }]} numberOfLines={1}>
            {chapterTitle}
          </Text>
          <Text style={[styles.bookTitle, { color: colors.textSecondary }]} numberOfLines={1}>
            {bookTitle}
          </Text>
        </View>
        <Pressable
          onPress={onOpenChapters}
          style={[styles.menuBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
          accessibilityRole="button"
          accessibilityLabel="Abrir capítulos"
        >
          <AppIcon name="list" size={22} color={colors.text} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
    gap: spacing.xs,
  },
  titles: { flex: 1, minWidth: 0 },
  chapterTitle: { fontSize: 17, fontWeight: '700' },
  bookTitle: { fontSize: 12, marginTop: 2, fontWeight: '500' },
  menuBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
