import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../hooks/useTheme';
import { useSettingsStore } from '../stores/settingsStore';
import { AppIcon } from './ui/AppIcon';
import { spacing, radius } from '../theme/tokens';

interface ReaderControlsProps {
  highlightMode: boolean;
  onToggleHighlightMode: () => void;
  selectionText: string | null;
  onSaveHighlight: () => void;
  onPublishQuote: () => void;
  onClearSelection: () => void;
}

export function ReaderControls({
  highlightMode,
  onToggleHighlightMode,
  selectionText,
  onSaveHighlight,
  onPublishQuote,
  onClearSelection,
}: ReaderControlsProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const fontSize = useSettingsStore((s) => s.fontSize);
  const setFontSize = useSettingsStore((s) => s.setFontSize);
  const setTheme = useSettingsStore((s) => s.setTheme);
  const theme = useSettingsStore((s) => s.theme);

  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
      {selectionText && highlightMode && (
        <View style={[styles.selectionBar, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
          <Text style={[styles.selectionPreview, { color: colors.text }]} numberOfLines={2}>
            "{selectionText}"
          </Text>
          <View style={styles.selectionActions}>
            <Pressable onPress={onSaveHighlight} style={[styles.actionChip, { backgroundColor: colors.accentSoft }]}>
              <Text style={[styles.actionChipText, { color: colors.accent }]}>Subrayar</Text>
            </Pressable>
            <Pressable onPress={onPublishQuote} style={[styles.actionChip, { backgroundColor: colors.primary }]}>
              <Text style={[styles.actionChipText, { color: colors.onPrimary }]}>Publicar</Text>
            </Pressable>
            <Pressable onPress={onClearSelection} hitSlop={8}>
              <AppIcon name="close" size={20} color={colors.textSecondary} />
            </Pressable>
          </View>
        </View>
      )}

      <View style={[styles.bar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Pressable onPress={() => setFontSize(fontSize - 2)} hitSlop={8}>
          <Text style={{ color: colors.primary, fontSize: 18 }}>A-</Text>
        </Pressable>
        <Text style={{ color: colors.text }}>{fontSize}px</Text>
        <Pressable onPress={() => setFontSize(fontSize + 2)} hitSlop={8}>
          <Text style={{ color: colors.primary, fontSize: 22 }}>A+</Text>
        </Pressable>
        <Pressable onPress={() => setTheme(theme === 'dark' ? 'light' : 'dark')} hitSlop={8}>
          <Text style={{ color: colors.primary }}>{theme === 'dark' ? '☀️' : '🌙'}</Text>
        </Pressable>
        <Pressable
          onPress={onToggleHighlightMode}
          hitSlop={8}
          style={[
            styles.highlightBtn,
            highlightMode && { backgroundColor: colors.primary + '33', borderRadius: radius.full },
          ]}
        >
          <AppIcon
            name="compose"
            size={22}
            color={highlightMode ? colors.primary : colors.textSecondary}
          />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'transparent',
  },
  selectionBar: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  selectionPreview: { fontSize: 13, fontStyle: 'italic', lineHeight: 18 },
  selectionActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  actionChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.full },
  actionChipText: { fontSize: 13, fontWeight: '700' },
  bar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    minHeight: 52,
  },
  highlightBtn: { padding: 4 },
});
