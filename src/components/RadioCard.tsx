import { Pressable, Text, StyleSheet, View } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { AppIcon } from './ui/AppIcon';
import { radius, typography, spacing } from '../theme/tokens';

interface RadioCardProps {
  name: string;
  description?: string | null;
  isLive?: boolean;
  isActive?: boolean;
  index?: number;
  onPress: () => void;
}

const coverColors = ['#1a2830', '#2d2416', '#1a2e1a', '#2a1a30'];

export function RadioCard({
  name,
  description,
  isLive,
  isActive,
  index = 0,
  onPress,
}: RadioCardProps) {
  const { colors } = useTheme();
  const coverColor = coverColors[index % coverColors.length];

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: isActive ? colors.accentSoft : colors.surface,
          borderColor: isActive ? colors.primary : colors.border,
          opacity: pressed ? 0.9 : 1,
        },
      ]}
    >
      <View style={[styles.cover, { backgroundColor: coverColor }]}>
        <AppIcon name="radio" size={28} color={colors.onHero} />
        {isLive && (
          <View style={[styles.liveBadge, { backgroundColor: colors.error }]}>
            <Text style={[styles.liveText, { color: colors.onHero }]}>EN VIVO</Text>
          </View>
        )}
      </View>
      <Text style={[styles.name, { color: colors.text }]} numberOfLines={2}>
        {name}
      </Text>
      {description && (
        <Text style={[styles.description, { color: colors.textSecondary }]} numberOfLines={2}>
          {description}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 140,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.sm,
    marginRight: spacing.md,
  },
  cover: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    position: 'relative',
  },
  liveBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  liveText: { ...typography.label, fontSize: 9 },
  name: { ...typography.caption, fontWeight: '700', marginBottom: 4 },
  description: { fontSize: 11, lineHeight: 15 },
});
