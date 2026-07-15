import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { DrawerScreenLayout } from '../../src/components/layout/DrawerScreenLayout';
import { useTheme } from '../../src/hooks/useTheme';
import { useManualSections } from '../../src/hooks/useManualSections';
import { spacing, radius } from '../../src/theme/tokens';

function bodyParagraphs(body: string) {
  return body
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

export default function ManualScreen() {
  const { colors } = useTheme();
  const { data: sections, isLoading } = useManualSections();

  const visible = (sections ?? []).filter((s) => s.isVisible).sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <DrawerScreenLayout title="Manual de usuario" subtitle="Guía paso a paso de RESVEPRO">
      <View style={styles.content}>
        {isLoading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.lg }} />
        ) : (
          visible.map((section) => (
            <View
              key={section.code}
              style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <Text style={[styles.cardTitle, { color: colors.text }]}>{section.title}</Text>
              {bodyParagraphs(section.body).map((paragraph, index) => (
                <Text
                  key={`${section.code}-${index}`}
                  style={[
                    styles.cardBody,
                    { color: colors.textSecondary },
                    index > 0 && styles.cardBodyGap,
                  ]}
                >
                  {paragraph}
                </Text>
              ))}
            </View>
          ))
        )}
      </View>
    </DrawerScreenLayout>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xl },
  card: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  cardBody: { fontSize: 14, lineHeight: 21 },
  cardBodyGap: { marginTop: 10 },
});
