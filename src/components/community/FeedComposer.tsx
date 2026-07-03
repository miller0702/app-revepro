import { Pressable, Text, View, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { UserAvatar } from '../ui/UserAvatar';
import { useAuthStore } from '../../stores/authStore';
import { SCREEN_PADDING_X } from '../../theme/layout';
import { radius, spacing } from '../../theme/tokens';

interface FeedComposerProps {
  onPress: () => void;
  placeholder?: string;
}

export function FeedComposer({
  onPress,
  placeholder = '¿Qué quieres recomendar?',
}: FeedComposerProps) {
  const { colors } = useTheme();
  const user = useAuthStore((s) => s.user);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        { borderBottomColor: colors.border, opacity: pressed ? 0.85 : 1 },
      ]}
      accessibilityRole="button"
      accessibilityLabel={placeholder}
    >
      <UserAvatar
        firstName={user?.firstName ?? 'Usuario'}
        lastName={user?.lastName ?? ''}
        avatarUrl={user?.avatarUrl}
        size={40}
      />
      <View style={[styles.inputPill, { backgroundColor: colors.surface }]}>
        <Text style={[styles.placeholder, { color: colors.textSecondary }]} numberOfLines={1}>
          {placeholder}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: SCREEN_PADDING_X,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  inputPill: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
  },
  placeholder: {
    fontSize: 15,
  },
});
