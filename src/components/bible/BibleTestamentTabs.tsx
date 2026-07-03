import { Pressable, Text, StyleSheet, View } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { radius, spacing, typography } from '../../theme/tokens';

export type BibleTestamentTab = 'old' | 'new';

interface BibleTestamentTabsProps {
  active: BibleTestamentTab;
  oldCount: number;
  newCount: number;
  onChange: (tab: BibleTestamentTab) => void;
}

export function BibleTestamentTabs({ active, oldCount, newCount, onChange }: BibleTestamentTabsProps) {
  const { colors } = useTheme();

  const tabs: Array<{ id: BibleTestamentTab; label: string; count: number }> = [
    { id: 'old', label: 'Antiguo Testamento', count: oldCount },
    { id: 'new', label: 'Nuevo Testamento', count: newCount },
  ];

  return (
    <View style={[styles.wrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {tabs.map((tab) => {
        const selected = active === tab.id;
        const countLabel = tab.count > 99 ? '99+' : String(tab.count);

        return (
          <Pressable
            key={tab.id}
            onPress={() => onChange(tab.id)}
            style={[
              styles.tab,
              selected && { backgroundColor: colors.primary },
            ]}
          >
            <Text
              style={[
                styles.tabLabel,
                { color: selected ? colors.onPrimary : colors.text },
              ]}
              numberOfLines={1}
            >
              {tab.label}
            </Text>
            <View
              style={[
                styles.countBadge,
                {
                  backgroundColor: selected ? 'rgba(255,255,255,0.22)' : colors.background,
                  borderColor: selected ? 'rgba(255,255,255,0.35)' : colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.countText,
                  { color: selected ? colors.onPrimary : colors.textSecondary },
                ]}
              >
                {countLabel}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: 4,
    gap: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
  },
  tabLabel: {
    ...typography.caption,
    fontWeight: '600',
    flexShrink: 1,
  },
  countBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: radius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  countText: {
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 13,
  },
});
