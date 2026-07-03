import { Pressable, ScrollView, Text, StyleSheet, View } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { radius, spacing, typography } from '../../theme/tokens';
import { FilterChipsSkeleton } from '../skeletons/ContentSkeletons';

export type ContentFilterTab = 'reading' | 'categories' | 'collections';

export interface FilterOption {
  id: string;
  label: string;
}

interface ContentFilterBarProps {
  categories: FilterOption[];
  collections?: FilterOption[];
  selectedCategoryId: string | null;
  selectedCollectionId: string | null;
  activeTab: ContentFilterTab;
  onTabChange: (tab: ContentFilterTab) => void;
  onCategoryChange: (id: string | null) => void;
  onCollectionChange: (id: string | null) => void;
  showCollections?: boolean;
  showReadingTab?: boolean;
  readingCount?: number;
  loading?: boolean;
  topSpacing?: number;
}

export function ContentFilterBar({
  categories,
  collections = [],
  selectedCategoryId,
  selectedCollectionId,
  activeTab,
  onTabChange,
  onCategoryChange,
  onCollectionChange,
  showCollections = false,
  showReadingTab = false,
  readingCount = 0,
  loading = false,
  topSpacing = 0,
}: ContentFilterBarProps) {
  const { colors } = useTheme();

  const chips =
    showCollections && activeTab === 'collections'
      ? collections
      : categories;

  const selectedId =
    showCollections && activeTab === 'collections'
      ? selectedCollectionId
      : selectedCategoryId;

  const onSelect =
    showCollections && activeTab === 'collections'
      ? onCollectionChange
      : onCategoryChange;

  if (loading) {
    return <FilterChipsSkeleton />;
  }

  const hasChips =
    activeTab !== 'reading' &&
    (categories.length > 0 || (showCollections && collections.length > 0));

  if (!showReadingTab && !hasChips) {
    return null;
  }

  const showSegmented =
    showReadingTab || (showCollections && collections.length > 0);

  return (
    <View style={[styles.wrap, topSpacing > 0 && { marginTop: topSpacing }]}>
      {showSegmented ? (
        <View style={[styles.tabs, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {showReadingTab ? (
            <Pressable
              onPress={() => onTabChange('reading')}
              style={[styles.tab, activeTab === 'reading' && { backgroundColor: colors.primary }]}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: activeTab === 'reading' ? colors.onPrimary : colors.text },
                ]}
                numberOfLines={1}
              >
                Leyendo
              </Text>
              {readingCount > 0 ? (
                <View
                  style={[
                    styles.countBadge,
                    {
                      backgroundColor:
                        activeTab === 'reading' ? 'rgba(255,255,255,0.22)' : colors.background,
                      borderColor:
                        activeTab === 'reading' ? 'rgba(255,255,255,0.35)' : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.countText,
                      {
                        color:
                          activeTab === 'reading' ? colors.onPrimary : colors.textSecondary,
                      },
                    ]}
                  >
                    {readingCount > 99 ? '99+' : readingCount}
                  </Text>
                </View>
              ) : null}
            </Pressable>
          ) : null}
          <Pressable
            onPress={() => onTabChange('categories')}
            style={[styles.tab, activeTab === 'categories' && { backgroundColor: colors.primary }]}
          >
            <Text
              style={[
                styles.tabText,
                { color: activeTab === 'categories' ? colors.onPrimary : colors.textSecondary },
              ]}
            >
              Categorías
            </Text>
          </Pressable>
          {showCollections && collections.length > 0 ? (
            <Pressable
              onPress={() => onTabChange('collections')}
              style={[styles.tab, activeTab === 'collections' && { backgroundColor: colors.primary }]}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: activeTab === 'collections' ? colors.onPrimary : colors.textSecondary },
                ]}
              >
                Colecciones
              </Text>
            </Pressable>
          ) : null}
        </View>
      ) : (
        <Text style={[styles.label, { color: colors.textSecondary }]}>Categorías</Text>
      )}

      {hasChips ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
        >
          <FilterChip
            label="Todos"
            selected={selectedId === null}
            onPress={() => onSelect(null)}
          />
          {chips.map((item) => (
            <FilterChip
              key={item.id}
              label={item.label}
              selected={selectedId === item.id}
              onPress={() => onSelect(item.id)}
            />
          ))}
        </ScrollView>
      ) : activeTab === 'reading' ? (
        <Text style={[styles.readingHint, { color: colors.textSecondary }]}>
          Libros en curso y los que estás analizando con notas o subrayados.
        </Text>
      ) : null}
    </View>
  );
}

function FilterChip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: selected ? colors.primary : colors.surface,
          borderColor: selected ? colors.primary : colors.border,
          opacity: pressed ? 0.88 : 1,
        },
      ]}
    >
      <Text
        style={[styles.chipText, { color: selected ? colors.onPrimary : colors.text }]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.md },
  label: { ...typography.label, marginBottom: spacing.sm },
  tabs: {
    flexDirection: 'row',
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: 4,
    gap: 4,
    marginBottom: spacing.sm,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.md,
  },
  tabText: { ...typography.caption, fontWeight: '700' },
  countBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: radius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  countText: { fontSize: 10, fontWeight: '700', lineHeight: 12 },
  readingHint: {
    ...typography.caption,
    lineHeight: 18,
    marginBottom: spacing.xs,
  },
  chipsRow: {
    gap: spacing.sm,
    paddingRight: spacing.lg,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    maxWidth: 200,
  },
  chipText: { ...typography.caption, fontWeight: '600' },
});
