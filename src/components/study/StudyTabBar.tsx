import { ScrollView, Pressable, Text, StyleSheet, View } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { AppIcon, type AppIconName } from '../ui/AppIcon';
import { radius, spacing } from '../../theme/tokens';

export type StudyTab = 'folders' | 'notes' | 'highlights' | 'reading';

type TabConfig = {
  id: StudyTab;
  label: string;
  icon: AppIconName;
  count?: number;
};

type Props = {
  tabs: TabConfig[];
  activeTab: StudyTab;
  onChange: (tab: StudyTab) => void;
};

export function StudyTabBar({ tabs, activeTab, onChange }: Props) {
  const { colors } = useTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      style={styles.scroll}
    >
      {tabs.map((tab) => {
        const selected = activeTab === tab.id;
        return (
          <Pressable
            key={tab.id}
            onPress={() => onChange(tab.id)}
            style={[
              styles.tab,
              {
                backgroundColor: selected ? colors.primary : colors.surface,
                borderColor: selected ? colors.primary : colors.border,
              },
            ]}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
          >
            <AppIcon
              name={tab.icon}
              size={16}
              color={selected ? colors.onPrimary : colors.textSecondary}
            />
            <Text style={[styles.tabLabel, { color: selected ? colors.onPrimary : colors.text }]}>
              {tab.label}
            </Text>
            {tab.count != null && tab.count > 0 ? (
              <View
                style={[
                  styles.badge,
                  { backgroundColor: selected ? colors.onPrimary + '33' : colors.background },
                ]}
              >
                <Text
                  style={[
                    styles.badgeText,
                    { color: selected ? colors.onPrimary : colors.textSecondary },
                  ]}
                >
                  {tab.count}
                </Text>
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { marginBottom: spacing.lg },
  row: { gap: spacing.sm, paddingRight: spacing.sm },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  tabLabel: { fontWeight: '700', fontSize: 13 },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: { fontSize: 11, fontWeight: '800' },
});
