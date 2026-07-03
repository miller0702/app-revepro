import { Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { AppIcon } from './AppIcon';
import { useTheme } from '../../hooks/useTheme';
import { useFavoriteToggle } from '../../hooks/useFavorite';
import type { FavoriteTargetType } from '../../api/library';

interface FavoriteToggleProps {
  targetType: FavoriteTargetType;
  targetId: string | undefined;
  size?: number;
}

export function FavoriteToggle({ targetType, targetId, size = 24 }: FavoriteToggleProps) {
  const { colors } = useTheme();
  const { isFavorite, toggle, isPending } = useFavoriteToggle(targetType, targetId);

  return (
    <Pressable onPress={toggle} hitSlop={10} style={styles.btn} disabled={isPending || !targetId}>
      {isPending ? (
        <ActivityIndicator size="small" color={colors.primary} />
      ) : (
        <AppIcon
          name={isFavorite ? 'favorites-filled' : 'favorites'}
          size={size}
          color={isFavorite ? colors.primary : colors.textSecondary}
        />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: { padding: 4 },
});
